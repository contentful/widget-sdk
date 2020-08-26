import _ from 'lodash';
import { createBatchPerformer } from './batchPerformer';
import * as analytics from 'analytics/Analytics';
import { getModule } from 'core/NgRegistry';
import * as crypto from 'crypto';

jest.mock('analytics/Analytics');
jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));

analytics.track = jest.fn();

const ENTITY_API = ['publish', 'unpublish', 'archive', 'unarchive', 'delete'];
const API = ENTITY_API.concat(['duplicate']);

function preparePerformer(type, makeFn, entityData) {
  // to get the editorInterface, we fetch it from spaceContext and memoize by ct id
  const ctId = crypto.randomBytes(10).toString('hex');
  const entities = [makeFn(entityData, ctId), makeFn(entityData, ctId), makeFn(entityData, ctId)];
  const performer = createBatchPerformer({ entityType: type, entities });
  return [performer, entities];
}

function makeEntity(data) {
  const entity = { data };
  entity.getVersion = jest.fn().mockReturnValue(123);
  entity.setDeleted = jest.fn();
  return _.transform(
    ENTITY_API,
    (entity, method) => {
      entity[method] = jest.fn().mockResolvedValue(entity);
    },
    entity
  );
}

function makeEntry(data, ctId) {
  const sys = { type: 'Entry', contentType: { sys: { id: ctId } } };
  return _.extend(makeEntity(data), { getSys: _.constant(sys) });
}

describe('Batch performer service', () => {
  let performer;
  let entities;
  const entityType = 'Entry';

  describe('performing batch entry operations', () => {
    let displayField;
    let slugId;
    const entityData = {
      fields: {
        [displayField]: {
          'en-US': 'Hello',
        },
        [slugId]: {
          'en-US': 'hello',
        },
      },
    };
    beforeEach(() => {
      const entry = preparePerformer('Entry', makeEntry, entityData);
      performer = entry[0];
      entities = entry[1];
      slugId = crypto.randomBytes(10).toString('hex');
      displayField = crypto.randomBytes(10).toString('hex');
    });

    it('creates API consisting of available entry batch operations', () => {
      API.forEach((method) => {
        expect(typeof performer[method]).toBe('function');
      });
    });

    ENTITY_API.forEach((action) => {
      describe(action, () => {
        let actionStubs;
        beforeEach(() => {
          actionStubs = _.map(entities, (entity) => entity[action]);
        });

        it('calls entity action for all selected entities', () => {
          performer[action]();
          actionStubs.forEach((actionStub) => {
            expect(actionStub).toHaveBeenCalledTimes(1);
          });
        });

        it('resolves with an object containing successful and failed call arrays', () => {
          actionStubs[1].mockRejectedValue('boom');
          return performer[action]().then((results) => {
            expect(results.succeeded).toHaveLength(2);
            expect(results.failed).toHaveLength(1);
          });
        });

        it('creates analytics event', () => {
          return performer[action]().then(() => {
            expect(analytics.track).toHaveBeenCalledTimes(1);
            expect(analytics.track).toHaveBeenCalledWith('entity_list:bulk_action_performed', {
              action,
              entityType,
              failed_count: 0,
              succeeded_count: 3,
            });
          });
        });

        it('set as deleted and fires delete listener for 404 HTTP errors', async () => {
          actionStubs[1].mockRejectedValue({ statusCode: 404 });
          const entity = entities[1];
          await performer[action]();
          expect(entity.setDeleted).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});

describe('performing batch asset operations', () => {
  let performer;
  let entities;
  const entityType = 'Asset';

  beforeEach(() => {
    const entry = preparePerformer('Asset', makeEntity);
    performer = entry[0];
    entities = entry[1];
  });

  it('creates API consisting of available asset batch operations', () => {
    ENTITY_API.forEach((method) => {
      expect(typeof performer[method]).toBe('function');
    });
  });

  ENTITY_API.forEach((action) => {
    describe(action, () => {
      let actionStubs;

      beforeEach(() => {
        actionStubs = _.map(entities, (entity) => entity[action]);
      });

      it('calls entity action for all selected entities', () => {
        performer[action]();
        actionStubs.forEach((actionStub) => {
          expect(actionStub).toHaveBeenCalledTimes(1);
        });
      });

      it('resolves with an object containing successful and failed call arrays', () => {
        actionStubs[1].mockRejectedValue('boom');
        return performer[action]().then((results) => {
          expect(results.succeeded).toHaveLength(2);
          expect(results.failed).toHaveLength(1);
        });
      });

      it('creates analytics event', () => {
        return performer[action]().then(() => {
          expect(analytics.track).toHaveBeenCalledTimes(1);
          expect(analytics.track).toHaveBeenCalledWith('entity_list:bulk_action_performed', {
            action,
            entityType,
            failed_count: 0,
            succeeded_count: 3,
          });
        });
      });

      it('set as deleted and fires delete listener for 404 HTTP errors', async () => {
        actionStubs[1].mockRejectedValue({ statusCode: 404 });
        const entity = entities[1];
        await performer[action]();
        expect(entity.setDeleted).toHaveBeenCalledTimes(1);
      });
    });
  });
});

describe('batch duplicate', () => {
  let displayField;
  let slugId;
  let defaultContentTypeFields;
  let defaultEditorControls;
  let resultFields;
  const slugFieldId = 'slug';

  const mockSpace = (contentTypeFields, editorControls) => {
    const createEntry = (_id, { fields }) => {
      // because performer creates a batch of entries and the action is called on each of them
      resultFields.push(fields);
      return Promise.resolve();
    };

    getModule.mockReturnValue({
      publishedCTs: {
        get: jest.fn().mockReturnValue(contentTypeFields || defaultContentTypeFields),
      },
      cma: {
        getEditorInterface: jest.fn().mockResolvedValue(editorControls || defaultEditorControls),
      },
      space: { createEntry },
    });
  };

  beforeEach(() => {
    resultFields = [];
    displayField = crypto.randomBytes(8).toString('hex');
    slugId = crypto.randomBytes(8).toString('hex');
    defaultContentTypeFields = {
      data: {
        displayField: displayField,
        fields: [
          {
            name: 'Title Field',
            apiName: 'title',
            id: displayField,
            required: true,
            localized: true,
          },
          {
            name: 'Slug Field',
            apiName: slugFieldId,
            id: slugId,
            required: false,
          },
        ],
      },
    };
    defaultEditorControls = {
      controls: [
        {
          widgetId: 'slugEditor',
          id: slugId,
          fieldId: slugFieldId,
        },
      ],
    };
    getModule.mockClear();
  });

  it("should not break and add index to displayField if slugEditor field doesn't exist in contentType", async () => {
    const contentTypeFields = {
      data: {
        displayField,
        fields: [{ name: 'title', id: displayField, required: true, localized: true }],
      },
    };
    mockSpace(contentTypeFields);

    const data = {
      fields: {
        [displayField]: {
          'en-US': 'Hello!',
          de: 'Hallo!',
        },
      },
    };

    const [performer] = preparePerformer('Entry', makeEntry, data);

    await performer.duplicate();

    resultFields.forEach((fields) =>
      expect(fields).toEqual({
        [displayField]: {
          'en-US': 'Hello! (1)',
          de: 'Hallo! (1)',
        },
      })
    );
  });

  it("should not break and add index to title if slug exists in contentType, but it's value is undefined", async () => {
    mockSpace();

    const data = {
      fields: {
        [displayField]: {
          'en-US': 'Hello!',
          de: 'Hallo!',
        },
      },
    };

    const [performer] = preparePerformer('Entry', makeEntry, data);

    await performer.duplicate();

    resultFields.forEach((fields) =>
      expect(fields).toEqual({
        [displayField]: {
          'en-US': 'Hello! (1)',
          de: 'Hallo! (1)',
        },
      })
    );
  });

  it('should add the index to the entry title and slug of the duplicated entries', async () => {
    mockSpace();

    const data = {
      fields: {
        [displayField]: {
          'en-US': 'Hello!',
          de: 'Hallo!',
        },
        [slugId]: {
          'en-US': 'hello',
          de: 'hallo',
        },
      },
    };

    const [performer] = preparePerformer('Entry', makeEntry, data);

    await performer.duplicate();
    resultFields.forEach((fields) =>
      expect(fields).toEqual({
        [displayField]: {
          'en-US': 'Hello! (1)',
          de: 'Hallo! (1)',
        },
        [slugId]: {
          'en-US': 'hello-1',
          de: 'hallo-1',
        },
      })
    );
  });

  it('should increment the index of the entry title and slug of the duplicated entries', async () => {
    mockSpace();

    const data = {
      fields: {
        [displayField]: {
          'en-US': 'Hello! (1)',
          de: null,
        },
        [slugId]: {
          'en-US': 'hello-1',
          de: null,
        },
      },
    };

    const [performer] = preparePerformer('Entry', makeEntry, data);

    await performer.duplicate();

    resultFields.forEach((fields) =>
      expect(fields).toEqual({
        [displayField]: {
          'en-US': 'Hello! (2)',
          de: null,
        },
        [slugId]: {
          'en-US': 'hello-2',
          de: null,
        },
      })
    );
  });

  it("should set untitled slug if it is marked as required but it's value is null", async () => {
    mockSpace({
      data: {
        displayField: displayField,
        fields: [
          {
            name: 'title',
            id: displayField,
            required: true,
            localized: true,
          },
          {
            apiName: slugFieldId,
            name: 'Slug Field',
            id: slugId,
            required: true,
          },
        ],
      },
    });

    const data = {
      fields: {
        [displayField]: {
          'en-US': 'Hello! (1)',
          de: null,
        },
        [slugId]: {
          'en-US': 'hello-1',
          de: null,
        },
      },
    };

    const [performer] = preparePerformer('Entry', makeEntry, data);

    await performer.duplicate();

    resultFields.forEach((fields) => {
      expect(fields[displayField]).toEqual({
        'en-US': 'Hello! (2)',
        de: null,
      });
      expect(fields[slugId]['en-US']).toEqual('hello-2');
      // untitled slug based on the date of duplication
      expect(fields[slugId].de).not.toBeNull();
    });
  });

  it("should modify slug if it's not required and the value is null but title is defined for the same locale", async () => {
    mockSpace({
      data: {
        displayField: displayField,
        fields: [
          {
            name: 'title',
            id: displayField,
            required: true,
            localized: true,
          },
          {
            apiName: slugFieldId,
            name: 'Slug Field',
            id: slugId,
            required: false,
          },
        ],
      },
    });

    const data = {
      fields: {
        [displayField]: {
          'en-US': 'Hello! (1)',
          de: 'Hallo',
        },
        [slugId]: {
          'en-US': 'hello-1',
          de: null,
        },
      },
    };

    const [performer] = preparePerformer('Entry', makeEntry, data);

    await performer.duplicate();

    resultFields.forEach((fields) => {
      expect(fields).toEqual({
        [displayField]: {
          'en-US': 'Hello! (2)',
          de: 'Hallo (1)',
        },
        [slugId]: {
          'en-US': 'hello-2',
          de: 'hallo-1',
        },
      });
    });
  });

  it('should not break down if the entry title is not defined', async () => {
    mockSpace();

    const data = {
      fields: {
        [displayField]: null,
        [slugId]: null,
      },
    };

    const [performer] = preparePerformer('Entry', makeEntry, data);

    await performer.duplicate();

    resultFields.forEach((fields) =>
      expect(fields).toEqual({
        [displayField]: null,
        [slugId]: null,
      })
    );
  });

  it('should not increment the 0 index of the entry title and slug of the batch duplicated entries', async () => {
    mockSpace();

    const data = {
      fields: {
        [displayField]: {
          'en-US': 'Hello! (0)',
          de: 'Hallo! (0)',
        },
        [slugId]: {
          'en-US': 'hello-0',
          de: 'hallo-0',
        },
      },
    };

    const [performer] = preparePerformer('Entry', makeEntry, data);

    await performer.duplicate();

    resultFields.forEach((fields) =>
      expect(fields).toEqual({
        [displayField]: {
          'en-US': 'Hello! (0) (1)',
          de: 'Hallo! (0) (1)',
        },
        [slugId]: {
          'en-US': 'hello-0-1',
          de: 'hallo-0-1',
        },
      })
    );
  });

  it('should increment the multi-digit index of the entry title and slug of the duplicated entries', async () => {
    mockSpace();

    const data = {
      fields: {
        [displayField]: {
          'en-US': 'Hello! (10)',
          de: 'Hallo! (10)',
        },
        [slugId]: {
          'en-US': 'hello-10',
          de: 'hallo-10',
        },
      },
    };

    const [performer] = preparePerformer('Entry', makeEntry, data);

    await performer.duplicate();

    resultFields.forEach((fields) =>
      expect(fields).toEqual({
        [displayField]: {
          'en-US': 'Hello! (11)',
          de: 'Hallo! (11)',
        },
        [slugId]: {
          'en-US': 'hello-11',
          de: 'hallo-11',
        },
      })
    );
  });

  it("should align index of entry title and slug if it's different from title", async () => {
    mockSpace();

    const data = {
      fields: {
        [displayField]: {
          'en-US': 'Hello! (10)',
          de: 'Hallo! (10)',
        },
        [slugId]: {
          'en-US': 'hello-8',
          de: 'hallo-8',
        },
      },
    };

    const [performer] = preparePerformer('Entry', makeEntry, data);

    await performer.duplicate();

    resultFields.forEach((fields) =>
      expect(fields).toEqual({
        [displayField]: {
          'en-US': 'Hello! (11)',
          de: 'Hallo! (11)',
        },
        [slugId]: {
          'en-US': 'hello-11',
          de: 'hallo-11',
        },
      })
    );
  });

  it('should fall back to id if apiName doesnt match the slug fieldId', async () => {
    const customContentTypeFields = {
      data: {
        displayField: displayField,
        fields: [
          {
            name: 'title',
            id: displayField,
            required: true,
            localized: true,
          },
          {
            name: 'Slug Field',
            id: 'slug-id',
            required: false,
          },
        ],
      },
    };

    const customEditorControls = {
      controls: [
        {
          widgetId: 'slugEditor',
          id: slugId,
          fieldId: 'slug-id',
        },
      ],
    };

    await mockSpace(customContentTypeFields, customEditorControls);

    const data = {
      fields: {
        [displayField]: {
          'en-US': 'Hello!',
          de: 'Hallo!',
        },
        'slug-id': {
          'en-US': 'hello',
        },
      },
    };

    const [performer] = preparePerformer('Entry', makeEntry, data);

    await performer.duplicate();

    resultFields.forEach((fields) =>
      expect(fields).toEqual({
        [displayField]: {
          'en-US': 'Hello! (1)',
          de: 'Hallo! (1)',
        },
        'slug-id': {
          'en-US': 'hello-1',
        },
      })
    );
  });

  it('should sync slug for each locale in case of title being localized: false', async () => {
    const customContentTypeFields = {
      data: {
        displayField: displayField,
        fields: [
          {
            name: 'title',
            id: displayField,
            required: true,
            localized: false,
          },
          {
            name: 'Slug Field',
            id: slugId,
            required: false,
          },
        ],
      },
    };

    const customEditorControls = {
      controls: [
        {
          widgetId: 'slugEditor',
          id: slugId,
          fieldId: slugId,
        },
      ],
    };

    mockSpace(customContentTypeFields, customEditorControls);

    const data = {
      fields: {
        [displayField]: {
          'en-US': 'Hello!',
        },
        [slugId]: {
          'en-US': 'hello',
          de: 'hello',
        },
      },
    };

    const [performer] = preparePerformer('Entry', makeEntry, data);

    await performer.duplicate();

    resultFields.forEach((fields) =>
      expect(fields).toEqual({
        [displayField]: {
          'en-US': 'Hello! (1)',
        },
        [slugId]: {
          'en-US': 'hello-1',
          de: 'hello-1',
        },
      })
    );
  });
});
