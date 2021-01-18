import * as K from '__mocks__/kefirMock';
import createMockSpaceEndpoint from '__mocks__/createSpaceEndpointMock';
import ShareJsDocMock from 'app/entity_editor/Document/__mocks__/ShareJsDocMock';
import { Action, State } from 'data/CMA/EntityState';
import { DocLoad } from 'data/sharejs/Connection';
import * as Doc from 'app/entity_editor/Document/OtDocument';
import * as EntityRepo from 'data/CMA/EntityRepo';

const OtDocMock = ShareJsDocMock();

jest.mock('core/NgRegistry', () => ({
  ...jest.requireActual('core/NgRegistry'),
  getModule: jest.fn().mockImplementation(() => {
    const interval = jest.fn();
    interval.cancel = jest.fn();
    return interval;
  }),
}));

jest.mock('access_control/AccessChecker', () => ({
  canUpdateEntity: jest.fn().mockReturnValue(true),
  Action: {
    READ: 'read',
  },
}));

describe('data/document/ResourceStateManager', () => {
  let spaceEndpoint, sjsDoc, doc;

  beforeEach(async function () {
    const endpoint = createMockSpaceEndpoint();
    spaceEndpoint = jest.fn(endpoint.request);
    const entityRepo = EntityRepo.create(spaceEndpoint);

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
      setDeleted: jest.fn(),
    };

    sjsDoc = new OtDocMock(entityData);

    const docLoader = {
      doc: K.createMockProperty(DocLoad.None()),
      destroy: jest.fn(),
      close: jest.fn(),
    };

    const docConnection = {
      getDocLoader: jest.fn().mockReturnValue(docLoader),
    };

    doc = Doc.create(docConnection, entity, {}, { sys: { id: 'USER' } }, entityRepo);

    // TODO we cannot load the ShareJS doc before the the entity
    // document is created.
    docLoader.doc.set(DocLoad.Doc(sjsDoc));
  });

  it('applies actions and makes HTTP requests', async function () {
    await doc.resourceState.apply(Action.Publish());
    expect(spaceEndpoint).toHaveBeenNthCalledWith(
      1,
      {
        method: 'PUT',
        path: ['entries', 'ENTITY_ID', 'published'],
        version: 8,
      },
      { 'X-Contentful-Skip-Transformation': 'true' }
    );
    K.assertContainingCurrentValue(doc.sysProperty, {
      version: 9,
      publishedVersion: 8,
      archivedVersion: undefined,
    });
    K.assertCurrentValue(doc.resourceState.state$, State.Published());

    await doc.resourceState.apply(Action.Archive());
    expect(spaceEndpoint).toHaveBeenNthCalledWith(
      2,
      {
        method: 'DELETE',
        path: ['entries', 'ENTITY_ID', 'published'],
        version: 9,
      },
      { 'X-Contentful-Skip-Transformation': 'true' }
    );
    expect(spaceEndpoint).toHaveBeenNthCalledWith(
      3,
      {
        method: 'PUT',
        path: ['entries', 'ENTITY_ID', 'archived'],
        version: 10,
      },
      { 'X-Contentful-Skip-Transformation': 'true' }
    );
    K.assertContainingCurrentValue(doc.sysProperty, {
      version: 11,
      publishedVersion: undefined,
      archivedVersion: 10,
    });
    K.assertCurrentValue(doc.resourceState.state$, State.Archived());

    await doc.resourceState.apply(Action.Unarchive());
    expect(spaceEndpoint).toHaveBeenCalledWith(
      {
        method: 'DELETE',
        path: ['entries', 'ENTITY_ID', 'archived'],
        version: 11,
      },
      { 'X-Contentful-Skip-Transformation': 'true' }
    );
    K.assertContainingCurrentValue(doc.sysProperty, {
      version: 12,
      publishedVersion: undefined,
      archivedVersion: undefined,
    });
    K.assertCurrentValue(doc.resourceState.state$, State.Draft());

    await doc.resourceState.apply(Action.Delete());
    expect(spaceEndpoint).toHaveBeenCalledWith(
      {
        method: 'DELETE',
        path: ['entries', 'ENTITY_ID'],
        version: 12,
      },
      { 'X-Contentful-Skip-Transformation': 'true' }
    );
    K.assertContainingCurrentValue(doc.sysProperty, {
      version: 13,
      deletedVersion: 12,
      publishedVersion: undefined,
      archivedVersion: undefined,
    });
    K.assertCurrentValue(doc.resourceState.state$, State.Deleted());
  });

  it('changes state$ when sys property changes', function () {
    K.assertCurrentValue(doc.resourceState.state$, State.Draft());

    sjsDoc.setAt(['sys', 'publishedVersion'], 8);
    K.assertCurrentValue(doc.resourceState.state$, State.Published());

    sjsDoc.setAt(['fields'], {});
    K.assertCurrentValue(doc.resourceState.state$, State.Changed());

    sjsDoc.removeAt(['sys', 'publishedVersion']);
    sjsDoc.setAt(['sys', 'archivedVersion'], sjsDoc.version);
    K.assertCurrentValue(doc.resourceState.state$, State.Archived());

    sjsDoc.setAt(['sys', 'deletedVersion'], sjsDoc.version);
    K.assertCurrentValue(doc.resourceState.state$, State.Deleted());
  });

  it('ends streams when document is destroyed', function () {
    const endState = jest.fn();
    const endStateChange = jest.fn();

    doc.resourceState.state$.onEnd(endState);
    doc.resourceState.stateChange$.onEnd(endStateChange);

    doc.destroy();

    expect(endState).toHaveBeenCalledTimes(1);
    expect(endStateChange).toHaveBeenCalledTimes(1);
  });
});
