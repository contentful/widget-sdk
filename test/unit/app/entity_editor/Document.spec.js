import * as K from 'test/utils/kefir';
import _ from 'lodash';
import sinon from 'sinon';
import { deepFreeze } from 'utils/Freeze';
import createLocaleStoreMock from 'test/utils/createLocaleStoreMock';
import { $initialize, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';
import createOtDocMock from 'test/helpers/mocks/ot_doc';

const OtDocMock = createOtDocMock();

xdescribe('entityEditor/Document', () => {
  beforeEach(async function () {
    this.stubs = {
      canPerformActionOnEntity: sinon.stub(),
      canUpdateEntry: sinon.stub(),
      canUpdateAsset: sinon.stub(),
      canEditFieldLocale: sinon.stub(),
    };
    this.system.set('services/localeStore', {
      default: createLocaleStoreMock(),
    });
    this.system.set('access_control/AccessChecker', {
      canUpdateEntity: sinon.stub().returns(true),
      canPerformActionOnEntity: this.stubs.canPerformActionOnEntity,
      canUpdateEntry: this.stubs.canUpdateEntry,
      canUpdateAsset: this.stubs.canUpdateAsset,
      canEditFieldLocale: this.stubs.canEditFieldLocale,
    });

    this.DocLoad = (await this.system.import('data/sharejs/Connection')).DocLoad;

    this.docLoader = {
      doc: K.createMockProperty(this.DocLoad.None()),
      destroy: sinon.spy(),
      close: sinon.spy(),
    };

    this.docConnection = {
      getDocLoader: sinon.stub().returns(this.docLoader),
      refreshAuth: sinon.stub().resolves(),
    };

    const Doc = await this.system.import('app/entity_editor/Document');

    this.connectAndOpen = function (data) {
      data = _.cloneDeep(data || this.entity.data);
      if (!_.get(data, ['sys', 'type'])) {
        _.set(data, ['sys', 'type'], 'Entry');
      }
      const doc = new OtDocMock(data);
      this.docLoader.doc.set(this.DocLoad.Doc(doc));
      $apply();
      return doc;
    };

    this.localeStore = (await this.system.import('services/localeStore')).default;
    this.localeStore.setLocales([{ internal_code: 'en' }]);

    await $initialize(this.system);

    this.contentType = {
      data: {
        sys: { id: 'CT_ID' },
        fields: [{ id: 'a' }],
      },
    };

    /**
     * The entity we will pass to Doc.create(). Note that this object might be
     * mutated which each operation. For reference the initial entity will be
     * available as `this.initialEntity`
     */
    this.entity = {
      data: {
        sys: {
          id: 'ENTITY_ID',
          version: 8,
          contentType: {
            sys: this.contentType.data.sys,
          },
          environment: {
            sys: {
              id: 'master',
            },
          },
        },
        fields: {
          a: {
            en: 'INITIAL',
          },
        },
      },
    };

    this.createDoc = (type = 'Entry') => {
      this.entity.data.sys.type = type;
      this.initialEntity = deepFreeze(_.cloneDeep(this.entity));

      return Doc.create(this.docConnection, this.entity, this.contentType, { sys: { id: 'USER' } });
    };

    this.doc = this.createDoc();
  });

  describe('snapshot normalization', () => {
    beforeEach(function () {
      this.contentType.data.fields = [{ id: 'field1' }, { id: 'field2' }];
    });

    it('removes unknown fields and locales on document load', function () {
      this.connectAndOpen({
        fields: {
          field1: { en: true, fr: true },
          field2: { en: true },
          unknownField: true,
        },
      });

      const normalizedFieldValues = this.doc.getValueAt(['fields']);
      expect(normalizedFieldValues).toEqual({
        field1: { en: true },
        field2: { en: true },
      });
    });

    it('removes unknown fields and locales on full remote update', function () {
      const otDoc = this.connectAndOpen();
      const initialData = this.doc.getValueAt([]);
      expect(initialData.fields).toEqual({});

      otDoc.setAt([], {
        sys: initialData.sys,
        fields: {
          field1: { en: true, fr: true },
          field2: { en: true },
          unknownField: true,
        },
      });

      $apply();

      const normalizedFieldValues = this.doc.getValueAt(['fields']);
      expect(normalizedFieldValues).toEqual({
        field1: { en: true },
        field2: { en: true },
      });
    });
  });

  describe('on instance destruction', () => {
    it('closes the doc', function () {
      this.otDoc = this.connectAndOpen();
      this.doc.destroy();
      sinon.assert.called(this.docLoader.close);
    });
  });

  describe('on document change', () => {
    it('closes current doc', function () {
      this.otDoc = this.connectAndOpen();
      this.docLoader.doc.set(this.DocLoad.Doc(new OtDocMock({ sys: { type: 'Entry' } })));
      sinon.assert.calledOnce(this.docLoader.close);
    });

    it("doesn't close current doc when updated with the same doc", function () {
      this.otDoc = this.connectAndOpen();
      this.docLoader.doc.set(this.DocLoad.Doc(this.otDoc));
      sinon.assert.notCalled(this.docLoader.close);
    });
  });

  describe('#status$', () => {
    it('is "ok" initially', function () {
      K.assertCurrentValue(this.doc.status$, 'ok');
    });

    it('is "ok" when the document connects', function () {
      this.connectAndOpen();
      $apply();
      K.assertCurrentValue(this.doc.status$, 'ok');
    });

    it('is "ot-connection-error" when there is a disconnected error', function () {
      this.connectAndOpen();
      $apply();
      K.assertCurrentValue(this.doc.status$, 'ok');
      this.docLoader.doc.set(this.DocLoad.Error('disconnected'));
      K.assertCurrentValue(this.doc.status$, 'ot-connection-error');
    });

    it('is "editing-not-allowed" when doc opening is forbidden', function () {
      this.connectAndOpen();
      $apply();
      K.assertCurrentValue(this.doc.status$, 'ok');
      this.docLoader.doc.set(this.DocLoad.Error('forbidden'));
      K.assertCurrentValue(this.doc.status$, 'editing-not-allowed');
    });

    it('is "archived" when the entity is archived', function () {
      const doc = this.connectAndOpen();
      $apply();
      K.assertCurrentValue(this.doc.status$, 'ok');
      doc.setAt(['sys', 'archivedVersion'], 1);
      K.assertCurrentValue(this.doc.status$, 'archived');
    });
  });

  describe('#getValueAt()', () => {
    it('gets value from snapshot if doc is connected', function () {
      const doc = this.connectAndOpen();
      _.set(doc.snapshot, ['a', 'b'], 'VAL');
      expect(this.doc.getValueAt(['a', 'b'])).toEqual('VAL');
    });

    it('gets value from entity data if doc is not connected', function () {
      _.set(this.entity.data, ['a', 'b'], 'VAL');
      expect(this.doc.getValueAt(['a', 'b'])).toEqual('VAL');
    });
  });

  describe('#setValueAt()', () => {
    itRejectsWithoutDocument('setValueAt');

    itEmitsLocalFieldChange((doc, path) => {
      return doc.setValueAt(path, true);
    });

    it('sets deep value', function () {
      this.connectAndOpen();
      expect(this.doc.getValueAt(['a', 'b'])).toBe(undefined);
      this.doc.setValueAt(['a', 'b'], 'VAL');
      expect(this.doc.getValueAt(['a', 'b'])).toBe('VAL');
    });

    handlesForbidden(
      function () {
        const sjsDoc = this.connectAndOpen();
        sjsDoc.setAt = sinon.stub().yields('forbidden');
      },
      function () {
        this.doc.setValueAt(['a', 'b'], 'VAL');
      }
    );

    testDiff('Text');
    testDiff('Symbol');

    function testDiff(fieldType) {
      it(`uses diffing for ${fieldType} fields`, function () {
        this.contentType.data.fields = [{ id: 'id', type: fieldType }];
        const otDoc = this.connectAndOpen();

        const path = ['fields', 'id', 'en'];
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
        calledWith([{ p: path.concat([2]), si: 'I' }]);

        // delete inside of a string:
        this.doc.setValueAt(path, 'VIL');
        expect(this.doc.getValueAt(path)).toBe('VIL');
        calledWith([{ p: path.concat([1]), sd: 'A' }]);

        // compound patch:
        this.doc.setValueAt(path, 'PILS');
        expect(this.doc.getValueAt(path)).toBe('PILS');
        const p = path.concat([0]);
        calledWith([
          { p: p, sd: 'VIL' },
          { p: p, si: 'PILS' },
        ]);

        // delete from the front of a string:
        this.doc.setValueAt(path, 'S');
        expect(this.doc.getValueAt(path)).toBe('S');
        calledWith([{ p: path.concat([0]), sd: 'PIL' }]);
      });
    }
  });

  describe('#removeValueAt()', () => {
    itRejectsWithoutDocument('removeValueAt');

    itEmitsLocalFieldChange((doc, path) => {
      return doc.removeValueAt(path);
    });

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
      $apply();
      sinon.assert.called(resolved);
    });

    it('resolves quietly when doc.removeAt() throws', function () {
      const doc = this.connectAndOpen();
      doc.removeAt = sinon.stub().throws('ERROR');
      const resolved = sinon.stub();
      this.doc.removeValueAt('PATH').then(resolved);
      $apply();
      sinon.assert.called(resolved);
    });

    handlesForbidden(
      function () {
        const sjsDoc = this.connectAndOpen();
        sjsDoc.removeAt = sinon.stub().yields('forbidden');
      },
      function () {
        this.doc.removeValueAt(['a', 'b']);
      }
    );
  });

  describe('#insertValueAt()', () => {
    beforeEach(function () {
      this.otDoc = this.connectAndOpen({ a: [0, 1, 2], sys: {} });
    });

    itEmitsLocalFieldChange((doc, path) => {
      return doc.insertValueAt(path, 0, 'a');
    });

    itRejectsWithoutDocument('insertValueAt');

    it('inserts value into ShareJS document', function () {
      this.doc.insertValueAt(['a'], 1, 'X');
      $apply();
      expect(this.otDoc.snapshot.a).toEqual([0, 'X', 1, 2]);
    });

    it('sets value to singleton array', function () {
      delete this.otDoc.snapshot.a;
      this.doc.insertValueAt(['a'], 0, 'X');
      $apply();
      expect(this.otDoc.snapshot.a).toEqual(['X']);
    });
  });

  describe('#pushValueAt()', () => {
    beforeEach(function () {
      this.otDoc = this.connectAndOpen({ a: [0, 1, 2], sys: {} });
    });

    itRejectsWithoutDocument('pushValueAt');

    itEmitsLocalFieldChange((doc, path) => {
      return doc.pushValueAt(path);
    });

    it('pushes value into ShareJS document', function () {
      this.doc.pushValueAt(['a'], 'X');
      $apply();
      expect(this.otDoc.snapshot.a).toEqual([0, 1, 2, 'X']);
    });

    it('sets value to singleton array', function () {
      delete this.otDoc.snapshot.a;
      this.doc.pushValueAt(['a'], 'X');
      $apply();
      expect(this.otDoc.snapshot.a).toEqual(['X']);
    });

    handlesForbidden(
      function () {
        this.otDoc.insertAt = sinon.stub().yields('forbidden');
      },
      function () {
        this.doc.pushValueAt(['a'], 'X');
      }
    );
  });

  describe('#valuePropertyAt()', () => {
    it('gets initial value from entity if the doc is not opened', function () {
      this.entity.data = { a: { b: 'VAL' } };
      const cb = sinon.spy();
      this.doc.valuePropertyAt(['a', 'b']).onValue(cb);
      sinon.assert.calledWith(cb, 'VAL');
    });

    it('gets initial value from opened doc', function () {
      this.connectAndOpen({ a: { b: 'VAL' }, sys: {} });
      const cb = sinon.spy();
      this.doc.valuePropertyAt(['a', 'b']).onValue(cb);
      sinon.assert.calledWith(cb, 'VAL');
    });

    it('gets initial value from opened doc', function () {
      this.connectAndOpen({ a: { b: 'VAL' }, sys: {} });
      const cb = sinon.spy();
      this.doc.valuePropertyAt(['a', 'b']).onValue(cb);
      sinon.assert.calledWith(cb, 'VAL');
    });

    it('updates value when document is opened', function () {
      const cb = sinon.spy();
      this.doc.valuePropertyAt(['a', 'b']).onValue(cb);
      cb.reset();

      this.connectAndOpen({ a: { b: 'VAL' }, sys: {} });
      sinon.assert.calledWith(cb, 'VAL');
    });

    it('updates value when "change" event is emitted with affected path', function () {
      const paths = [[], ['foo'], ['foo', 'bar'], ['foo', 'bar', 'x'], ['foo', 'bar', 'x', 'y']];
      const doc = this.connectAndOpen({ foo: { bar: false }, sys: {} });
      const cb = sinon.spy();
      this.doc.valuePropertyAt(['foo', 'bar']).onValue(cb);

      paths.forEach((path, i) => {
        doc.setAt(['foo', 'bar'], i);
        cb.reset();
        doc.emit('change', [{ p: path }]);
        sinon.assert.calledWith(cb, i);
      });
    });

    it('does not update value when path is not affected', function () {
      const paths = [['x'], ['foo', 'x'], ['x', 'bar'], ['x', 'bar', 'y']];
      const doc = this.connectAndOpen();
      const cb = sinon.spy();
      this.doc.valuePropertyAt(['foo', 'bar']).onValue(cb);
      cb.reset();

      paths.forEach((path) => {
        doc.emit('change', [{ p: path }]);
        sinon.assert.notCalled(cb);
      });
    });

    describe('merging change events', () => {
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

        this.emitChange(
          paths.slice(0, 2).map((path) => {
            return { p: path };
          })
        );

        sinon.assert.calledOnce(spies[0]);
        sinon.assert.calledOnce(spies[1]);
        sinon.assert.notCalled(spies[2]);
      });

      it('defaults to zero length shared prefix', function () {
        const paths = [['x'], ['y'], ['z', 'w']];
        const spies = this.listenOn(paths);

        this.emitChange([{ p: ['y'] }, { p: ['x'] }]);

        spies.forEach((spy) => {
          sinon.assert.calledOnce(spy);
        });
      });
    });
  });

  describe('#sysProperty', () => {
    it('holds entity.data.sys as initial value', function () {
      K.assertCurrentValue(this.doc.sysProperty, this.entity.data.sys);
    });

    it('updates value from OtDoc data on any event', function () {
      const doc = this.connectAndOpen();

      doc.version = 20;
      doc.snapshot.sys.updatedBy = 'me';
      doc.emit('some event');
      $apply();

      K.assertMatchCurrentValue(
        this.doc.sysProperty,
        sinon.match({
          version: 20,
          updatedBy: 'me',
        })
      );
    });

    it('calculates version from doc.version + doc.compressed', function () {
      const doc = this.connectAndOpen();

      doc.version = 20;
      doc.compressed = 10;
      doc.emit('some event');
      $apply();

      const version = K.getValue(this.doc.sysProperty).version;
      expect(version).toBe(30);
    });

    it('keeps initial environment id to compensate for internal one exposed by ShareJS', async function () {
      const entityData = _.cloneDeep(this.initialEntity.data);
      entityData.sys.environment.sys.id = 'SOME_INTERNAL_ENV_ID';
      this.connectAndOpen(entityData);

      const envId = K.getValue(this.doc.sysProperty).environment.sys.id;
      expect(envId).not.toBe('SOME_INTERNAL_ENV_ID');
      expect(envId).toBe(this.initialEntity.data.sys.environment.sys.id);
    });

    it('keeps initial `updatedBy` if not provided by ShareJS', function () {
      this.entity.data.sys.updatedBy = 'me';
      this.doc = this.createDoc();
      const entityData = _.cloneDeep(this.initialEntity.data);
      entityData.sys.updatedBy = undefined;
      this.connectAndOpen(entityData);

      const updatedBy = K.getValue(this.doc.sysProperty).updatedBy;
      expect(updatedBy).not.toBe(undefined);
      expect(updatedBy).toBe(this.initialEntity.data.sys.updatedBy);
    });
  });

  describe('#state.isSaving$', () => {
    // TODO: adapt these to the new flow, remove these tests
    it('is false if there is no document initially', function () {
      K.assertCurrentValue(this.doc.state.isSaving$, false);
    });

    it('changes to if document has inflight operation', function () {
      this.otDoc = this.connectAndOpen();
      K.assertCurrentValue(this.doc.state.isSaving$, false);

      this.otDoc.inflightOp = true;
      this.otDoc.emit('change', []);
      $apply();
      K.assertCurrentValue(this.doc.state.isSaving$, true);

      this.otDoc.inflightOp = false;
      this.otDoc.emit('acknowledge');
      $apply();
      K.assertCurrentValue(this.doc.state.isSaving$, false);
    });
  });

  describe('#state.isDirty$', () => {
    beforeEach(function () {
      this.otDoc = this.connectAndOpen();
      this.docUpdate = function (path, value) {
        this.otDoc.setAt(path, value);
        $apply();
      };
    });

    it('changes to false if document is at published version', function () {
      K.assertCurrentValue(this.doc.state.isDirty$, true);

      this.otDoc.version = 12;
      this.docUpdate(['sys', 'publishedVersion'], 12);
      K.assertCurrentValue(this.doc.state.isDirty$, false);
    });

    it('changes to true if a published document is changed', function () {
      this.otDoc.version = 12;
      this.docUpdate(['sys', 'publishedVersion'], 12);
      K.assertCurrentValue(this.doc.state.isDirty$, false);

      this.docUpdate(['fields'], {});
      K.assertCurrentValue(this.doc.state.isDirty$, true);
    });

    it('changes to true if a document is unpublishd', function () {
      this.otDoc.version = 12;
      this.docUpdate(['sys', 'publishedVersion'], 12);
      K.assertCurrentValue(this.doc.state.isDirty$, false);

      this.docUpdate(['sys', 'publishedVersion'], undefined);
      K.assertCurrentValue(this.doc.state.isDirty$, true);
    });
  });

  describe('#state.error$', () => {
    it('emits "OpenForbidden" error when opening fails', function () {
      const errors = K.extractValues(this.doc.state.error$);
      this.docLoader.doc.set(this.DocLoad.Error('forbidden'));
      $apply();
      expect(errors[0].constructor.name).toBe('OpenForbidden');
    });
  });

  describe('#getVersion', () => {
    it('gets version from entity data if document is not connected', function () {
      this.entity.data.sys.version = 1999;
      const doc = this.createDoc();
      expect(doc.getVersion()).toBe(1999);
    });

    it('gets version from SJS Doc if document is connected', function () {
      const sjsDoc = this.connectAndOpen();
      sjsDoc.version = 2000;
      sjsDoc.emit();
      expect(this.doc.getVersion()).toBe(2000);
    });
  });

  describe('#presence', () => {
    // TODO:xxx - expose presence directly
    // just check that
    // - presence is "something" (PresenceHub instance)
    // - presence.collaboratorsFor is a function
    // potentially test for presence.instance
  });

  describe('#destroy', () => {
    it('ends the document streams', () => {
      const doc = this.createDoc();
      const destroyables = {};
      const addToDestroyables = (key, stream) => {
        destroyables[key] = false;
        stream.onEnd(() => (destroyables[key] = true));
      };
      Object.entries(doc.state).map(addToDestroyables);
      addToDestroyables('collaborators', doc.presence.collaborators);
      doc.destroy();
      expect(Object.values(destroyables).every(_.identity)).toBe(true);
    });
  });

  describe('client entity instance', () => {
    it('updates data when OtDoc emits changes', function () {
      const otDoc = this.connectAndOpen();
      $apply();
      otDoc.setAt(['fields', 'a', 'en'], 'VALUE');
      expect(this.entity.data.fields.a.en).toBe('VALUE');
    });

    it('marks entity as deleted when sys has deletedVersion', function () {
      const otDoc = this.connectAndOpen();
      this.entity.setDeleted = sinon.spy();
      $apply();
      otDoc.setAt(['sys', 'deletedVersion'], 1);
      expect(this.entity.data).toBe(undefined);
      sinon.assert.called(this.entity.setDeleted);
    });
  });

  function itRejectsWithoutDocument(method) {
    it('rejects when document is not opened', function () {
      this.docLoader.doc.set(this.DocLoad.None());
      $apply();
      const errored = sinon.stub();
      this.doc[method]().catch(errored);
      $apply();
      sinon.assert.called(errored);
    });
  }

  function handlesForbidden(beforeAction, action) {
    describe('handles forbidden error', () => {
      beforeEach(function () {
        this.docConnection.refreshAuth.rejects();
        beforeAction.call(this);
      });

      it('calls auth refresh on `forbidden` error', function () {
        action.call(this);
        $apply();
        sinon.assert.calledOnce(this.docConnection.refreshAuth);
      });

      it('emits error on state.error$ if auth refresh fails', function () {
        const errors = K.extractValues(this.doc.state.error$);
        action.call(this);
        $apply();
        expect(errors[0].constructor.name).toBe('SetValueForbidden');
      });
    });
  }

  function itEmitsLocalFieldChange(runSetter) {
    it('emits local field change for fields', async function () {
      const otDoc = this.connectAndOpen();
      const localFieldChange = sinon.spy();
      this.doc.localFieldChanges$.onValue(localFieldChange);
      await runSetter(this.doc, ['fields', 'A', 'B']);
      sinon.assert.calledOnce(localFieldChange.withArgs(['A', 'B']));

      otDoc.removeAt(['fields']);
      await runSetter(this.doc, ['fields', 'A', 'B', 'C']);
      sinon.assert.calledTwice(localFieldChange.withArgs(['A', 'B']));

      localFieldChange.reset();
      runSetter(this.doc, ['other', 'A', 'B', 'C']);
    });

    it('does not emit local field change for other paths', async function () {
      const otDoc = this.connectAndOpen();
      const localFieldChange = sinon.spy();
      this.doc.localFieldChanges$.onValue(localFieldChange);

      await runSetter(this.doc, ['fields', 'A']);
      otDoc.removeAt(['fields']);
      await runSetter(this.doc, ['fields']);
      await runSetter(this.doc, ['other']);
      sinon.assert.notCalled(localFieldChange);
    });
  }
});
