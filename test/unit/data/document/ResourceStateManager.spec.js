import sinon from 'sinon';
import * as K from 'test/utils/kefir';
import createMockSpaceEndpoint from 'test/utils/createSpaceEndpointMock';
import { $initialize } from 'test/utils/ng';
import { it } from 'test/utils/dsl';
import createOtDocMock from 'test/helpers/mocks/ot_doc';

const OtDocMock = createOtDocMock();

describe('data/document/ResourceStateManager', () => {
  beforeEach(async function () {
    this.system.set('access_control/AccessChecker', {
      canUpdateEntity: sinon.stub().returns(true),
      Action: {
        READ: 'read',
      },
    });

    const { Action, State } = await this.system.import('data/CMA/EntityState');
    this.Action = Action;
    this.State = State;

    const { DocLoad } = await this.system.import('data/sharejs/Connection');
    const Doc = await this.system.import('app/entity_editor/Document/OtDocument');
    const EntityRepo = await this.system.import('data/CMA/EntityRepo');

    await $initialize(this.system);

    const endpoint = createMockSpaceEndpoint();
    this.spaceEndpoint = sinon.spy(endpoint.request);
    const entityRepo = EntityRepo.create(this.spaceEndpoint);

    const entityData = {
      sys: {
        id: 'ENTITY_ID',
        type: 'Entry',
        version: 8,
        contentType: {
          sys: { id: 'CTID' },
        },
        environment: {
          sys: { id: 'ENV_ID' },
        },
      },
      fields: {},
    };

    endpoint.stores.entries['ENTITY_ID'] = entityData;

    const entity = {
      data: entityData,
      setDeleted: sinon.stub(),
    };

    this.sjsDoc = new OtDocMock(entityData);

    const docLoader = {
      doc: K.createMockProperty(DocLoad.None()),
      destroy: sinon.spy(),
      close: sinon.spy(),
    };

    const docConnection = {
      getDocLoader: sinon.stub().returns(docLoader),
    };

    this.doc = Doc.create(docConnection, entity, {}, { sys: { id: 'USER' } }, entityRepo);

    // TODO we cannot load the ShareJS doc before the the entity
    // document is created.
    docLoader.doc.set(DocLoad.Doc(this.sjsDoc));
  });

  it('applies actions and makes HTTP requests', async function () {
    await this.doc.resourceState.apply(this.Action.Publish());
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'PUT',
      path: ['entries', 'ENTITY_ID', 'published'],
      version: 8,
    });
    K.assertMatchCurrentValue(
      this.doc.sysProperty,
      sinon.match({
        version: 9,
        publishedVersion: 8,
        archivedVersion: undefined,
      })
    );
    K.assertCurrentValue(this.doc.resourceState.state$, this.State.Published());

    await this.doc.resourceState.apply(this.Action.Archive());
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'DELETE',
      path: ['entries', 'ENTITY_ID', 'published'],
      version: 9,
    });
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'PUT',
      path: ['entries', 'ENTITY_ID', 'archived'],
      version: 10,
    });
    K.assertMatchCurrentValue(
      this.doc.sysProperty,
      sinon.match({
        version: 11,
        publishedVersion: undefined,
        archivedVersion: 10,
      })
    );
    K.assertCurrentValue(this.doc.resourceState.state$, this.State.Archived());

    await this.doc.resourceState.apply(this.Action.Unarchive());
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'DELETE',
      path: ['entries', 'ENTITY_ID', 'archived'],
      version: 11,
    });
    K.assertMatchCurrentValue(
      this.doc.sysProperty,
      sinon.match({
        version: 12,
        publishedVersion: undefined,
        archivedVersion: undefined,
      })
    );
    K.assertCurrentValue(this.doc.resourceState.state$, this.State.Draft());

    await this.doc.resourceState.apply(this.Action.Delete());
    sinon.assert.calledWith(this.spaceEndpoint, {
      method: 'DELETE',
      path: ['entries', 'ENTITY_ID'],
      version: 12,
    });
    K.assertMatchCurrentValue(
      this.doc.sysProperty,
      sinon.match({
        version: 13,
        deletedVersion: 12,
        publishedVersion: undefined,
        archivedVersion: undefined,
      })
    );
    K.assertCurrentValue(this.doc.resourceState.state$, this.State.Deleted());
  });

  it('changes state$ when sys property changes', function () {
    K.assertCurrentValue(this.doc.resourceState.state$, this.State.Draft());

    this.sjsDoc.setAt(['sys', 'publishedVersion'], 8);
    K.assertCurrentValue(this.doc.resourceState.state$, this.State.Published());

    this.sjsDoc.setAt(['fields'], {});
    K.assertCurrentValue(this.doc.resourceState.state$, this.State.Changed());

    this.sjsDoc.removeAt(['sys', 'publishedVersion']);
    this.sjsDoc.setAt(['sys', 'archivedVersion'], this.sjsDoc.version);
    K.assertCurrentValue(this.doc.resourceState.state$, this.State.Archived());

    this.sjsDoc.setAt(['sys', 'deletedVersion'], this.sjsDoc.version);
    K.assertCurrentValue(this.doc.resourceState.state$, this.State.Deleted());
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
