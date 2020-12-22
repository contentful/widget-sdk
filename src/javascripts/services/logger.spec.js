import _ from 'lodash';
import * as logger from './logger';
import * as Bugsnag from 'analytics/Bugsnag';

jest.mock('analytics/Bugsnag', () => ({
  enable: jest.fn(),
  disable: jest.fn(),
  notify: jest.fn(),
  notifyException: jest.fn(),
}));

jest.mock('analytics/Sentry');

describe('logger service', () => {
  let step = 0;

  it('enables', function () {
    logger.enable('USER');
    expect(Bugsnag.enable).toHaveBeenCalledWith('USER');
  });

  it('disables', function () {
    logger.disable();
    expect(Bugsnag.disable).toHaveBeenCalled();
  });

  it('logs exceptions', function () {
    const exception = new Error();
    logger.logException(exception, { meta: 'Data' });

    expect(Bugsnag.notifyException).toHaveBeenCalledWith(
      exception,
      null,
      { meta: 'Data', params: {} },
      'error'
    );
  });

  it('logs errors', function () {
    logger.logError('test', { meta: 'Data' });
    expect(Bugsnag.notify).toHaveBeenCalledWith(
      'Logged Error',
      'test',
      { groupingHash: 'test', meta: 'Data', params: {} },
      'error'
    );
  });

  it('does not log errors with empty messages', function () {
    logger.logError();

    expect(Bugsnag.notify).not.toHaveBeenCalled();

    logger.logError(null, { meta: 'Something' });

    expect(Bugsnag.notify).not.toHaveBeenCalled();

    logger.logError('', { meta: 'Something else' });

    expect(Bugsnag.notify).not.toHaveBeenCalled();
  });

  it('handles messages that are of type Error as well as String', function () {
    const err = new Error('Oops something went wrong');
    const errMsg = 'Wowzers this is messed up';

    logger.logError(errMsg);

    expect(Bugsnag.notify).toHaveBeenCalledWith(
      'Logged Error',
      errMsg,
      expect.objectContaining({}),
      'error'
    );

    logger.logError(err);

    expect(Bugsnag.notify).toHaveBeenCalledWith(
      'Logged Error',
      err.message,
      expect.objectContaining({}),
      'error'
    );
  });

  it('logs warnings', function () {
    logger.logWarn('test', { meta: 'Data' });
    expect(Bugsnag.notify).toHaveBeenCalledWith(
      'Logged Warning',
      'test',
      expect.objectContaining({ meta: 'Data' }),
      'warning'
    );
  });

  it('logs sharejs errors', function () {
    logger.logSharejsError('test', { meta: 'Data' });
    expect(Bugsnag.notify).toHaveBeenCalledWith(
      'Logged ShareJS Error',
      'test',
      expect.objectContaining({ meta: 'Data' }),
      'error'
    );
  });

  it('logs sharejs warnings', function () {
    logger.logSharejsWarn('test', { meta: 'Data' });
    expect(Bugsnag.notify).toHaveBeenCalledWith(
      'Logged ShareJS Warning',
      'test',
      expect.objectContaining({ meta: 'Data' }),
      'warning'
    );
  });

  describe('when receiving error with status code 0', () => {
    it('logs errors as cors warnings', function () {
      logger.logServerError('test', { meta: 'Data', error: { statusCode: 0 } });
      expect(Bugsnag.notify).toHaveBeenCalledWith(
        'CORS Warning',
        'test',
        expect.objectContaining({
          meta: 'Data',
          error: { statusCode: 0 },
        }),
        'warning'
      );
    });
    it('logs warnings as cors warnings', function () {
      logger.logServerWarn('test', { meta: 'Data', error: { statusCode: 0 } });
      expect(Bugsnag.notify).toHaveBeenCalledWith(
        'CORS Warning',
        'test',
        expect.objectContaining({
          meta: 'Data',
          error: { statusCode: 0 },
        }),
        'warning'
      );
    });
  });

  describe('message processing', () => {
    beforeEach(function () {
      logger.enable({
        firstName: 'Hans',
        lastName: 'Wurst',
        sys: { id: 'h4nswur5t' },
        organizationMemberships: [
          { organization: { name: 'Conglom-O', sys: { id: 'org_1234' } } },
          { organization: { name: 'ACME', sys: { id: 'org_1234' } } },
        ],
      });
    });

    it('derives the grouping hash from the message if none provided', function () {
      logger.logError('error');
      expect(Bugsnag.notify).toHaveBeenCalledWith(
        'Logged Error',
        'error',
        expect.objectContaining({ groupingHash: 'error' }),
        'error'
      );
    });

    describe('augmenting metadata', () => {
      it('preparses the data property', function () {
        const data = { foo: { bar: {} } };
        data.foo.bar.baz = data;
        logger.logError('error', { data: data });
        const actual = Bugsnag.notify.mock.calls[0][2];
        expect(actual.data).toEqual({ foo: { bar: { baz: '[Circular ~]' } } });
      });
    });
  });

  const SOME_OBJECT = uniqueObject();
  const SERVER_ERROR = uniqueObject({
    sys: { type: 'Error' },
  });
  const SERVER_ERROR_WITH_DETAILS = uniqueObject({
    sys: SERVER_ERROR.sys,
    details: uniqueObject(),
  });
  const SERVER_ERROR_WITH_DETAILS_REPLACED = _.extend({}, SERVER_ERROR_WITH_DETAILS, {
    details: '[@ERROR_DETAILS tab]',
  });
  const SERVER_REQUEST = uniqueObject({
    headers: uniqueObject({
      Authorization: 'bearer TOKEN',
    }),
  });
  const SERVER_REQUEST_WITH_TOKEN_REPLACED = _.cloneDeep(SERVER_REQUEST);
  SERVER_REQUEST_WITH_TOKEN_REPLACED.headers.Authorization = '[SECRET]';
  const RESPONSE = uniqueObject({
    body: SERVER_ERROR_WITH_DETAILS,
    request: SERVER_REQUEST,
  });
  const TRANSFORMED_RESPONSE = _.extend({}, RESPONSE, {
    body: SERVER_ERROR_WITH_DETAILS_REPLACED,
    request: SERVER_REQUEST_WITH_TOKEN_REPLACED,
  });

  const BASE_META_DATA = {
    groupingHash: expect.any(String),
    params: expect.any(Object),
  };

  const SERVER_LOGGING_CASES = {
    'response with error in “body” and additional data for some “FOO” tab': {
      data: {
        error: RESPONSE,
        foo: SOME_OBJECT,
      },
      expected: {
        serverResponse: TRANSFORMED_RESPONSE,
        errorDetails: SERVER_ERROR_WITH_DETAILS.details,
        foo: SOME_OBJECT,
      },
    },
    'response with error in “data”': {
      data: {
        error: renameKey(RESPONSE, 'body', 'data'),
      },
      expected: {
        serverResponse: renameKey(TRANSFORMED_RESPONSE, 'body', 'data'),
        errorDetails: SERVER_ERROR_WITH_DETAILS.details,
      },
    },
    'actual server error only (not wrapped in response) without error details': {
      data: {
        error: SERVER_ERROR,
        foo: SOME_OBJECT,
      },
      expected: {
        error: SERVER_ERROR,
        foo: SOME_OBJECT,
      },
    },
    'actual server error only (not wrapped in response) with error details': {
      data: {
        error: SERVER_ERROR_WITH_DETAILS,
      },
      expected: {
        error: SERVER_ERROR_WITH_DETAILS_REPLACED,
        errorDetails: SERVER_ERROR_WITH_DETAILS.details,
      },
    },
  };

  _.each(SERVER_LOGGING_CASES, (testCase, descriptionMsg) => {
    const msg = ' for ' + descriptionMsg;

    describe(
      '#logServerError()' + msg,
      testServerErrorLogging.bind(null, 'logServerError', 'Error', testCase)
    );

    describe(
      '#logServerWarn()' + msg,
      testServerErrorLogging.bind(null, 'logServerWarn', 'Warning', testCase)
    );
  });

  function testServerErrorLogging(fnName, severity, testCase) {
    const severityLC = severity.toLowerCase();

    let transformedData;

    beforeEach(function () {
      const metaData = testCase.data;
      logger[fnName]('LOG_MSG', metaData);
      transformedData = Bugsnag.notify.mock.calls[0][2];
    });

    it('logs a server ' + severityLC, function () {
      const loggingType = 'Logged Server ' + severity;
      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      expect(Bugsnag.notify).toHaveBeenCalledWith(
        loggingType,
        'LOG_MSG',
        expect.objectContaining({}),
        severityLC
      );
    });

    _.each(testCase.expected, (value, name) => {
      const tabName = name.replace(/([A-Z])/g, ' $1').toUpperCase();

      describe('“' + tabName + '” tab on Bugsnag', () => {
        it('will be present', function () {
          expect(transformedData[name]).toEqual(expect.any(Object));
        });

        it('has transformed data as expected', function () {
          const tabData = transformedData[name];
          expect(tabData).toEqual(value);
        });
      });
    });

    it('transforms all metaData as expected', function () {
      const expectedMetaData = expect.objectContaining(
        _.extend({}, BASE_META_DATA, testCase.expected)
      );

      expect(transformedData).toEqual(expectedMetaData);
    });
  }

  function renameKey(obj, name, newName) {
    obj = _.cloneDeep(obj);
    obj[newName] = obj[name];
    delete obj[name];
    return obj;
  }

  function uniqueObject(obj) {
    const o = {};
    o['unique_property_' + ++step] = 'unique property value ' + step;
    return _.extend(o, obj);
  }
});
