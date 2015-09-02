'use strict';

describe('otDocFor', function () {
  var moment, scope;

  beforeEach(function() {
    var self = this;
    this.ShareJSMock = {
      isConnected: sinon.stub().returns(true),
      open: sinon.stub()
    };

    this.TheLocaleStoreMock = {
      getPrivateLocales: sinon.stub().returns([{internal_code: 'en'}])
    };

    this.loggerMock = {
      logSharejsError: sinon.stub()
    };

    module('contentful/test', function ($provide) {
      $provide.value('ShareJS', self.ShareJSMock);
      $provide.value('TheLocaleStore', self.TheLocaleStoreMock);
      $provide.value('logger', self.loggerMock);
    });
    moment = this.$inject('moment');

    this.entity = {
      update: function (data) {
        this.data = data;
      },
      getVersion: function () {
        return this.data.sys.version;
      },
      setVersion: sinon.stub(),
      data: {
        sys: {
          id: 'id',
          version: 8
        },
        fields: {
          field1: {
            del: 'deleted'
          },
          field2: {
            en: 'english'
          }
        }
      }
    };

    scope = this.$compile('<div ot-doc-for="entity">', {
      entity: this.entity,
    }).scope();
    scope.$digest();
  });

  it('otDoc is initially undefined', function(){
    expect(scope.otDoc.doc).toBeUndefined();
  });

  describe('if otDoc.doc changes', function(){
    beforeEach(function(done){
      this.removeListener = sinon.stub();
      scope.otDoc.doc = {
        removeListener: this.removeListener,
        on: sinon.stub()
      };
      scope.otDoc.doc.on.withArgs('remoteop').yieldsAsync(['insert', 'delete']);
      scope.$digest();
      scope.otDoc.doc = {
        on: sinon.stub()
      };
      this.broadcastStub = sinon.stub(scope, '$broadcast');
      scope.$digest();
      // defer because of the second digest cycle triggered on the remoteop event handling
      _.defer(function () {
        scope.$digest();
        done();
      });
    });

    afterEach(function () {
      this.broadcastStub.restore();
    });

    it('doc is set as editable', function(){
      expect(scope.otDoc.state.editable).toBe(true);
    });

    it('removes old remote op listener', function(){
      sinon.assert.calledWith(this.removeListener, 'remoteop');
    });

    it('sets up remote op listener', function(){
      sinon.assert.calledWith(scope.otDoc.doc.on, 'remoteop');
    });

    it('emits otRemoteOp event', function(){
      sinon.assert.calledWith(this.broadcastStub, 'otRemoteOp');
      sinon.assert.calledTwice(this.broadcastStub);
    });
  });

  describe('successful initialization flow', function(){
    beforeEach(function(done){
      scope.otDoc.doc = {
        on: sinon.stub()
      };
      this.entity.update = sinon.stub();
      scope.otDoc.state.disabled = false;
      scope.otDoc.doc.snapshot = this.entity.data;
      scope.otDoc.doc.on.withArgs('acknowledge').yields();
      this.ShareJSMock.open.yieldsAsync(null, scope.otDoc.doc, this.entity);
      scope.$digest();
      // Defer because of the async ShareJS open callback
      _.defer(function () {
        done();
      });
    });

    it('sharejs.open is called', function(){
      sinon.assert.called(this.ShareJSMock.open);
    });

    it('sets closed event listener on doc', function () {
      sinon.assert.calledWith(scope.otDoc.doc.on, 'closed');
    });

    it('filters deleted locales', function(){
      expect(scope.otDoc.doc.snapshot.fields.field1.del).toBeUndefined();
    });

    it('keeps non deleted locales', function(){
      expect(scope.otDoc.doc.snapshot.fields.field2.en).toBeDefined();
    });

    it('sets acknowledge and remoteop event handelrs', function(){
      sinon.assert.calledWith(scope.otDoc.doc.on, 'acknowledge');
      sinon.assert.calledWith(scope.otDoc.doc.on, 'remoteop');
    });

    it('updated version if updateHandler called', function(){
      sinon.assert.called(this.entity.setVersion);
    });

    it('calls otUpdateEntityData', function(){
      sinon.assert.called(this.entity.update);
    });
  });

  describe('initialization flow fails because document is not ready', function(){
    beforeEach(function(){
      // triggers a first digest cycle with different settings because the initialization
      // already made this watcher fail
      scope.otDoc.state.disabled = false;
      scope.$digest();
      this.closeStub = sinon.stub();
      scope.otDoc.doc = {
        close: this.closeStub,
        on: sinon.stub()
      };
      scope.otDoc.state.disabled = true;
      scope.$digest();
    });

    it('sharejs.open is called only once', function(){
      sinon.assert.calledOnce(this.ShareJSMock.open);
    });

    it('otdoc is closed', function(){
      sinon.assert.called(this.closeStub);
    });

    it('otdoc.doc is reset', function(){
      expect(scope.otDoc.doc).toBeUndefined();
    });
  });

  describe('initialization flow fails because opening the doc failed', function(){
    beforeEach(function(done){
      scope.otDoc.doc = {
        on: sinon.stub(),
        removeListener: sinon.stub()
      };
      scope.otDoc.state.disabled = false;
      this.ShareJSMock.open.yieldsAsync({});
      scope.$digest();
      // Defer because of the async ShareJS open callback
      _.defer(function () {
        done();
      });
    });

    it('sharejs.open is called', function(){
      sinon.assert.called(this.ShareJSMock.open);
    });

    it('otDoc.doc is undefined', function(){
      expect(scope.otDoc.doc).toBeUndefined();
    });

    it('logger sharejs error is called', function(){
      sinon.assert.called(this.loggerMock.logSharejsError);
    });
  });

  describe('initialization flow fails because doc became unusable after opening', function(){
    beforeEach(function(done){
      this.closeStub = sinon.stub();
      scope.otDoc.doc = {
        on: sinon.stub(),
        removeListener: sinon.stub(),
        close: this.closeStub
      };
      scope.otDoc.state.disabled = false;
      this.ShareJSMock.open.yieldsAsync(null, scope.otDoc.doc, this.entity);
      scope.$digest();
      scope.otDoc.state.disabled = true;
      scope.$digest();
      // Defer because of the async ShareJS open callback
      _.defer(function () {
        done();
      });
    });

    it('sharejs.open is called', function(){
      sinon.assert.called(this.ShareJSMock.open);
    });

    it('doc is closed', function(){
      sinon.assert.called(this.closeStub);
    });
  });

  describe('#updateEntityData()', function () {

    beforeEach(function () {
      this.clock = sinon.useFakeTimers(1234, 'Date');
      this.now = moment();
      scope.otDoc.doc = {
        snapshot: {foo: 'bar', baz: {}, sys: {version: 100, updatedAt: 'foo'}},
        version: 123
      };
    });

    afterEach(function () {
      this.clock.restore();
    });

    it('updates the entity data with a copy of the snapshot', function () {
      sinon.spy(this.entity, 'update');
      scope.otDoc.updateEntityData();
      sinon.assert.calledOnce(this.entity.update);
      var data = this.entity.data;
      expect(data).not.toBe(scope.otDoc.doc.snapshot);
      expect(_.omit(data, 'sys')).toLookEqual(_.omit(scope.otDoc.doc.snapshot, 'sys'));
    });

    it('it updates the entity version', function () {
      this.entity.data.sys.version = '';
      scope.otDoc.doc.version = 'NEW VERSION';
      scope.otDoc.updateEntityData();
      expect(this.entity.data.sys.version).toBe('NEW VERSION');
    });

    it('it updates the entity timestamp for new versions', function () {
      this.entity.data.sys.updatedAt = 'UPDATED AT';
      this.entity.data.sys.version = 0;
      scope.otDoc.doc.version = 1;
      scope.otDoc.updateEntityData();
      expect(this.entity.data.sys.updatedAt).toBe(this.now.toISOString());
    });

    it('it does not update the entity timestamp for new versions', function () {
      this.entity.data.sys.updatedAt = 'UPDATED AT';
      this.entity.data.sys.version = 1;
      scope.otDoc.doc.version = 1;
      scope.otDoc.updateEntityData();
      expect(this.entity.data.sys.updatedAt).toBe('UPDATED AT');
    });
  });

  describe('on scope destruction', function(){
    beforeEach(function(){
      this.removeListenerStub = sinon.stub();
      this.closeStub = sinon.stub();
      scope.otDoc.doc = {
        removeListener: this.removeListenerStub,
        close: this.closeStub
      };
      scope.$destroy();
    });

    it('removes the remote op listener', function(){
      sinon.assert.called(this.removeListenerStub);
    });

    it('closes the doc', function(){
      sinon.assert.called(this.closeStub);
    });
  });
});
