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

    this.routing = this.$inject('routing');
    sinon.stub(this.routing, 'getRoute').returns({
      params: {viewType: 'testView'},
      pathParams: {spaceId: '123456'}
    });

    this.logger = this.$inject('realLogger');
  });
  
  it('should enable', function(){
    this.logger.enable();
    sinon.assert.called(this.bugsnag.enable);
  });

  it('should disable', function(){
    this.logger.disable();
    sinon.assert.called(this.bugsnag.disable);
    this.logger.log('foo');
    sinon.assert.notCalled(this.bugsnag.notify);
  });

  it('should log exceptions', function(){
    var exception = new Error();
    this.logger.logException(exception, {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notifyException,
      exception, null, sinon.match({meta: 'Data'}), 'error');
  });

  it('should refresh when a tab has changed', function(){
    this.logger.tabChanged();
    sinon.assert.called(this.bugsnag.refresh);
  });

  it('should log errors', function(){
    this.logger.logError('omfg', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged Error', 'omfg', sinon.match({meta: 'Data'}), 'error');
  });

  it('should log warnings', function(){
    this.logger.logWarn('omfg', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged Warning', 'omfg', sinon.match({meta: 'Data'}), 'warning');
  });

  it('should log server errors', function(){
    this.logger.logServerError('omfg', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged Server Error', 'omfg', sinon.match({meta: 'Data'}), 'error');
  });

  it('should log server warnings', function(){
    this.logger.logServerWarn('omfg', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged Server Warning', 'omfg', sinon.match({meta: 'Data'}), 'warning');
  });

  it('should log sharejs errors', function(){
    this.logger.logSharejsError('omfg', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged ShareJS Error', 'omfg', sinon.match({meta: 'Data'}), 'error');
  });

  it('should log sharejs warnings', function(){
    this.logger.logSharejsWarn('omfg', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged ShareJS Warning', 'omfg', sinon.match({meta: 'Data'}), 'warning');
  });

  it('should log info', function(){
    this.logger.log('omfg', {meta: 'Data'});
    sinon.assert.calledWith(this.bugsnag.notify, 'Logged Info', 'omfg', sinon.match({meta: 'Data'}), 'info');
  });

  describe('when receiving error with status code 0', function(){
    it('should log errors as cors warnings', function(){
      this.logger.logServerError('omfg', {meta: 'Data', error: {statusCode: 0}});
      sinon.assert.calledWith(this.bugsnag.notify, 'CORS Warning', 'omfg', sinon.match({meta: 'Data'}), 'warning');
    });
    it('should log warnings as cors warnings', function(){
      this.logger.logServerWarn('omfg', {meta: 'Data', error: {statusCode: 0}});
      sinon.assert.calledWith(this.bugsnag.notify, 'CORS Warning', 'omfg', sinon.match({meta: 'Data'}), 'warning');
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
      this.logger.log('derp');
      sinon.assert.calledWith(this.bugsnag.setUser, {
        firstName:      'Hans',
        lastName:       'Wurst',
        id:             'h4nswur5t',
        organizations:  'Conglom-O, ACME',
        adminLink:      'https://admin.contentful.com/admin/users/h4nswur5t',
      });
      //sinon.assert.calledWith(this.bugsnag.notify,
        //'Logged Info', 'omfg', sinon.match({
          //meta: 'Data'
        //}), 'info');
    });

    it('should derive the grouping hash from the message if none provided', function(){
      this.logger.log('derp');
      sinon.assert.calledWith(this.bugsnag.notify,
        'Logged Info', 'derp', sinon.match({ groupingHash: 'derp' }), 'info');
    });

    describe('augmenting metadata', function(){
      it('should add params', function(){
        this.logger.log('derp', {groupingHash: 'grp'});
        var actual = this.bugsnag.notify.args[0][2];
        expect(actual.params.spaceId).toBe('123456');
        expect(actual.params.viewType).toBe('testView');
        expect(actual.groupingHash).toBe('grp');
        expect(actual.params.screensize).toMatch(/\d+x\d+/);
        expect(actual.params.viewport).toMatch(/\d+x\d+/);
      });

      it('should preparse the data property', function(){
        var data = { foo: { bar: {} } };
        data.foo.bar.baz = data;
        this.logger.log('derp', {data: data});
        var actual = this.bugsnag.notify.args[0][2];
        expect(actual.data).toEqual({ foo : { bar : { baz : { foo : '[Circular ~]' } } } });
      });
    });
  });

});
