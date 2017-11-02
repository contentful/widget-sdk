describe('app/entity_editor/DataLoader', function () {
  beforeEach(function () {
    module('contentful/test');
    const $q = this.$inject('$q');

    // TODO use space context mock
    this.spaceContext = {
      space: {
        getEntry: sinon.spy(function (id) {
          return $q.resolve({data: makeEntity(id, 'CTID')});
        }),
        getAsset: sinon.spy(function (id) {
          return $q.resolve({data: makeEntity(id)});
        }),
        getPrivateLocales: sinon.stub().returns([])
      },
      publishedCTs: {
        fetch: function (id) {
          return $q.resolve({data: makeCt(id)});
        }
      },
      editingInterfaces: {
        get: sinon.stub().resolves({})
      },
      widgets: {
        buildRenderable: sinon.stub()
      },
      docPool: {
        get: sinon.stub()
      }
    };

    const DataLoader = this.$inject('app/entity_editor/DataLoader');
    this.loadEntry = _.partial(DataLoader.loadEntry, this.spaceContext);
    this.loadAsset = _.partial(DataLoader.loadAsset, this.spaceContext);
  });

  describe('#loadEntry()', function () {
    it('adds entry to context', function* () {
      const editorData = yield this.loadEntry('EID');
      sinon.assert.calledWith(this.spaceContext.space.getEntry, 'EID');
      expect(editorData.entity.data.sys.id).toEqual('EID');
    });

    it('adds the entry’s content type to the context', function* () {
      const editorData = yield this.loadEntry('EID');
      expect(editorData.contentType.data.sys.id).toEqual('CTID');
    });

    it('requests the editor interface', function* () {
      yield this.loadEntry('EID');
      sinon.assert.calledWith(
        this.spaceContext.editingInterfaces.get,
        sinon.match.has('sys', sinon.match.has('id', 'CTID'))
      );
    });

    it('builds field controls from editor interface', function* () {
      const ei = { controls: 'CONTROLS' };
      this.spaceContext.editingInterfaces.get.resolves(ei);
      yield this.loadEntry('EID');
      sinon.assert.calledWith(
        this.spaceContext.widgets.buildRenderable,
        'CONTROLS'
      );
    });

    it('adds the entry’s field controls to the context', function* () {
      const controls = {};
      this.spaceContext.widgets.buildRenderable.returns(controls);
      const editorData = yield this.loadEntry('EID');
      expect(editorData.fieldControls).toBe(controls);
    });

    it('adds entityInfo to the context', function* () {
      const {entityInfo} = yield this.loadEntry('EID');
      expect(entityInfo.id).toBe('EID');
      expect(entityInfo.type).toBe('Entry');
      expect(entityInfo.contentTypeId).toBe('CTID');
      expect(entityInfo.contentType.sys.id).toBe('CTID');
    });

    it('only adds specified properties', function* () {
      const data = yield this.loadEntry('EID');
      expect(Object.keys(data)).toEqual([
        'entity',
        'contentType',
        'fieldControls',
        'entityInfo',
        'openDoc'
      ]);
    });

    describe('sanitization', function () {
      beforeEach(function () {
        this.entry = makeEntity('EID', 'CTID');
        this.spaceContext.space.getEntry = sinon.stub().resolves({data: this.entry});
      });

      it('enforces field object', function* () {
        this.entry.fields = null;
        const editorData = yield this.loadEntry('EID');
        expect(_.isPlainObject(editorData.entity.data.fields)).toBe(true);
      });

      it('removes non object fields', function* () {
        this.entry.fields = null;
        this.entry.fields = {a: null, b: {}};
        const editorData = yield this.loadEntry('EID');
        expect(Object.keys(editorData.entity.data.fields)).toEqual(['b']);
      });

      it('removes unknown locale codes', function* () {
        this.spaceContext.space.getPrivateLocales.returns([
          {internal_code: 'l1'},
          {internal_code: 'l2'}
        ]);
        this.entry.fields = {
          a: {
            l1: true,
            l2: true,
            l3: true
          }
        };
        const editorData = yield this.loadEntry('EID');
        expect(editorData.entity.data.fields.a)
          .toEqual({l1: true, l2: true});
      });
    });

    it('provides #openDoc() delegate', function* () {
      this.spaceContext.docPool.get.returns('DOC');
      const editorData = yield this.loadEntry('EID');
      const doc = editorData.openDoc();
      expect(doc).toBe('DOC');
      sinon.assert.calledWith(
        this.spaceContext.docPool.get,
        editorData.entity,
        editorData.contentType
      );
    });
  });

  describe('#loadAsset()', function () {
    it('adds asset to context', function* () {
      const editorData = yield this.loadAsset('EID');
      sinon.assert.calledWith(this.spaceContext.space.getAsset, 'EID');
      expect(editorData.entity.data.sys.id).toEqual('EID');
    });

    it('builds field controls from asset editor interface', function* () {
      const assetEditorInterface = this.$inject('data/editingInterfaces/asset');
      yield this.loadAsset('EID');
      sinon.assert.calledWith(
        this.spaceContext.widgets.buildRenderable,
        assetEditorInterface.widgets
      );
    });

    it('only adds specified properties', function* () {
      const data = yield this.loadEntry('EID');
      expect(Object.keys(data)).toEqual([
        'entity',
        'contentType',
        'fieldControls',
        'entityInfo',
        'openDoc'
      ]);
    });
  });

  function makeEntity (id, ctid) {
    const type = ctid ? 'Entry' : 'Asset';
    const ct = ctid && {
      sys: { id: ctid }
    };
    return {
      sys: {
        id: id,
        type: type,
        contentType: ct
      }
    };
  }

  function makeCt (id) {
    return {
      sys: {
        id: id
      }
    };
  }
});
