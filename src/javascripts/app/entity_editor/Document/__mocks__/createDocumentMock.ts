import noop from 'lodash/noop';
import { createEntityRepo, createCmaDoc, Document } from '@contentful/editorial-primitives';

const defaultCtFields = [{ id: 'test' }, { id: 'title' }];
const defaultLocales = [{ internal_code: 'en-US' }, { internal_code: 'de' }];

export const createDocumentMock = () => {
  return {
    create(
      initialData,
      _spaceEndpoint = {},
      applyAction = noop,
      ctFields = defaultCtFields,
      locales = defaultLocales
    ): Document {
      const pubSubClient = { on: jest.fn() };
      const entityRepo = createEntityRepo({
        // @ts-expect-error mock
        applyAction,
        // @ts-expect-error mock
        cmaClient: jest.fn(),
        // @ts-expect-error mock
        pubSubClient,
        // @ts-expect-error mock
        environment: { sys: { id: 'env' } },
        triggerCmaAutoSave: noop,
      });
      const permissions = {
        can: jest.fn().mockReturnValue(true),
        canEditFieldLocale: jest.fn().mockReturnValue(true),
      };

      const contentType = { sys: { id: 'testCT' }, fields: ctFields };
      if (!initialData.fields) {
        initialData.fields = {
          test: { 'en-US': 'value' },
        };
      }

      const doc = createCmaDoc({
        initialEntity: { data: initialData },
        getLocales: () => locales,
        entityRepo,
        createPermissions: () => permissions,
        // @ts-expect-error mock
        contentType,
      });

      return doc;
    },
  };
};
