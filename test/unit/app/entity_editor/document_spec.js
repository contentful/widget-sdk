'use strict';

describe('entityEditor/Document', function () {
  beforeEach(function () {
    module('contentful/test', ($provide) => {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });

    this.K = this.$inject('mocks/kefir');
    this.DocLoad = this.$inject('data/ShareJS/Connection').DocLoad;
    const OtDoc = this.$inject('mocks/OtDoc');

    this.docLoader = {
      doc: this.K.createMockProperty(this.DocLoad.None()),
      destroy: sinon.spy(),
      close: sinon.spy()
    };

    this.accessChecker = this.mockService('accessChecker');
    this.accessChecker.canUpdateEntity.returns(true);

    this.connectAndOpen = function (data) {
      data = _.cloneDeep(data || this.entity.data);
      if (!dotty.get(data, ['sys', 'type'])) {
        dotty.put(data, ['sys', 'type'], 'Entry');
      }
      const doc = new OtDoc(data);
      this.docLoader.doc.set(this.DocLoad.Doc(doc));
      this.$apply();
      return doc;
    };

    this.localeStore = this.$inject('TheLocaleStore');
    this.localeStore.setLocales([
      {internal_code: 'en'}
    ]);

    this.contentType = {
      data: {
        sys: {id: 'CT_ID'},
        fields: []
      }
    };

    this.entity = {
      data: {
        sys: {
          id: 'ENTITY_ID',
          version: 8,
          contentType: {
            sys: this.contentType.data.sys
          }
        },
        fields: {
          a: {
            en: 'INITIAL'
          }
        }
      }
    };

    this.createDoc = (type = 'Entry') => {
      const Doc = this.$inject('entityEditor/Document');
      const docConnection = {
        getDocLoader: sinon.stub().returns(this.docLoader)
      };

      this.entity.data.sys.type = type;

      return Doc.create(
        docConnection,
        this.entity,
        this.contentType,
        {sys: {id: 'USER'}}
      );
    };

    this.doc = this.createDoc();
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

    afterEach(function () {
      this.normalize.restore();
    });

    it('calls the document normalizer', function () {
      sinon.assert.calledWith(
        this.normalize,
        this.doc, this.otDoc.snapshot, this.contentType, this.localeStore.getPrivateLocales()
      );
    });
  });

  describe('on instance destruction', function () {
    it('closes the doc', function () {
      this.otDoc = this.connectAndOpen();
      this.doc.destroy();
      sinon.assert.called(this.docLoader.close);
    });
  });

  describe('#status$', function () {
    it('is "ok" initially', function () {
      this.K.assertCurrentValue(this.doc.status$, 'ok');
    });

    it('is "ok" when the document connects', function () {
      this.connectAndOpen();
      this.$apply();
      this.K.assertCurrentValue(this.doc.status$, 'ok');
    });

    it('is "ot-connection-error" when there is a document error', function () {
      this.connectAndOpen();
      this.$apply();
      this.K.assertCurrentValue(this.doc.status$, 'ok');
      this.docLoader.doc.set(this.DocLoad.Error());
      this.K.assertCurrentValue(this.doc.status$, 'ot-connection-error');
    });

    it('is "archived" when the entity is archived', function () {
      const doc = this.connectAndOpen();
      this.$apply();
      this.K.assertCurrentValue(this.doc.status$, 'ok');
      doc.setAt(['sys', 'archivedVersion'], 1);
      this.K.assertCurrentValue(this.doc.status$, 'archived');
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

        const path = ['fields', 'id', 'locale'];
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

  describe('#reverter', function () {
    it('has changes if changes are made', function* () {
      this.connectAndOpen();
      expect(this.doc.reverter.hasChanges()).toBe(false);
      yield this.doc.setValueAt(['fields', 'foo'], 'bar');
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
      yield this.doc.setValueAt(['fields', 'foo'], 'bar');
      expect(this.doc.reverter.hasChanges()).toBe(true);
      yield this.doc.reverter.revert();
      expect(this.doc.reverter.hasChanges()).toBe(false);
    });
  });

  describe('#sysProperty', function () {
    it('holds entity.data.sys as initial value', function () {
      this.K.assertCurrentValue(
        this.doc.sysProperty,
        this.entity.data.sys
      );
    });

    it('updates value from OtDoc data on any event', function () {
      const doc = this.connectAndOpen();

      doc.version = 20;
      doc.snapshot.sys.updatedBy = 'me';
      doc.emit('some event');
      this.$apply();

      this.K.assertMatchCurrentValue(
        this.doc.sysProperty,
        sinon.match({
          version: 20,
          updatedBy: 'me'
        })
      );
    });
  });

  describe('#state.isSaving$', function () {
    it('is false if there is no document initially', function () {
      this.K.assertCurrentValue(this.doc.state.isSaving$, false);
    });

    it('changes to if document has inflight operation', function () {
      this.otDoc = this.connectAndOpen();
      this.K.assertCurrentValue(this.doc.state.isSaving$, false);

      this.otDoc.inflightOp = true;
      this.otDoc.emit('change', []);
      this.$apply();
      this.K.assertCurrentValue(this.doc.state.isSaving$, true);

      this.otDoc.inflightOp = false;
      this.otDoc.emit('acknowledge');
      this.$apply();
      this.K.assertCurrentValue(this.doc.state.isSaving$, false);
    });
  });

  describe('#state.isDirty$', function () {
    beforeEach(function () {
      this.otDoc = this.connectAndOpen();
      this.docUpdate = function (path, value) {
        this.otDoc.setAt(path, value);
        this.$apply();
      };
    });

    it('changes to false if document is at published version', function () {
      this.K.assertCurrentValue(this.doc.state.isDirty$, true);

      this.otDoc.version = 12;
      this.docUpdate(['sys', 'publishedVersion'], 12);
      this.K.assertCurrentValue(this.doc.state.isDirty$, false);
    });

    xit('changes to true if a published document is changed', function () {
      this.otDoc.version = 12;
      this.docUpdate(['sys', 'publishedVersion'], 12);
      this.K.assertCurrentValue(this.doc.state.isDirty$, false);

      this.docUpdate(['fields'], {});
      expect(this.isDirtyValues[0]).toBe(true);
      this.K.assertCurrentValue(this.doc.state.isDirty$, true);
    });

    it('changes to true if a document is unpublishd', function () {
      this.otDoc.version = 12;
      this.docUpdate(['sys', 'publishedVersion'], 12);
      this.K.assertCurrentValue(this.doc.state.isDirty$, false);

      this.docUpdate(['sys', 'publishedVersion'], undefined);
      this.K.assertCurrentValue(this.doc.state.isDirty$, true);
    });
  });

  describe('#state.isConnected$', function () {
    it('changes to true when connecting', function () {
      this.K.assertCurrentValue(this.doc.state.isConnected$, false);
      this.connectAndOpen();
      this.K.assertCurrentValue(this.doc.state.isConnected$, true);
    });

    it('changes to false when there is a connection error', function () {
      this.connectAndOpen();
      this.K.assertCurrentValue(this.doc.state.isConnected$, true);
      this.docLoader.doc.set(this.DocLoad.Error());
      this.K.assertCurrentValue(this.doc.state.isConnected$, false);
    });
  });

  describe('#permissions', function () {
    describe('#can()', function () {
      it('delegates to "accessChecker.canPerformActionOnEntity()"', function () {
        this.accessChecker.canPerformActionOnEntity.returns(true);
        expect(this.doc.permissions.can('publish')).toBe(true);

        this.accessChecker.canPerformActionOnEntity.returns(false);
        expect(this.doc.permissions.can('publish')).toBe(false);

        const entity = this.accessChecker.canPerformActionOnEntity.args[0][1];
        expect(entity.data.sys.id).toEqual('ENTITY_ID');
      });

      it('delegates "update" calls to "accessChecker.canUpdateEntry()"', function () {
        this.accessChecker.canUpdateEntry.returns(true);
        expect(this.doc.permissions.can('update')).toBe(true);

        this.accessChecker.canUpdateEntry.returns(false);
        expect(this.doc.permissions.can('update')).toBe(false);

        const entity = this.accessChecker.canUpdateEntry.args[0][0];
        expect(entity.data.sys.id).toEqual('ENTITY_ID');
      });

      it('delegates "update" calls to "accessChecker.canUpdateAsset()"', function () {
        const doc = this.createDoc('Asset');

        this.accessChecker.canUpdateAsset.returns(true);
        expect(doc.permissions.can('update')).toBe(true);

        this.accessChecker.canUpdateAsset.returns(false);
        expect(doc.permissions.can('update')).toBe(false);

        const entity = this.accessChecker.canUpdateAsset.args[0][0];
        expect(entity.data.sys.id).toEqual('ENTITY_ID');
      });

      it('throws when action is unknown', function () {
        const doc = this.createDoc();
        expect(
          _.partial(doc.permissions.can, 'abc')
        ).toThrowError('Unknown entity action "abc"');
      });
    });

    describe('#canEditFieldLocale()', function () {
      it('delegates to "policyAccessChecker"', function () {
        const pac = this.mockService('accessChecker/policy');

        pac.canEditFieldLocale.returns(true);
        expect(this.doc.permissions.canEditFieldLocale('FIELD', 'LOCALE')).toBe(true);

        pac.canEditFieldLocale.returns(false);
        expect(this.doc.permissions.canEditFieldLocale('FIELD', 'LOCALE')).toBe(false);

        const args = pac.canEditFieldLocale.args[0];
        const [ctId, {apiName}, {code}] = args;
        expect(ctId).toBe('CT_ID');
        expect(apiName).toBe('FIELD');
        expect(code).toBe('LOCALE');
      });
    });
  });

  describe('client entity instance', function () {
    it('updates data when OtDoc emits changes', function () {
      const otDoc = this.connectAndOpen();
      this.$apply();
      otDoc.setAt(['fields'], 'FIELDS');
      expect(this.entity.data.fields).toBe('FIELDS');
    });

    it('marks entity as deleted when sys has deletedVersion', function () {
      const otDoc = this.connectAndOpen();
      this.entity.setDeleted = sinon.spy();
      this.$apply();
      otDoc.setAt(['sys', 'deletedVersion'], 1);
      expect(this.entity.data).toBe(undefined);
      sinon.assert.called(this.entity.setDeleted);
    });
  });

  function itRejectsWithoutDocument (method) {
    it('rejects when document is not opened', function () {
      this.docLoader.doc.set(this.DocLoad.None());
      this.$apply();
      const errored = sinon.stub();
      this.doc[method]().catch(errored);
      this.$apply();
      sinon.assert.called(errored);
    });
  }

});
