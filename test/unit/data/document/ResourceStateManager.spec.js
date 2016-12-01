describe('data/document/ResourceStateManager', function () {
  beforeEach(function () {
    module('contentful/test');

    this.K = this.$inject('mocks/kefir');
    const {Action, State} = this.$inject('data/document/ResourceStateManager');
    this.Action = Action;
    this.State = State;

    const DocLoad = this.$inject('data/ShareJS/Connection').DocLoad;
    const Doc = this.$inject('entityEditor/Document');

    this.spaceEndpoint = sinon.spy(this.$inject('mocks/spaceEndpoint').create());

    const entityData = {
      sys: {
        id: 'ENTITY_ID',
        type: 'Entry',
        version: 8,
        contentType: {
          sys: { id: 'CTID' }
        }
      },
      fields: {}
    };

    const OtDoc = this.$inject('mocks/OtDoc');
    this.sjsDoc = new OtDoc(entityData);

    const docLoader = {
      doc: this.K.createMockProperty(DocLoad.None()),
      destroy: sinon.spy()
    };

    const docConnection = {
      getDocLoader: sinon.stub().returns(docLoader)
    };

    this.doc = Doc.create(
      docConnection,
      {data: entityData},
      {},
      {sys: {id: 'USER'}},
      this.spaceEndpoint
    );

    // TODO we cannot load the ShareJS doc before the the entity
    // document is created.
    docLoader.doc.set(DocLoad.Doc(this.sjsDoc));
  });

  it('applies actions and makes HTTP requests', function* () {
    yield this.doc.resourceState.apply(this.Action.Publish());
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'PUT',
      path: 'entries/ENTITY_ID/published',
      version: 8
    });
    this.K.assertMatchCurrentValue(this.doc.sysProperty, sinon.match({
      version: 9,
      publishedVersion: 8,
      archivedVersion: undefined
    }));
    this.K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Published()
    );

    yield this.doc.resourceState.apply(this.Action.Archive());
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'DELETE',
      path: 'entries/ENTITY_ID/published',
      version: 9
    });
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'PUT',
      path: 'entries/ENTITY_ID/archived',
      version: 10
    });
    this.K.assertMatchCurrentValue(this.doc.sysProperty, sinon.match({
      version: 11,
      publishedVersion: undefined,
      archivedVersion: 10
    }));
    this.K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Archived()
    );

    yield this.doc.resourceState.apply(this.Action.Unarchive());
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'DELETE',
      path: 'entries/ENTITY_ID/archived',
      version: 11
    });
    this.K.assertMatchCurrentValue(this.doc.sysProperty, sinon.match({
      version: 12,
      publishedVersion: undefined,
      archivedVersion: undefined
    }));
    this.K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Draft()
    );

    yield this.doc.resourceState.apply(this.Action.Delete());
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'DELETE',
      path: 'entries/ENTITY_ID',
      version: 12
    });
    this.K.assertMatchCurrentValue(this.doc.sysProperty, sinon.match({
      version: 13,
      deletedVersion: 12,
      publishedVersion: undefined,
      archivedVersion: undefined
    }));
    this.K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Deleted()
    );
  });

  it('changes state$ when sys property changes', function () {
    this.K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Draft()
    );

    this.sjsDoc.setAt(['sys', 'publishedVersion'], 8);
    this.K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Published()
    );

    this.sjsDoc.setAt(['fields'], {});
    this.K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Changed()
    );

    this.sjsDoc.removeAt(['sys', 'publishedVersion']);
    this.sjsDoc.setAt(['sys', 'archivedVersion'], this.sjsDoc.version);
    this.K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Archived()
    );

    this.sjsDoc.setAt(['sys', 'deletedVersion'], this.sjsDoc.version);
    this.K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Deleted()
    );
  });
});
