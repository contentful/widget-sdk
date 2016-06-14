'use strict';

describe('entityEditor/Document', function () {
  var scope;

  function makeOtDocStub (snapshot) {
    return {
      on: sinon.stub(),
      close: sinon.stub(),
      removeListener: sinon.stub(),
      snapshot: snapshot || {sys: {}}
    };
  }

  beforeEach(function () {
    module('contentful/test');

    var ShareJS = this.$inject('ShareJS');
    ShareJS.isConnected = sinon.stub().returns(true);
    ShareJS.connectionFailed = sinon.stub().returns(false);
    this.openDocument = ShareJS.open = sinon.stub();

    var OtDoc = this.$inject('mocks/OtDoc');

    this.connect = function () {
      ShareJS.isConnected.returns(true);
      ShareJS.connectionFailed.returns(false);
      this.$apply();
    };

    this.connectAndOpen = function (data) {
      ShareJS.isConnected.returns(true);
      ShareJS.connectionFailed.returns(false);
      var doc = new OtDoc(_.cloneDeep(data || this.entity.data));
      this.openDocument.resolves(doc);
      this.$apply();
      return doc;
    };

    this.disconnect = function () {
      ShareJS.isConnected.returns(false);
      ShareJS.connectionFailed.returns(true);
      this.$apply();
    };

    this.entity = {
      getType: _.constant('Entry'),
      update: sinon.spy(function (data) {
        this.data = data;
      }),
      setVersion: sinon.stub(),
      data: {
        sys: {
          id: 'id',
          version: 8
        }
      }
    };

    var $controller = this.$inject('$controller');
    var $rootScope = this.$inject('$rootScope');

    scope = $rootScope.$new();
    scope.contentType = {data: {fields: []}};
    this.doc = $controller('entityEditor/Document', {
      $scope: scope,
      entity: this.entity
    });

    this.doc.open();
  });

  afterEach(function () {
    scope = null;
  });

  it('otDoc is initially undefined', function () {
    expect(this.doc.doc).toBeUndefined();
  });

  describe('successful initialization flow', function () {
    beforeEach(function () {
      var localeStore = this.$inject('TheLocaleStore');
      localeStore.getPrivateLocales = sinon.stub().returns([{internal_code: 'en'}]);
      scope.contentType.data.fields = [{id: 'field1'}, {id: 'field2'}];

      this.entity.data.fields = {
        field1: {
          del: 'deleted'
        },
        field2: {
          en: 'english'
        },
        deletedField: {
          en: 'some value'
        }
      };

      scope.$broadcast = sinon.stub();
      this.otDoc = this.connectAndOpen();
    });

    it('sharejs.open is called', function () {
      sinon.assert.calledOnce(this.openDocument);
      sinon.assert.calledWith(this.openDocument, this.entity);
    });

    it('sets closed event listener on doc', function () {
      sinon.assert.calledWith(this.doc.doc.on, 'closed');
    });

    it('filters deleted locales', function () {
      expect(this.entity.data.fields.field1.del).toBeUndefined();
      expect(this.doc.doc.snapshot.fields.field1.del).toBeUndefined();
    });

    it('keeps non deleted locales', function () {
      expect(this.doc.doc.snapshot.fields.field2.en).toBeDefined();
      expect(this.entity.data.fields.field2.en).toBeDefined();
    });

    it('filters deleted fields', function () {
      expect(this.doc.doc.snapshot.fields.deletedField).toBeUndefined();
      expect(this.entity.data.fields.deletedField).toBeUndefined();
    });

    it('keeps non deleted fields', function () {
      expect(this.doc.doc.snapshot.fields.field1).toBeDefined();
      expect(this.entity.data.fields.field1).toBeDefined();
      expect(this.doc.doc.snapshot.fields.field2).toBeDefined();
      expect(this.entity.data.fields.field2).toBeDefined();
    });

    it('sets acknowledge and remoteop event handelrs', function () {
      sinon.assert.calledWith(this.doc.doc.on, 'acknowledge');
      sinon.assert.calledWith(this.doc.doc.on, 'remoteop');
    });

    it('updated version if updateHandler called', function () {
      this.otDoc.on.withArgs('acknowledge').yield();
      sinon.assert.called(this.entity.setVersion);
    });

    it('calls otUpdateEntityData', function () {
      sinon.assert.called(this.entity.update);
    });

    it('broadcasts "otDocReady"', function () {
      sinon.assert.calledWith(scope.$broadcast, 'otDocReady', this.otDoc);
    });
  });

  describe('initialization flow fails because document is not ready', function () {
    beforeEach(function () {
      // triggers a first digest cycle with different settings because
      // the initialization already made this watcher fail
      var $q = this.$inject('$q');
      this.openDocument.returns($q(_.noop));
      this.connect();

      this.closeStub = sinon.stub();
      this.otDoc = makeOtDocStub();
      this.doc.doc = this.otDoc;
      this.disconnect();
    });

    it('sharejs.open is called only once', function () {
      sinon.assert.calledOnce(this.openDocument);
    });

    it('otdoc is closed', function () {
      sinon.assert.called(this.otDoc.close);
    });

    it('otdoc.doc is removed', function () {
      expect(this.doc.doc).toBeUndefined();
    });
  });

  describe('initialization flow fails because opening the doc failed', function () {
    beforeEach(function () {
      this.logger = this.$inject('logger');
      this.logger.logShareJsError = sinon.stub();

      this.openDocument.rejects();
      this.connect();
    });

    it('sharejs.open is called', function () {
      sinon.assert.called(this.openDocument);
    });

    it('otDoc.doc is undefined', function () {
      expect(this.doc.doc).toBeUndefined();
    });

    it('logger sharejs error is called', function () {
      sinon.assert.called(this.logger.logSharejsError);
    });
  });

  describe('initialization flow fails because doc became unusable after opening', function () {
    beforeEach(function () {
      this.otDoc = this.connectAndOpen();
      this.disconnect();
    });

    it('sharejs.open is called', function () {
      sinon.assert.called(this.openDocument);
    });

    it('doc is closed', function () {
      sinon.assert.called(this.otDoc.close);
    });
  });

  describe('update entity data on "change" event', function () {

    beforeEach(function () {
      var moment = this.$inject('moment');
      this.clock = sinon.useFakeTimers(1234, 'Date');
      this.now = moment();

      this.otDoc = this.connectAndOpen({
        sys: {version: 100, updatedAt: 'foo'},
        foo: 'bar', baz: {}
      });
      this.entity.update.reset();

      this.fireChange = function () {
        this.otDoc.on.withArgs('change').yield();
        this.$apply();
      };
    });

    afterEach(function () {
      this.clock.restore();
    });

    it('updates the entity data with a copy of the snapshot', function () {
      sinon.assert.notCalled(this.entity.update);
      this.fireChange();
      sinon.assert.calledOnce(this.entity.update);
      var data = this.entity.data;
      expect(data).not.toBe(this.doc.doc.snapshot);
      expect(_.omit(data, ['sys'])).toLookEqual(_.omit(this.doc.doc.snapshot, ['sys']));
    });

    it('it updates the entity version', function () {
      this.entity.data.sys.version = '';
      this.doc.doc.version = 'NEW VERSION';
      this.fireChange();
      expect(this.entity.data.sys.version).toBe('NEW VERSION');
    });

    it('it updates the entity timestamp for new versions', function () {
      this.entity.data.sys.updatedAt = 'UPDATED AT';
      this.entity.data.sys.version = 0;
      this.doc.doc.version = 1;
      this.fireChange();
      expect(this.entity.data.sys.updatedAt).toBe(this.now.toISOString());
    });

    it('it does not update the entity timestamp for new versions', function () {
      this.entity.data.sys.updatedAt = 'UPDATED AT';
      this.entity.data.sys.version = 1;
      this.doc.doc.version = 1;
      this.fireChange();
      expect(this.entity.data.sys.updatedAt).toBe('UPDATED AT');
    });
  });

  describe('on scope destruction', function () {
    beforeEach(function () {
      this.otDoc = makeOtDocStub();
      this.doc.doc = this.otDoc;
      scope.$destroy();
    });

    it('removes the remote op listener', function () {
      sinon.assert.calledWith(this.otDoc.removeListener, 'remoteop');
    });

    it('removes the change listener', function () {
      sinon.assert.calledWith(this.otDoc.removeListener, 'change');
    });

    it('closes the doc', function () {
      sinon.assert.called(this.otDoc.close);
    });
  });

  describe('otDoc.state.error', function () {
    beforeEach(function () {
      this.openDocument.resolves(makeOtDocStub());
    });

    it('is set to false if opening document succeeds', function () {
      this.doc.state.error = true;
      this.connect();
      expect(this.doc.state.error).toBe(false);
    });

    it('is set to true if opening document fails', function () {
      this.doc.state.error = false;
      this.openDocument.rejects();
      this.connect();
      expect(this.doc.state.error).toBe(true);
    });

    it('is set to true if ShareJS connection failed', function () {
      this.connect();
      var ShareJS = this.$inject('ShareJS');
      ShareJS.connectionFailed.returns(true);
      this.doc.state.error = false;
      this.$apply();
      expect(this.doc.state.error).toBe(true);
    });
  });

  describe('doc events', function () {
    beforeEach(function () {
      this.clock = sinon.useFakeTimers(1000, 'Date');
      this.now = this.$inject('moment')();
      this.otDoc = this.connectAndOpen();
    });

    afterEach(function () {
      this.clock.restore();
    });

    it('updates entity timestamp if operation was acknowleged', function () {
      this.entity.data.sys.updatedAt = null;
      this.otDoc.on.withArgs('acknowledge').yield();
      expect(this.entity.data.sys.updatedAt).toEqual(this.now.toISOString());
    });

    it('updates version if operation was acknowleged', function () {
      this.otDoc.version = 'VERSION';
      this.otDoc.on.withArgs('acknowledge').yield();
      sinon.assert.calledWith(this.entity.setVersion, 'VERSION');
    });

    it('broadcasts change event to scope', function () {
      scope.$broadcast = sinon.stub();
      this.otDoc.on.withArgs('change').yield('OPERATION');
      this.$apply();
      sinon.assert.calledWith(scope.$broadcast, 'otChange', this.otDoc, 'OPERATION');
    });
  });

  describe('#getValueAt()', function () {
    it('gets value from snapshot if doc is connected', function () {
      var doc = this.connectAndOpen();
      dotty.put(doc.snapshot, ['a', 'b'], 'VAL');
      expect(this.doc.getValueAt(['a', 'b'])).toEqual('VAL');
    });

    it('gets value from entity data if doc is not connected', function () {
      dotty.put(this.entity.data, ['a', 'b'], 'VAL');
      expect(this.doc.getValueAt(['a', 'b'])).toEqual('VAL');
    });
  });

  describe('#setValueAt()', function () {
    it('rejects when doc is not defined', function () {
      this.doc.close();
      var errored = sinon.stub();
      this.doc.setValueAt(['PATH'], 'VAL').catch(errored);
      this.$apply();
      sinon.assert.called(errored);
    });

    it('sets deep value', function () {
      this.connectAndOpen();
      expect(this.doc.getValueAt(['a', 'b'])).toBe(undefined);
      this.doc.setValueAt(['a', 'b'], 'VAL');
      expect(this.doc.getValueAt(['a', 'b'])).toBe('VAL');
    });
  });

  describe('#removeValueAt()', function () {
    it('delegates to ShareJS document', function () {
      var doc = this.connectAndOpen();
      doc.removeAt = sinon.stub();
      this.doc.removeValueAt('PATH');
      sinon.assert.calledWith(doc.removeAt, 'PATH');
    });

    it('resolves when ShareJS callback is called', function () {
      var doc = this.connectAndOpen();
      doc.removeAt = sinon.stub().yields();
      var resolved = sinon.stub();
      this.doc.removeValueAt('PATH').then(resolved);
      this.$apply();
      sinon.assert.called(resolved);
    });

    it('resolves quietly when doc.removeAt() throws', function () {
      var doc = this.connectAndOpen();
      doc.removeAt = sinon.stub().throws('ERROR');
      var resolved = sinon.stub();
      this.doc.removeValueAt('PATH').then(resolved);
      this.$apply();
      sinon.assert.called(resolved);
    });
  });
});
