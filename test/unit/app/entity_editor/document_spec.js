'use strict';

describe('entityEditor/Document', function () {
  var scope, K;

  beforeEach(function () {
    this.docConnection = {
      open: sinon.stub(),
      canOpen: sinon.stub()
    };

    module('contentful/test', ($provide, $controllerProvider) => {
      $provide.value('spaceContext', {docConnection: this.docConnection});
      $controllerProvider.register('otDocPresenceController', function () {
        return {
          leave: sinon.stub()
        };
      });
    });

    K = this.$inject('mocks/kefir');

    this.docConnection.errors = K.createMockStream();

    var OtDoc = this.$inject('mocks/OtDoc');

    this.connectAndOpen = function (data) {
      this.docConnection.canOpen.returns(true);
      var doc = new OtDoc(_.cloneDeep(data || this.entity.data));
      this.docConnection.open.resolves(doc);
      // Not sure why we need to apply twice. But tests fail otherwise.
      this.$apply();
      this.$apply();
      return doc;
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

    this.contentType = {data: {}};

    var $controller = this.$inject('$controller');
    var $rootScope = this.$inject('$rootScope');

    scope = $rootScope.$new();
    scope.contentType = {data: {fields: []}};
    scope.user = {sys: {id: 'USER'}};
    this.doc = $controller('entityEditor/Document', {
      $scope: scope,
      entity: this.entity,
      contentType: this.contentType
    });

    this.doc.open();
  });

  afterEach(function () {
    scope = K = null;
  });

  it('otDoc is initially undefined', function () {
    expect(this.doc.doc).toBeUndefined();
  });

  describe('successful initialization flow', function () {
    beforeEach(function () {
      const Normalizer = this.$inject('data/documentNormalizer');
      this.normalize = sinon.spy(Normalizer, 'normalize');

      this.localeStore = this.$inject('TheLocaleStore');
      this.localeStore.getPrivateLocales = sinon.stub().returns([{internal_code: 'en'}]);
      this.contentType.data.fields = [{id: 'field1'}, {id: 'field2'}];

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

    it('calls docConnection.open()', function () {
      sinon.assert.calledOnce(this.docConnection.open);
      sinon.assert.calledWith(this.docConnection.open, this.entity);
    });

    it('calls the document normalizer', function () {
      sinon.assert.calledWith(
        this.normalize,
        this.doc, this.doc.doc.snapshot, this.contentType, this.localeStore.getPrivateLocales()
      );
    });

    it('calls otUpdateEntityData', function () {
      sinon.assert.called(this.entity.update);
    });
  });

  describe('when connection cannot open document', function () {
    beforeEach(function () {
      this.otDoc = this.connectAndOpen();
      this.docConnection.canOpen.returns(false);
      this.$apply();
    });

    it('otDoc is closed', function () {
      sinon.assert.calledOnce(this.otDoc.close);
    });

    it('doc.doc is removed', function () {
      expect(this.doc.doc).toBeUndefined();
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
        this.otDoc.emit('change', [[]]);
        this.$apply();
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
      this.otDoc = this.connectAndOpen();
      scope.$destroy();
    });

    it('closes the doc', function () {
      sinon.assert.called(this.otDoc.close);
    });
  });

  describe('#state.error', function () {
    it('is set to false if opening document succeeds', function () {
      this.doc.state.error = true;
      this.connectAndOpen();
      expect(this.doc.state.error).toBe(false);
    });

    it('is set to true if opening document fails', function () {
      this.doc.state.error = false;
      this.docConnection.open.rejects();
      this.docConnection.canOpen.returns(true);
      this.$apply();
      expect(this.doc.state.error).toBe(true);
    });

    it('is set to true if ShareJS connection failed', function () {
      this.doc.state.error = false;
      this.docConnection.errors.emit('');
      this.$apply();
      expect(this.doc.state.error).toBe(true);
    });
  });

  describe('acknowledged operation', function () {
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
      this.otDoc.emit('acknowledge');
      this.$apply();
      expect(this.entity.data.sys.updatedAt).toEqual(this.now.toISOString());
    });

    it('updates version if operation was acknowleged', function () {
      this.otDoc.version = 'VERSION';
      this.otDoc.emit('acknowledge');
      this.$apply();
      sinon.assert.calledWith(this.entity.setVersion, 'VERSION');
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
    itRejectsWithoutDocument('setValueAt');

    it('sets deep value', function () {
      this.connectAndOpen();
      expect(this.doc.getValueAt(['a', 'b'])).toBe(undefined);
      this.doc.setValueAt(['a', 'b'], 'VAL');
      expect(this.doc.getValueAt(['a', 'b'])).toBe('VAL');
    });

    testDiff('Text');
    testDiff('Symbol');

    function testDiff (fieldType) {
      it(`uses diffing for ${fieldType} fields`, function () {
        this.contentType.data.fields = [{id: 'id', type: fieldType}];
        this.connectAndOpen();

        const path = ['a', 'id'];
        const docAtPath = this.doc.doc.at(path);
        const calledWith = (ops) => {
          sinon.assert.calledWith(docAtPath.submitOp, ops);
          docAtPath.submitOp.reset();
        };

        // there was no value at the path:
        this.doc.setValueAt(path, 'VAL');
        expect(this.doc.getValueAt(path)).toBe('VAL');
        sinon.assert.notCalled(docAtPath.submitOp);

        // value at the path is the same:
        this.doc.setValueAt(path, 'VAL');
        expect(this.doc.getValueAt(path)).toBe('VAL');
        sinon.assert.notCalled(docAtPath.submitOp);

        // sole insert:
        this.doc.setValueAt(path, 'VAIL');
        expect(this.doc.getValueAt(path)).toBe('VAIL');
        calledWith([{p: path.concat([2]), si: 'I'}]);

        // delete inside of a string:
        this.doc.setValueAt(path, 'VIL');
        expect(this.doc.getValueAt(path)).toBe('VIL');
        calledWith([{p: path.concat([1]), sd: 'A'}]);

        // compound patch:
        this.doc.setValueAt(path, 'PILS');
        expect(this.doc.getValueAt(path)).toBe('PILS');
        const p = path.concat([0]);
        calledWith([{p: p, sd: 'VIL'}, {p: p, si: 'PILS'}]);

        // delete from the front of a string:
        this.doc.setValueAt(path, 'S');
        expect(this.doc.getValueAt(path)).toBe('S');
        calledWith([{p: path.concat([0]), sd: 'PIL'}]);
      });
    }
  });

  describe('#removeValueAt()', function () {
    itRejectsWithoutDocument('removeValueAt');

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

  describe('#insertValueAt()', function () {
    beforeEach(function () {
      this.otDoc = this.connectAndOpen({a: [0, 1, 2], sys: {}});
    });

    itRejectsWithoutDocument('insertValueAt');

    it('inserts value into ShareJS document', function () {
      this.doc.insertValueAt(['a'], 1, 'X');
      this.$apply();
      expect(this.otDoc.snapshot.a).toEqual([0, 'X', 1, 2]);
    });

    it('sets value to singleton array', function () {
      delete this.otDoc.snapshot.a;
      this.doc.insertValueAt(['a'], 0, 'X');
      this.$apply();
      expect(this.otDoc.snapshot.a).toEqual(['X']);
    });
  });

  describe('#pushValueAt()', function () {
    beforeEach(function () {
      this.otDoc = this.connectAndOpen({a: [0, 1, 2], sys: {}});
    });

    itRejectsWithoutDocument('insertValueAt');

    it('pushes value into ShareJS document', function () {
      this.doc.pushValueAt(['a'], 'X');
      this.$apply();
      expect(this.otDoc.snapshot.a).toEqual([0, 1, 2, 'X']);
    });

    it('sets value to singleton array', function () {
      delete this.otDoc.snapshot.a;
      this.doc.pushValueAt(['a'], 'X');
      this.$apply();
      expect(this.otDoc.snapshot.a).toEqual(['X']);
    });
  });

  describe('#valuePropertyAt()', function () {
    it('gets initial value from entity if the doc is not opened', function () {
      this.entity.data = {a: {b: 'VAL'}};
      const cb = sinon.spy();
      this.doc.valuePropertyAt(['a', 'b']).onValue(cb);
      sinon.assert.calledWith(cb, 'VAL');
    });

    it('gets initial value from opened doc', function () {
      this.connectAndOpen({a: {b: 'VAL'}, sys: {}});
      const cb = sinon.spy();
      this.doc.valuePropertyAt(['a', 'b']).onValue(cb);
      sinon.assert.calledWith(cb, 'VAL');
    });

    it('gets initial value from opened doc', function () {
      this.connectAndOpen({a: {b: 'VAL'}, sys: {}});
      const cb = sinon.spy();
      this.doc.valuePropertyAt(['a', 'b']).onValue(cb);
      sinon.assert.calledWith(cb, 'VAL');
    });

    it('updates value when document is opened', function () {
      const cb = sinon.spy();
      this.doc.valuePropertyAt(['a', 'b']).onValue(cb);
      cb.reset();

      this.connectAndOpen({a: {b: 'VAL'}, sys: {}});
      sinon.assert.calledWith(cb, 'VAL');
    });

    it('update value when "change" event is emitted with affected path', function () {
      const paths = [
        [],
        ['foo'],
        ['foo', 'bar'],
        ['foo', 'bar', 'x'],
        ['foo', 'bar', 'x', 'y']
      ];
      const doc = this.connectAndOpen({foo: {bar: false}, sys: {}});
      const cb = sinon.spy();
      this.doc.valuePropertyAt(['foo', 'bar']).onValue(cb);

      paths.forEach(function (path, i) {
        doc.setAt(['foo', 'bar'], i);
        cb.reset();
        doc.emit('change', [{p: path}]);
        sinon.assert.calledWith(cb, i);
      });
    });

    it('does not update value when path is not affected', function () {
      const paths = [
        ['x'],
        ['foo', 'x'],
        ['x', 'bar'],
        ['x', 'bar', 'y']
      ];
      const doc = this.connectAndOpen();
      const cb = sinon.spy();
      this.doc.valuePropertyAt(['foo', 'bar']).onValue(cb);
      cb.reset();

      paths.forEach(function (path, i) {
        doc.emit('change', [{p: path}]);
        sinon.assert.notCalled(cb, i);
      });
    });

    describe('merging change events', function () {
      beforeEach(function () {
        const doc = this.connectAndOpen();
        this.emitChange = doc.emit.bind(doc, 'change');

        this.listenOn = function (paths) {
          const spies = paths.map(() => {
            return sinon.spy();
          });

          spies.forEach((spy, i) => {
            this.doc.valuePropertyAt(paths[i]).onValue(spy);
            spy.reset();
          });

          return spies;
        };
      });

      it('finds longest common prefix', function () {
        const paths = [['x', 'y', 'z'], ['x', 'y'], ['z']];
        const spies = this.listenOn(paths);

        this.emitChange(paths.slice(0, 2).map((path) => {
          return {p: path};
        }));

        sinon.assert.calledOnce(spies[0]);
        sinon.assert.calledOnce(spies[1]);
        sinon.assert.notCalled(spies[2]);
      });

      it('defaults to zero length shared prefix', function () {
        const paths = [['x'], ['y'], ['z', 'w']];
        const spies = this.listenOn(paths);

        this.emitChange([{p: ['y']}, {p: ['x']}]);

        spies.forEach(function (spy) {
          sinon.assert.calledOnce(spy);
        });
      });
    });
  });

  describe('#sysProperty', function () {
    it('holds entity.data.sys as initial value', function () {
      this.entity.data.sys = 'SYS';
      var cb = sinon.spy();
      this.doc.sysProperty.onValue(cb);
      sinon.assert.calledWith(cb, 'SYS');
    });

    it('updates value when "acknowledge" event is emitted on doc', function () {
      var doc = this.connectAndOpen();
      var cb = sinon.spy();
      this.doc.sysProperty.onValue(cb);
      cb.reset();

      this.entity.data.sys.id = 'NEW ID';
      doc.emit('acknowledge');
      this.$apply();

      sinon.assert.calledWith(cb, sinon.match({id: 'NEW ID'}));
    });

    it('updates value when document is opened', function () {
      var cb = sinon.spy();
      this.doc.sysProperty.onValue(cb);
      cb.reset();

      this.connectAndOpen({sys: {id: 'NEW ID'}});
      sinon.assert.calledWith(cb, sinon.match({id: 'NEW ID'}));
    });
  });

  describe('#state.saving', function () {
    it('is false if there is no document initially', function () {
      expect(this.doc.state.saving).toBe(false);
    });

    it('changes to if document has inflight operation', function () {
      this.otDoc = this.connectAndOpen();
      expect(this.doc.state.saving).toBe(false);

      this.otDoc.inflightOp = true;
      this.otDoc.emit('change', []);
      this.$apply();
      expect(this.doc.state.saving).toBe(true);

      this.otDoc.inflightOp = false;
      this.otDoc.emit('acknowledge');
      this.$apply();
      expect(this.doc.state.saving).toBe(false);
    });
  });

  function itRejectsWithoutDocument (method) {
    it('rejects when document is not opened', function () {
      this.doc.close();
      var errored = sinon.stub();
      this.doc[method]().catch(errored);
      this.$apply();
      sinon.assert.called(errored);
    });
  }

  describe('#state.isDirty', function () {
    beforeEach(function () {
      this.otDoc = this.connectAndOpen();
      this.docUpdate = function (path, value) {
        this.otDoc.setAt(path, value);
        this.otDoc.version++;
        this.otDoc.emit('change', [{p: path}]);
        this.$apply();
      };
      this.isDirtyValues = K.extractValues(this.doc.state.isDirty);
    });

    it('changes to false if document is at published version', function () {
      expect(this.isDirtyValues[0]).toBe(true);

      this.otDoc.version = 12;
      this.docUpdate(['sys', 'publishedVersion'], 12);
      expect(this.isDirtyValues[0]).toBe(false);
    });

    it('changes to true if a published document is changed', function () {
      this.otDoc.version = 12;
      this.docUpdate(['sys', 'publishedVersion'], 12);
      expect(this.isDirtyValues[0]).toBe(false);

      this.docUpdate(['fields'], {});
      expect(this.isDirtyValues[0]).toBe(true);
    });

    it('changes to true if a document is unpublishd', function () {
      this.otDoc.version = 12;
      this.docUpdate(['sys', 'publishedVersion'], 12);
      expect(this.isDirtyValues[0]).toBe(false);

      this.docUpdate(['sys', 'publishedVersion'], undefined);
      expect(this.isDirtyValues[0]).toBe(true);
    });
  });
});
