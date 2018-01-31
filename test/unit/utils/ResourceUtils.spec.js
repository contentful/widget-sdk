import { canCreate, generateMessage, getResourceLimits } from 'utils/ResourceUtils';

describe('ResourceUtils', function () {
  beforeEach(function () {
    function createResource (type, limits, usage) {
      const { maximum, included } = limits;

      return {
        name: type,
        kind: 'permanent',
        usage,
        limits: {
          included,
          maximum
        },
        sys: {
          id: type,
          type: 'SpaceResource'
        }
      };
    }

    this.resources = {
      entries: {
        notReachedAnyLimit: createResource('entries', { maximum: 10, included: 5 }, 2),
        reachedIncludedLimit: createResource('entries', { maximum: 10, included: 5 }, 7),
        reachedMaxLimit: createResource('entries', { maximum: 10, included: 5 }, 10)
      },
      apiKeys: {
        notReachedAnyLimit: createResource('api_keys', { maximum: 100, included: 50 }, 20),
        reachedIncludedLimit: createResource('api_keys', { maximum: 100, included: 50 }, 70),
        reachedMaxLimit: createResource('api_keys', { maximum: 100, included: 50 }, 100)
      }
    };
  });

  describe('#canCreate', function () {
    it('should return true if the maximum limit is not reached', function () {
      expect(canCreate(this.resources.entries.notReachedAnyLimit)).toBe(true);
      expect(canCreate(this.resources.entries.reachedIncludedLimit)).toBe(true);
    });

    it('should return false if the maximum limit is reached', function () {
      expect(canCreate(this.resources.entries.reachedMaxLimit)).toBe(false);
    });
  });

  describe('#generateMessage', function () {
    it('should always return an object with warning and error keys when given a resource', function () {
      Object.keys(this.resources.entries).forEach(i => {
        const resource = this.resources.entries[i];
        const message = generateMessage(resource);

        expect(message.warning).toBeDefined();
        expect(message.error).toBeDefined();
      });
    });

    it('should return no warning or error if you have not reached any limit', function () {
      const message = generateMessage(this.resources.entries.notReachedAnyLimit);

      expect(message.warning).toBe('');
      expect(message.error).toBe('');
    });

    it('should return a warning about nearing your limit if the included limit is reached', function () {
      const message = generateMessage(this.resources.entries.reachedIncludedLimit);

      expect(message.warning).toBe('You are near the limit of your Entries usage.');
      expect(message.error).toBe('');
    });

    it('should return an error if you reach your maximum limit', function () {
      const message = generateMessage(this.resources.entries.reachedMaxLimit);

      expect(message.warning).toBe('');
      expect(message.error).toBe('You have exceeded your Entries usage.');
    });

    it('should provide a human readable warning or error for a name with spaces', function () {
      let message;

      message = generateMessage(this.resources.apiKeys.reachedIncludedLimit);

      expect(message.warning).toBe('You are near the limit of your API Keys usage.');
      expect(message.error).toBe('');

      message = generateMessage(this.resources.apiKeys.reachedMaxLimit);

      expect(message.warning).toBe('');
      expect(message.error).toBe('You have exceeded your API Keys usage.');
    });
  });

  describe('#getResourceLimits', function () {
    it('returns an object with the included and maximum limits given a resource', function () {
      const limits = getResourceLimits(this.resources.entries.notReachedAnyLimit);

      expect(limits.included).toBeDefined();
      expect(limits.maximum).toBeDefined();
    });

    it('returns the included and maximum limits from the resource', function () {
      const limits = getResourceLimits(this.resources.entries.reachedIncludedLimit);

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
            maximum: 1000
          }
        },
        sys: {
          id: 'entries',
          type: 'SpaceResource'
        }
      };

      const limits = getResourceLimits(resource);

      expect(limits.included).toBe(500);
      expect(limits.maximum).toBe(1000);
    });
  });
});
