import * as ResourceUtils from './ResourceUtils';

describe('ResourceUtils', () => {
  let resources;
  let multipleResources;
  let storeResources;

  beforeEach(async function () {
    function createResource(type, limits, usage) {
      const { maximum, included } = limits;

      return {
        name: type,
        kind: 'permanent',
        usage,
        limits: {
          included,
          maximum,
        },
        sys: {
          id: type,
          type: 'SpaceResource',
        },
      };
    }

    resources = {
      entries: {
        notReachedAnyLimit: createResource('entry', { maximum: 10, included: 5 }, 2),
        reachedIncludedLimit: createResource('entry', { maximum: 10, included: 5 }, 7),
        reachedMaxLimit: createResource('entry', { maximum: 10, included: 5 }, 10),
        overMaxLimit: createResource('entry', { maximum: 10, included: 5 }, 15),
      },
      contentTypes: {
        notReachedAnyLimit: createResource('content_type', { maximum: 20, included: 10 }, 2),
        reachedIncludedLimit: createResource('content_type', { maximum: 20, included: 10 }, 15),
        reachedMaxLimit: createResource('content_type', { maximum: 20, included: 10 }, 20),
        overMaxLimit: createResource('content_type', { maximum: 20, included: 10 }, 25),
      },
      assets: {
        reachedMaxLimit: createResource('asset', { maximum: 10, included: 5 }, 10),
      },
      record: {
        reachedMaxLimit: createResource('record', { maximum: 10, included: 5 }, 10),
      },
      apiKeys: createResource('locale', { maximum: null, included: null }, 2),
    };

    multipleResources = [
      resources.entries.notReachedAnyLimit,
      resources.assets.reachedMaxLimit,
      resources.contentTypes.notReachedAnyLimit,
      resources.record.reachedMaxLimit,
    ];

    storeResources = {
      space_1234: {
        record: {
          isPending: false,
          resource: createResource('record', { maximum: 10, included: 5 }, 2),
        },
      },
    };
  });

  describe('#getEnvironmentResources', () => {
    it('should only return environment resources', () => {
      const envResourceFirst = { sys: { id: ResourceUtils.environmentResources[0] } };
      const envResourceSecond = { sys: { id: ResourceUtils.environmentResources[1] } };
      const result = ResourceUtils.getEnvironmentResources([
        { sys: { id: 'not_env_resource' } },
        envResourceFirst,
        envResourceSecond,
      ]);
      expect(result[0]).toEqual(envResourceFirst);
      expect(result[1]).toEqual(envResourceSecond);
    });
  });

  describe('#canCreate', () => {
    it('should return true if the maximum limit is not reached', function () {
      expect(ResourceUtils.canCreate(resources.entries.notReachedAnyLimit)).toBe(true);
      expect(ResourceUtils.canCreate(resources.entries.reachedIncludedLimit)).toBe(true);
    });

    it('should return false if the maximum limit is reached', function () {
      expect(ResourceUtils.canCreate(resources.entries.reachedMaxLimit)).toBe(false);
    });

    it('should return false if you go over the max limit', function () {
      expect(ResourceUtils.canCreate(resources.entries.overMaxLimit)).toBe(false);
    });

    it('should return true if you inquire about a resource without a max limit', function () {
      expect(ResourceUtils.canCreate(resources.apiKeys)).toBe(true);
    });
  });

  describe('#canCreateResources', () => {
    it('should return an object with appropriate entity type and boolean value', function () {
      expect(ResourceUtils.canCreateResources(multipleResources)).toEqual({
        Entry: false,
        ContentType: true,
        Asset: false,
        Record: false,
      });
    });
  });

  describe('#generateMessage', () => {
    it('should always return an object with warning and error keys when given a resource', function () {
      Object.keys(resources.entries).forEach((i) => {
        const resource = resources.entries[i];
        const message = ResourceUtils.generateMessage(resource);

        expect(message.warning).toBeDefined();
        expect(message.error).toBeDefined();
      });

      const message = ResourceUtils.generateMessage(resources.apiKeys);
      expect(message.warning).toBeDefined();
      expect(message.error).toBeDefined();
    });

    it('should return no warning or error if you have not reached any limit', function () {
      const message = ResourceUtils.generateMessage(resources.entries.notReachedAnyLimit);

      expect(message.warning).toBe('');
      expect(message.error).toBe('');
    });

    it('should return a warning about nearing your limit if the included limit is reached', function () {
      const message = ResourceUtils.generateMessage(resources.entries.reachedIncludedLimit);

      expect(message.warning).toBe('You are near the limit of your Entries usage.');
      expect(message.error).toBe('');
    });

    it('should return an error if you reach your maximum limit', function () {
      const message = ResourceUtils.generateMessage(resources.entries.reachedMaxLimit);

      expect(message.warning).toBe('');
      expect(message.error).toBe('You have exceeded your Entries usage.');
    });

    it('should return an error if you, somehow, go over your maximum limit', function () {
      const message = ResourceUtils.generateMessage(resources.entries.overMaxLimit);

      expect(message.warning).toBe('');
      expect(message.error).toBe('You have exceeded your Entries usage.');
    });

    it('should provide a human readable warning or error for a name with spaces', function () {
      let message;

      message = ResourceUtils.generateMessage(resources.contentTypes.reachedIncludedLimit);

      expect(message.warning).toBe('You are near the limit of your Content Types usage.');
      expect(message.error).toBe('');

      message = ResourceUtils.generateMessage(resources.contentTypes.reachedMaxLimit);

      expect(message.warning).toBe('');
      expect(message.error).toBe('You have exceeded your Content Types usage.');
    });
  });

  describe('#getResourceLimits', () => {
    it('returns an object with the included and maximum limits given a resource', function () {
      const limits = ResourceUtils.getResourceLimits(resources.entries.notReachedAnyLimit);

      expect(limits.included).toBeDefined();
      expect(limits.maximum).toBeDefined();
    });

    it('returns the included and maximum limits from the resource', function () {
      const limits = ResourceUtils.getResourceLimits(resources.entries.reachedIncludedLimit);

      expect(limits.included).toBe(5);
      expect(limits.maximum).toBe(10);
    });

    it('returns the parent limits if the child limits are not defined', function () {
      const resource = {
        name: 'Entries',
        kind: 'permanent',
        usage: 6,
        limits: null,
        parent: {
          name: 'Records',
          kind: 'permanent',
          usage: 20,
          limits: {
            included: 500,
            maximum: 1000,
          },
        },
        sys: {
          id: 'entries',
          type: 'SpaceResource',
        },
      };

      const limits = ResourceUtils.getResourceLimits(resource);

      expect(limits.included).toBe(500);
      expect(limits.maximum).toBe(1000);
    });

    it('returns the accumulated limit of a resource', function () {
      const withParent = {
        usage: 0,
        parent: {
          usage: 100,
        },
        sys: {
          id: 'role',
        },
      };
      const withoutParent = {
        usage: 0,
      };

      expect(ResourceUtils.getAccumulatedUsage(withParent)).toBe(100);
      expect(ResourceUtils.getAccumulatedUsage(withoutParent)).toBe(0);
    });

    it('returns a limits object even given a resource with a null limits key', function () {
      const resource = {
        name: 'Foo Resource',
        kind: 'permanent',
        usage: 7,
        limits: null,
      };

      const limits = ResourceUtils.getResourceLimits(resource);
      expect(limits.included).toBeNull();
      expect(limits.maximum).toBeNull();
    });
  });

  describe('#getStoreResource', function () {
    it('should return the store resource object if it exists', function () {
      expect(ResourceUtils.getStoreResource(storeResources, 'space_1234', 'record')).toEqual(
        storeResources.space_1234.record
      );
    });

    it('should return null if the resource does not exist for the space', function () {
      expect(
        ResourceUtils.getStoreResource(storeResources, 'space_1234', 'content_type')
      ).toBeNull();
    });

    it('should return null if the space does not have any resources in the store', function () {
      expect(ResourceUtils.getStoreResource(storeResources, 'space_5678', 'record')).toBeNull();
    });
  });
});
