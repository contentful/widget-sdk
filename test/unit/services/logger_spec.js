'use strict';

describe('logger service', function () {
  beforeEach(function(){
    module('contentful/test');
    this.bugsnag = this.$inject('bugsnag');

    sinon.stub(this.bugsnag, 'enable');
    sinon.stub(this.bugsnag, 'disable');
    sinon.stub(this.bugsnag, 'notify');
    sinon.stub(this.bugsnag, 'notifyException');
    sinon.stub(this.bugsnag, 'refresh');

    this.$state = this.$inject('$state');
    this.$stateParams = this.$inject('$stateParams');
    this.$state.current = { name: 'some.state.name' };
    this.$stateParams.spaceId = '123456';

    this.logger = this.$inject('realLogger');
  });

  it('should enable', function(){
    this.logger.enable();
    sinon.assert.called(this.bugsnag.enable);
  });

  it('should disable', function(){
    this.logger.disable();
    sinon.assert.called(this.bugsnag.disable);
    this.logger.logError('foo');
    sinon.assert.notCalled(this.bugsnag.notify);
  });

  it('should log exceptions', function(){
    var exception = new Error();
    this.logger.logException(exception, {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notifyException,
      exception, null, sinon.match({meta: 'Data'}), 'error');
  });

  it('should log errors', function(){
    this.logger.logError('test', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged Error', 'test', sinon.match({meta: 'Data'}), 'error');
  });

  it('should log warnings', function(){
    this.logger.logWarn('test', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged Warning', 'test', sinon.match({meta: 'Data'}), 'warning');
  });

  it('should log server errors', function(){
    this.logger.logServerError('test', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged Server Error', 'test', sinon.match({meta: 'Data'}), 'error');
  });

  it('should log server warnings', function(){
    this.logger.logServerWarn('test', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged Server Warning', 'test', sinon.match({meta: 'Data'}), 'warning');
  });

  it('should log sharejs errors', function(){
    this.logger.logSharejsError('test', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged ShareJS Error', 'test', sinon.match({meta: 'Data'}), 'error');
  });

  it('should log sharejs warnings', function(){
    this.logger.logSharejsWarn('test', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged ShareJS Warning', 'test', sinon.match({meta: 'Data'}), 'warning');
  });

  describe('when receiving error with status code 0', function(){
    it('should log errors as cors warnings', function(){
      this.logger.logServerError('test', {meta: 'Data', error: {statusCode: 0}});
      sinon.assert.calledWith(this.bugsnag.notify, 'CORS Warning', 'test', sinon.match({meta: 'Data', error: {statusCode: 0}}), 'warning');
    });
    it('should log warnings as cors warnings', function(){
      this.logger.logServerWarn('test', {meta: 'Data', error: {statusCode: 0}});
      sinon.assert.calledWith(this.bugsnag.notify, 'CORS Warning', 'test', sinon.match({meta: 'Data', error: {statusCode: 0}}), 'warning');
    });
  });

  describe('message processing', function(){
    beforeEach(function(){
      this.authentication = this.$inject('authentication');
      sinon.stub(this.authentication, 'getUser').returns({
        firstName: 'Hans',
        lastName: 'Wurst',
        sys: { id: 'h4nswur5t' },
        organizationMemberships: [
          {organization: {name: 'Conglom-O' }},
          {organization: {name: 'ACME' }}
        ]
      });
      sinon.stub(this.bugsnag, 'needsUser').returns(true);
      sinon.stub(this.bugsnag, 'setUser');
    });

    it('should set user info before logging', function(){
      this.logger.logError('error');
      sinon.assert.calledWith(this.bugsnag.setUser, {
        firstName:      'Hans',
        lastName:       'Wurst',
        id:             'h4nswur5t',
        organizations:  'Conglom-O, ACME',
        adminLink:      'https://admin.contentful.com/admin/users/h4nswur5t',
      });
    });

    it('should derive the grouping hash from the message if none provided', function(){
      this.logger.logError('error');
      sinon.assert.calledWith(this.bugsnag.notify,
        'Logged Error', 'error', sinon.match({ groupingHash: 'error' }), 'error');
    });

    describe('augmenting metadata', function(){
      it('should add params', function(){
        this.logger.logError('error', {groupingHash: 'grp'});
        var actual = this.bugsnag.notify.args[0][2];
        expect(actual.params.spaceId).toBe('123456');
        expect(actual.params.state).toBe('some.state.name');
        expect(actual.groupingHash).toBe('grp');
        expect(actual.params.screensize).toMatch(/\d+x\d+/);
        expect(actual.params.viewport).toMatch(/\d+x\d+/);
      });

      it('should preparse the data property', function(){
        var data = { foo: { bar: {} } };
        data.foo.bar.baz = data;
        this.logger.logError('error', {data: data});
        var actual = this.bugsnag.notify.args[0][2];
        expect(actual.data).toEqual({ foo: { bar: { baz: '[Circular ~]' } } });
      });
    });
  });

});
