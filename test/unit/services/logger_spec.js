'use strict';

describe('logger service', function () {
  var step = 0;

  beforeEach(function () {
    module('contentful/test');
    this.bugsnag = this.$inject('bugsnag');

    sinon.stub(this.bugsnag, 'enable');
    sinon.stub(this.bugsnag, 'disable');
    sinon.stub(this.bugsnag, 'notify');
    sinon.stub(this.bugsnag, 'notifyException');
    sinon.stub(this.bugsnag, 'refresh');

    this.$state = this.$inject('$state');
    this.$stateParams = this.$inject('$stateParams');
    this.$state.current = {name: 'some.state.name'};
    this.$stateParams.spaceId = '123456';

    this.logger = this.$inject('realLogger');
  });

  it('enables', function () {
    this.logger.enable('USER');
    sinon.assert.calledWithExactly(this.bugsnag.enable, 'USER');
  });

  it('disables', function () {
    this.logger.disable();
    sinon.assert.called(this.bugsnag.disable);
    this.logger.logError('foo');
    sinon.assert.notCalled(this.bugsnag.notify);
  });

  it('logs exceptions', function () {
    var exception = new Error();
    this.logger.logException(exception, {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notifyException,
      exception, null, sinon.match({meta: 'Data'}), 'error');
  });

  it('logs errors', function () {
    this.logger.logError('test', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged Error', 'test', sinon.match({meta: 'Data'}), 'error');
  });

  it('logs warnings', function () {
    this.logger.logWarn('test', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged Warning', 'test', sinon.match({meta: 'Data'}), 'warning');
  });

  it('logs sharejs errors', function () {
    this.logger.logSharejsError('test', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged ShareJS Error', 'test', sinon.match({meta: 'Data'}), 'error');
  });

  it('logs sharejs warnings', function () {
    this.logger.logSharejsWarn('test', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged ShareJS Warning', 'test', sinon.match({meta: 'Data'}), 'warning');
  });

  describe('when receiving error with status code 0', function () {
    it('logs errors as cors warnings', function () {
      this.logger.logServerError('test', {meta: 'Data', error: {statusCode: 0}});
      sinon.assert.calledWith(this.bugsnag.notify, 'CORS Warning', 'test', sinon.match({
        meta: 'Data',
        error: {statusCode: 0}
      }), 'warning');
    });
    it('logs warnings as cors warnings', function () {
      this.logger.logServerWarn('test', {meta: 'Data', error: {statusCode: 0}});
      sinon.assert.calledWith(this.bugsnag.notify, 'CORS Warning', 'test', sinon.match({
        meta: 'Data',
        error: {statusCode: 0}
      }), 'warning');
    });
  });

  describe('message processing', function () {
    beforeEach(function () {
      this.logger.enable({
        firstName: 'Hans',
        lastName: 'Wurst',
        sys: {id: 'h4nswur5t'},
        organizationMemberships: [
          {organization: {name: 'Conglom-O'}},
          {organization: {name: 'ACME'}}
        ]
      });
    });

    it('derives the grouping hash from the message if none provided', function () {
      this.logger.logError('error');
      sinon.assert.calledWith(this.bugsnag.notify,
        'Logged Error', 'error', sinon.match({groupingHash: 'error'}), 'error');
    });

    describe('augmenting metadata', function () {
      it('adds params', function () {
        this.logger.logError('error', {groupingHash: 'grp'});
        var actual = this.bugsnag.notify.args[0][2];
        expect(actual.params.spaceId).toBe('123456');
        expect(actual.params.state).toBe('some.state.name');
        expect(actual.groupingHash).toBe('grp');
        expect(actual.params.screensize).toMatch(/\d+x\d+/);
        expect(actual.params.viewport).toMatch(/\d+x\d+/);
      });

      it('preparses the data property', function () {
        var data = {foo: {bar: {}}};
        data.foo.bar.baz = data;
        this.logger.logError('error', {data: data});
        var actual = this.bugsnag.notify.args[0][2];
        expect(actual.data).toEqual({foo: {bar: {baz: '[Circular ~]'}}});
      });
    });
  });

  var SOME_OBJECT = uniqueObject();
  var SERVER_ERROR = uniqueObject({
    sys: {type: 'Error'}
  });
  var SERVER_ERROR_WITH_DETAILS = uniqueObject({
    sys: SERVER_ERROR.sys,
    details: uniqueObject()
  });
  var SERVER_ERROR_WITH_DETAILS_REPLACED =
    _.extend({}, SERVER_ERROR_WITH_DETAILS, {details: '[@ERROR_DETAILS tab]'});
  var SERVER_REQUEST = uniqueObject({
    headers: uniqueObject({
      Authorization: 'bearer TOKEN'
    })
  });
  var SERVER_REQUEST_WITH_TOKEN_REPLACED = _.cloneDeep(SERVER_REQUEST);
  SERVER_REQUEST_WITH_TOKEN_REPLACED.headers.Authorization = '[SECRET]';
  var RESPONSE = uniqueObject({
    body: SERVER_ERROR_WITH_DETAILS,
    request: SERVER_REQUEST
  });
  var TRANSFORMED_RESPONSE = _.extend({}, RESPONSE, {
    body: SERVER_ERROR_WITH_DETAILS_REPLACED,
    request: SERVER_REQUEST_WITH_TOKEN_REPLACED
  });

  var BASE_META_DATA = {
    groupingHash: jasmine.any(String),
    params: jasmine.any(Object)
  };

  var SERVER_LOGGING_CASES = {
    'response with error in “body” and additional data for some “FOO” tab': {
      data: {
        error: RESPONSE,
        foo: SOME_OBJECT
      },
      expected: {
        serverResponse: TRANSFORMED_RESPONSE,
        errorDetails: SERVER_ERROR_WITH_DETAILS.details,
        foo: SOME_OBJECT
      }
    },
    'response with error in “data”': {
      data: {
        error: renameKey(RESPONSE, 'body', 'data')
      },
      expected: {
        serverResponse: renameKey(TRANSFORMED_RESPONSE, 'body', 'data'),
        errorDetails: SERVER_ERROR_WITH_DETAILS.details
      }
    },
    'actual server error only (not wrapped in response) without error details': {
      data: {
        error: SERVER_ERROR,
        foo: SOME_OBJECT
      },
      expected: {
        error: SERVER_ERROR,
        foo: SOME_OBJECT
      }
    },
    'actual server error only (not wrapped in response) with error details': {
      data: {
        error: SERVER_ERROR_WITH_DETAILS
      },
      expected: {
        error: SERVER_ERROR_WITH_DETAILS_REPLACED,
        errorDetails: SERVER_ERROR_WITH_DETAILS.details
      }
    }
  };

  _.each(SERVER_LOGGING_CASES, function (testCase, descriptionMsg) {
    var msg = ' for ' + descriptionMsg;

    describe('#logServerError()' + msg, testServerErrorLogging.bind(
      null, 'logServerError', 'Error', testCase));

    describe('#logServerWarn()' + msg, testServerErrorLogging.bind(
      null, 'logServerWarn', 'Warning', testCase));
  });

  function testServerErrorLogging (fnName, severity, testCase) {
    var severityLC = severity.toLowerCase();

    beforeEach(function () {
      var metaData = testCase.data;
      this.logger[fnName]('LOG_MSG', metaData);
      this.transformedData = this.bugsnag.notify.firstCall.args[2];
    });

    it('logs a server ' + severityLC, function () {
      var loggingType = 'Logged Server ' + severity;
      sinon.assert.calledOnce(this.bugsnag.notify);
      sinon.assert.calledWithExactly(this.bugsnag.notify,
        loggingType, 'LOG_MSG', sinon.match.object, severityLC);
    });

    _.each(testCase.expected, function (value, name) {
      var tabName = name.replace(/([A-Z])/g, ' $1').toUpperCase();

      describe('“' + tabName + '” tab on Bugsnag', function () {
        it('will be present', function () {
          expect(this.transformedData[name]).toEqual(jasmine.any(Object));
        });

        it('has transformed data as expected', function () {
          var tabData = this.transformedData[name];
          expect(tabData).toEqual(value);
        });
      });
    });

    it('transforms all metaData as expected', function () {
      var expectedMetaData = jasmine.objectContaining(
        _.extend({}, BASE_META_DATA, testCase.expected));

      expect(this.transformedData).toEqual(expectedMetaData);
    });
  }

  function renameKey (obj, name, newName) {
    obj = _.cloneDeep(obj);
    obj[newName] = obj[name];
    delete obj[name];
    return obj;
  }

  function uniqueObject (obj) {
    var o = {};
    o['unique_property_' + (++step)] = 'unique property value ' + step;
    return _.extend(o, obj);
  }
});
