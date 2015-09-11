'use strict';

describe('otDocFor', function () {
  var scope;

  function makeOtDocStub (snapshot) {
    return {
      on: sinon.stub(),
      close: sinon.stub(),
      removeListener: sinon.stub(),
      snapshot: snapshot || {}
    };
  }

  beforeEach(function() {
    var ShareJS = {
      isConnected: sinon.stub().returns(true),
      connectionFailed: sinon.stub().returns(false),
      open: sinon.stub()
    };
    this.openDocument = ShareJS.open;

    module('contentful/test', function ($provide) {
      $provide.value('ShareJS', ShareJS);
    });


    this.connect = function () {
      ShareJS.isConnected.returns(true);
      ShareJS.connectionFailed.returns(false);
      this.$apply();
    };

    this.disconnect = function () {
      ShareJS.isConnected.returns(false);
      ShareJS.connectionFailed.returns(true);
      this.$apply();
    };

    this.entity = {
      update: sinon.spy(function (data) {
        this.data = data;
      }),
      getVersion: function () {
        return this.data.sys.version;
      },
      setVersion: sinon.stub(),
      data: {
        sys: {
          id: 'id',
          version: 8
        },
      }
    };

    scope = this.$compile('<div ot-doc-for="entity">', {
      entity: this.entity,
    }).scope();
    scope.otDoc.state.disabled = false;
  });

  it('otDoc is initially undefined', function(){
    expect(scope.otDoc.doc).toBeUndefined();
  });

  describe('if otDoc.doc changes', function(){
    beforeEach(function(){
      this.disconnect();
      sinon.stub(scope, '$broadcast');
      this.oldDoc = makeOtDocStub();
      scope.otDoc.doc = this.oldDoc;
      this.$apply();

      this.newDoc = makeOtDocStub();
      scope.otDoc.doc = this.newDoc;
      this.$apply();
    });

    it('doc is set as editable', function(){
      expect(scope.otDoc.state.editable).toBe(true);
    });

    it('removes old remote op listener', function(){
      sinon.assert.calledWith(this.oldDoc.removeListener, 'remoteop');
    });

    it('sets up remote op listener', function(){
      sinon.assert.calledWith(this.newDoc.on, 'remoteop');
    });
  });

  describe('successful initialization flow', function(){
    beforeEach(function(){
      var localeStore = this.$inject('TheLocaleStore');
      localeStore.getPrivateLocales = sinon.stub().returns([{internal_code: 'en'}]);

      this.entity.data.fields = {
        field1: {
          del: 'deleted'
        },
        field2: {
          en: 'english'
        }
      };

      var otDoc = makeOtDocStub(this.entity.data);
      otDoc.on.withArgs('acknowledge').yields();
      this.openDocument.resolves(otDoc);
      this.connect();
    });

    it('sharejs.open is called', function(){
      sinon.assert.called(this.openDocument);
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
      // triggers a first digest cycle with different settings because
      // the initialization already made this watcher fail
      var $q = this.$inject('$q');
      this.openDocument.returns($q(_.noop));
      this.connect();

      this.closeStub = sinon.stub();
      scope.otDoc.doc = {
        close: this.closeStub,
        on: sinon.stub()
      };
      this.disconnect();
    });

    it('sharejs.open is called only once', function(){
      sinon.assert.calledOnce(this.openDocument);
    });

    it('otdoc is closed', function(){
      sinon.assert.called(this.closeStub);
    });

    it('otdoc.doc is reset', function(){
      expect(scope.otDoc.doc).toBeUndefined();
    });
  });

  describe('initialization flow fails because opening the doc failed', function(){
    beforeEach(function(){
      this.logger = this.$inject('logger');
      this.logger.logShareJsError = sinon.stub();

      this.openDocument.rejects();
      this.connect();
    });

    it('sharejs.open is called', function(){
      sinon.assert.called(this.openDocument);
    });

    it('otDoc.doc is undefined', function(){
      expect(scope.otDoc.doc).toBeUndefined();
    });

    it('logger sharejs error is called', function(){
      sinon.assert.called(this.logger.logSharejsError);
    });
  });

  describe('initialization flow fails because doc became unusable after opening', function(){
    beforeEach(function(){
      this.otDoc = makeOtDocStub();
      this.openDocument.resolves(this.otDoc);

      this.connect();
      this.disconnect();
    });

    it('sharejs.open is called', function(){
      sinon.assert.called(this.openDocument);
    });

    it('doc is closed', function(){
      sinon.assert.called(this.otDoc.close);
    });
  });

  describe('#updateEntityData()', function () {

    beforeEach(function () {
      var moment = this.$inject('moment');
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
      this.otDoc = makeOtDocStub();
      scope.otDoc.doc = this.otDoc;
      scope.$destroy();
    });

    it('removes the remote op listener', function(){
      sinon.assert.called(this.otDoc.removeListener);
    });

    it('closes the doc', function(){
      sinon.assert.called(this.otDoc.close);
    });
  });

  describe('otDoc.state.error', function () {
    beforeEach(function () {
      this.openDocument.resolves(makeOtDocStub());
    });

    it('is set to false if opening document succeeds', function () {
      scope.otDoc.state.error = true;
      this.connect();
      expect(scope.otDoc.state.error).toBe(false);
    });

    it('is set to true if opening document fails', function () {
      scope.otDoc.state.error = false;
      this.openDocument.rejects();
      this.connect();
      expect(scope.otDoc.state.error).toBe(true);
    });

    it('is set to true if ShareJS connection failed', function () {
      this.connect();
      var ShareJS = this.$inject('ShareJS');
      ShareJS.connectionFailed.returns(true);
      scope.otDoc.state.error = false;
      this.$apply();
      expect(scope.otDoc.state.error).toBe(true);
    });
  });
});
