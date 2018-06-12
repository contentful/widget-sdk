import * as K from 'helpers/mocks/kefir';
import createMockSpaceEndpoint from 'helpers/mocks/SpaceEndpoint';

describe('data/document/ResourceStateManager', () => {
  beforeEach(function () {
    module('contentful/test');

    const {Action, State} = this.$inject('data/document/ResourceStateManager');
    this.Action = Action;
    this.State = State;

    const DocLoad = this.$inject('data/sharejs/Connection').DocLoad;
    const Doc = this.$inject('app/entity_editor/Document');

    const endpoint = createMockSpaceEndpoint();
    this.spaceEndpoint = sinon.spy(endpoint.request);

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

    endpoint.stores.entries['ENTITY_ID'] = entityData;

    const entity = {
      data: entityData,
      setDeleted: sinon.stub()
    };

    const OtDoc = this.$inject('mocks/OtDoc');
    this.sjsDoc = new OtDoc(entityData);

    const docLoader = {
      doc: K.createMockProperty(DocLoad.None()),
      destroy: sinon.spy(),
      close: sinon.spy()
    };

    const docConnection = {
      getDocLoader: sinon.stub().returns(docLoader)
    };

    this.doc = Doc.create(
      docConnection,
      entity,
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
      path: ['entries', 'ENTITY_ID', 'published'],
      version: 8
    });
    K.assertMatchCurrentValue(this.doc.sysProperty, sinon.match({
      version: 9,
      publishedVersion: 8,
      archivedVersion: undefined
    }));
    K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Published()
    );

    yield this.doc.resourceState.apply(this.Action.Archive());
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'DELETE',
      path: ['entries', 'ENTITY_ID', 'published'],
      version: 9
    });
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'PUT',
      path: ['entries', 'ENTITY_ID', 'archived'],
      version: 10
    });
    K.assertMatchCurrentValue(this.doc.sysProperty, sinon.match({
      version: 11,
      publishedVersion: undefined,
      archivedVersion: 10
    }));
    K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Archived()
    );

    yield this.doc.resourceState.apply(this.Action.Unarchive());
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'DELETE',
      path: ['entries', 'ENTITY_ID', 'archived'],
      version: 11
    });
    K.assertMatchCurrentValue(this.doc.sysProperty, sinon.match({
      version: 12,
      publishedVersion: undefined,
      archivedVersion: undefined
    }));
    K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Draft()
    );

    yield this.doc.resourceState.apply(this.Action.Delete());
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'DELETE',
      path: ['entries', 'ENTITY_ID'],
      version: 12
    });
    K.assertMatchCurrentValue(this.doc.sysProperty, sinon.match({
      version: 13,
      deletedVersion: 12,
      publishedVersion: undefined,
      archivedVersion: undefined
    }));
    K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Deleted()
    );
  });

  it('changes state$ when sys property changes', function () {
    K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Draft()
    );

    this.sjsDoc.setAt(['sys', 'publishedVersion'], 8);
    K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Published()
    );

    this.sjsDoc.setAt(['fields'], {});
    K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Changed()
    );

    this.sjsDoc.removeAt(['sys', 'publishedVersion']);
    this.sjsDoc.setAt(['sys', 'archivedVersion'], this.sjsDoc.version);
    K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Archived()
    );

    this.sjsDoc.setAt(['sys', 'deletedVersion'], this.sjsDoc.version);
    K.assertCurrentValue(
      this.doc.resourceState.state$,
      this.State.Deleted()
    );
  });

  it('ends streams when document is destroyed', function () {
    const endState = sinon.spy();
    const endStateChange = sinon.spy();

    this.doc.resourceState.state$.onEnd(endState);
    this.doc.resourceState.stateChange$.onEnd(endStateChange);

    this.doc.destroy();

    sinon.assert.calledOnce(endState);
    sinon.assert.calledOnce(endStateChange);
  });
});
