describe('app/entity_editor/DataLoader', function () {
  beforeEach(function () {
    module('contentful/test');
    const $q = this.$inject('$q');

    this.spaceContext = {
      space: {
        getEntry: sinon.spy(function (id) {
          return $q.resolve({data: makeEntity(id, 'CTID')});
        }),
        getAsset: sinon.spy(function (id) {
          return $q.resolve({data: makeEntity(id, 'CTID')});
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
  });

  function makeEntity (id, ctid) {
    return {
      sys: {
        id: id,
        contentType: {
          sys: { id: ctid }
        }
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
