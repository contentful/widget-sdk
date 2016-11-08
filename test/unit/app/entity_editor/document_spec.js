'use strict';

describe('entityEditor/Document', function () {
  let scope, K, DocLoad;

  beforeEach(function () {
    module('contentful/test', ($provide, $controllerProvider) => {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
      $controllerProvider.register('otDocPresenceController', function () {
        return {
          leave: sinon.stub()
        };
      });
    });


    K = this.$inject('mocks/kefir');
    DocLoad = this.$inject('data/ShareJS/Connection').DocLoad;
    const OtDoc = this.$inject('mocks/OtDoc');

    this.docLoader = {
      doc: K.createMockProperty(DocLoad.None()),
      destroy: sinon.spy()
    };

    this.docConnection = {
      getDocLoader: sinon.stub().returns(this.docLoader)
    };

    const spaceContext = this.mockService('spaceContext');
    spaceContext.docConnection = this.docConnection;

    const accessChecker = this.mockService('accessChecker');
    accessChecker.canUpdateEntity = sinon.stub().returns(true);

    this.connectAndOpen = function (data) {
      const doc = new OtDoc(_.cloneDeep(data || this.entity.data));
      this.docLoader.doc.set(DocLoad.Doc(doc));
      this.$apply();
      return doc;
    };

    this.localeStore = this.$inject('TheLocaleStore');
    this.localeStore.setLocales([
      {internal_code: 'en'}
    ]);

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
        },
        fields: {
          a: {
            en: 'INITIAL'
          }
        }
      }
    };

    this.contentType = {data: {}};

    const $controller = this.$inject('$controller');
    const $rootScope = this.$inject('$rootScope');

    scope = $rootScope.$new();
    scope.contentType = {data: {fields: []}};
    scope.user = {sys: {id: 'USER'}};
    this.doc = $controller('entityEditor/Document', {
      $scope: scope,
      entity: this.entity,
      contentType: this.contentType
    });

    this.doc.setReadOnly(false);
  });

  afterEach(function () {
    scope = K = DocLoad = null;
  });

  describe('when doc is loaded', function () {
    beforeEach(function () {
      const Normalizer = this.$inject('data/documentNormalizer');
      this.normalize = sinon.spy(Normalizer, 'normalize');

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

      this.otDoc = this.connectAndOpen();
    });

    it('calls the document normalizer', function () {
      sinon.assert.calledWith(
        this.normalize,
        this.doc, this.doc.doc.snapshot, this.contentType, this.localeStore.getPrivateLocales()
      );
    });

    it('updates the entity data', function () {
      sinon.assert.called(this.entity.update);
    });
  });

  describe('update entity data on "change" event', function () {

    beforeEach(function () {
      const moment = this.$inject('moment');
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
      const data = this.entity.data;
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

  describe('#status$', function () {
    it('is "ok" initially', function () {
      K.assertCurrentValue(this.doc.status$, 'ok');
    });

    it('is "ok" when the document connects', function () {
      this.connectAndOpen();
      this.$apply();
      K.assertCurrentValue(this.doc.status$, 'ok');
    });

    it('is "ot-connection-error" when there is a document error', function () {
      this.connectAndOpen();
      this.$apply();
      K.assertCurrentValue(this.doc.status$, 'ok');
      this.docLoader.doc.set(DocLoad.Error());
      K.assertCurrentValue(this.doc.status$, 'ot-connection-error');
    });

    it('is "archived" when the entity is archived', function () {
      const doc = this.connectAndOpen();
      this.$apply();
      K.assertCurrentValue(this.doc.status$, 'ok');
      doc.setAt(['sys', 'archivedVersion'], 1);
      K.assertCurrentValue(this.doc.status$, 'archived');
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
      const doc = this.connectAndOpen();
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
        const otDoc = this.connectAndOpen();

        const path = ['a', 'id'];
        const calledWith = (ops) => {
          sinon.assert.calledWith(otDoc.submitOp, ops);
          otDoc.submitOp.reset();
        };

        // there was no value at the path:
        this.doc.setValueAt(path, 'VAL');
        expect(this.doc.getValueAt(path)).toBe('VAL');
        sinon.assert.notCalled(otDoc.submitOp);

        // value at the path is the same:
        this.doc.setValueAt(path, 'VAL');
        expect(this.doc.getValueAt(path)).toBe('VAL');
        sinon.assert.notCalled(otDoc.submitOp);

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
      const doc = this.connectAndOpen();
      doc.removeAt = sinon.stub();
      this.doc.removeValueAt('PATH');
      sinon.assert.calledWith(doc.removeAt, 'PATH');
    });

    it('resolves when ShareJS callback is called', function () {
      const doc = this.connectAndOpen();
      doc.removeAt = sinon.stub().yields();
      const resolved = sinon.stub();
      this.doc.removeValueAt('PATH').then(resolved);
      this.$apply();
      sinon.assert.called(resolved);
    });

    it('resolves quietly when doc.removeAt() throws', function () {
      const doc = this.connectAndOpen();
      doc.removeAt = sinon.stub().throws('ERROR');
      const resolved = sinon.stub();
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

    it('updates value when "change" event is emitted with affected path', function () {
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
      K.assertCurrentValue(
        this.doc.sysProperty,
        this.entity.data.sys
      );
    });

    it('updates value when "acknowledge" event is emitted on doc', function () {
      const doc = this.connectAndOpen();
      const cb = sinon.spy();
      this.doc.sysProperty.onValue(cb);
      cb.reset();

      this.entity.data.sys.id = 'NEW ID';
      doc.emit('acknowledge');
      this.$apply();

      sinon.assert.calledWith(cb, sinon.match({id: 'NEW ID'}));
    });

    it('updates value when document is opened', function () {
      const cb = sinon.spy();
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
      this.docLoader.doc.set(DocLoad.None());
      this.$apply();
      const errored = sinon.stub();
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

  describe('#reverter', function () {
    it('has changes if changes are made', function* () {
      this.connectAndOpen();
      expect(this.doc.reverter.hasChanges()).toBe(false);
      yield this.doc.setValueAt(['fields'], {});
      expect(this.doc.reverter.hasChanges()).toBe(true);
    });

    it('reverts field changes', function* () {
      const path = ['fields', 'a', 'en'];
      this.connectAndOpen();
      yield this.doc.setValueAt(path, 'NEW');
      expect(this.doc.getValueAt(path)).toBe('NEW');
      yield this.doc.reverter.revert();
      expect(this.doc.getValueAt(path)).toBe('INITIAL');
    });

    it('does not have changes after reverting', function* () {
      this.connectAndOpen();
      expect(this.doc.reverter.hasChanges()).toBe(false);
      yield this.doc.setValueAt(['fields'], {});
      expect(this.doc.reverter.hasChanges()).toBe(true);
      yield this.doc.reverter.revert();
      expect(this.doc.reverter.hasChanges()).toBe(false);
    });
  });
});
