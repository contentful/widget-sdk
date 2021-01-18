import { makeLink, PublishableEntity } from '@contentful/types';
import { getUpdatedSelectedEntities, ReferencesResponse } from './BulkActionUtils';
import '@testing-library/jest-dom/extend-expect';

const defaultSys = {
  publishedCounter: 0,
  updatedAt: new Date().toISOString(),
  updatedBy: makeLink('User', 'user-id'),
  environment: makeLink('Environment', 'master'),
  type: 'Entry',
  space: makeLink('Space', 'default-space'),
};

describe('BulkActionUtils', () => {
  describe('.getUpdatedEntities', () => {
    const originalRootEntry = {
      sys: {
        id: 'entry-1',
        version: 1,
        ...defaultSys,
      },
    };

    const selectedEntities: PublishableEntity[] = [
      originalRootEntry,
      {
        sys: {
          ...defaultSys,
          id: 'entry-2',
          version: 1,
        },
      },
      {
        sys: {
          ...defaultSys,
          id: 'entry-3',
          version: 3,
          publishedCounter: 2,
        },
      },
    ];

    const entry2WithUpdatedVersion: PublishableEntity = {
      sys: {
        ...defaultSys,
        id: 'entry-2',
        version: 2,
        publishedCounter: 1,
      },
    };

    const entry3WithUpdatedVersion: PublishableEntity = {
      sys: {
        ...defaultSys,
        id: 'entry-3',
        version: 4,
        publishedCounter: 3,
      },
    };

    const referencesResponse: ReferencesResponse = {
      items: [originalRootEntry],
      includes: {
        Entry: [entry2WithUpdatedVersion, entry3WithUpdatedVersion],
        Asset: [],
      },
    };

    it('should return a list of entities with their updated versions', () => {
      const result = getUpdatedSelectedEntities(selectedEntities, referencesResponse);

      expect(result).toHaveLength(selectedEntities.length);

      expect(result).toContain(originalRootEntry);
      expect(result).toContain(entry2WithUpdatedVersion);
      expect(result).toContain(entry3WithUpdatedVersion);
    });
  });
});
