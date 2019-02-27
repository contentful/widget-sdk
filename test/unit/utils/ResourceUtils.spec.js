describe('ResourceUtils', () => {
  beforeEach(function() {
    function createResource(type, limits, usage) {
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
        notReachedAnyLimit: createResource('entry', { maximum: 10, included: 5 }, 2),
        reachedIncludedLimit: createResource('entry', { maximum: 10, included: 5 }, 7),
        reachedMaxLimit: createResource('entry', { maximum: 10, included: 5 }, 10),
        overMaxLimit: createResource('entry', { maximum: 10, included: 5 }, 15)
      },
      contentTypes: {
        notReachedAnyLimit: createResource('content_type', { maximum: 20, included: 10 }, 2),
        reachedIncludedLimit: createResource('content_type', { maximum: 20, included: 10 }, 15),
        reachedMaxLimit: createResource('content_type', { maximum: 20, included: 10 }, 20),
        overMaxLimit: createResource('content_type', { maximum: 20, included: 10 }, 25)
      },
      apiKeys: createResource('locale', { maximum: null, included: null }, 2)
    };

    this.storeResources = {
      space_1234: {
        record: {
          isPending: false,
          resource: createResource('record', { maximum: 10, included: 5 }, 2)
        }
      }
    };

    this.pricingVersions = {
      pricingVersion1: 'pricing_version_1',
      pricingVersion2: 'pricing_version_2'
    };

    this.organization = {
      subscriptionPlan: {
        limits: {
          permanent: {},
          period: {}
        }
      },
      usage: {
        permanent: {},
        period: {}
      },
      pricingVersion: this.pricingVersions.pricingVersion2
    };

    module('contentful/test');

    this.ResourceUtils = this.$inject('utils/ResourceUtils.es6');
  });

  describe('#canCreate', () => {
    it('should return true if the maximum limit is not reached', function() {
      expect(this.ResourceUtils.canCreate(this.resources.entries.notReachedAnyLimit)).toBe(true);
      expect(this.ResourceUtils.canCreate(this.resources.entries.reachedIncludedLimit)).toBe(true);
    });

    it('should return false if the maximum limit is reached', function() {
      expect(this.ResourceUtils.canCreate(this.resources.entries.reachedMaxLimit)).toBe(false);
    });

    it('should return false if you go over the max limit', function() {
      expect(this.ResourceUtils.canCreate(this.resources.entries.overMaxLimit)).toBe(false);
    });

    it('should return true if you inquire about a resource without a max limit', function() {
      expect(this.ResourceUtils.canCreate(this.resources.apiKeys)).toBe(true);
    });
  });

  describe('#generateMessage', () => {
    it('should always return an object with warning and error keys when given a resource', function() {
      Object.keys(this.resources.entries).forEach(i => {
        const resource = this.resources.entries[i];
        const message = this.ResourceUtils.generateMessage(resource);

        expect(message.warning).toBeDefined();
        expect(message.error).toBeDefined();
      });

      const message = this.ResourceUtils.generateMessage(this.resources.apiKeys);
      expect(message.warning).toBeDefined();
      expect(message.error).toBeDefined();
    });

    it('should return no warning or error if you have not reached any limit', function() {
      const message = this.ResourceUtils.generateMessage(this.resources.entries.notReachedAnyLimit);

      expect(message.warning).toBe('');
      expect(message.error).toBe('');
    });

    it('should return a warning about nearing your limit if the included limit is reached', function() {
      const message = this.ResourceUtils.generateMessage(
        this.resources.entries.reachedIncludedLimit
      );

      expect(message.warning).toBe('You are near the limit of your Entries usage.');
      expect(message.error).toBe('');
    });

    it('should return an error if you reach your maximum limit', function() {
      const message = this.ResourceUtils.generateMessage(this.resources.entries.reachedMaxLimit);

      expect(message.warning).toBe('');
      expect(message.error).toBe('You have exceeded your Entries usage.');
    });

    it('should return an error if you, somehow, go over your maximum limit', function() {
      const message = this.ResourceUtils.generateMessage(this.resources.entries.overMaxLimit);

      expect(message.warning).toBe('');
      expect(message.error).toBe('You have exceeded your Entries usage.');
    });

    it('should provide a human readable warning or error for a name with spaces', function() {
      let message;

      message = this.ResourceUtils.generateMessage(
        this.resources.contentTypes.reachedIncludedLimit
      );

      expect(message.warning).toBe('You are near the limit of your Content Types usage.');
      expect(message.error).toBe('');

      message = this.ResourceUtils.generateMessage(this.resources.contentTypes.reachedMaxLimit);

      expect(message.warning).toBe('');
      expect(message.error).toBe('You have exceeded your Content Types usage.');
    });
  });

  describe('#getResourceLimits', () => {
    it('returns an object with the included and maximum limits given a resource', function() {
      const limits = this.ResourceUtils.getResourceLimits(
        this.resources.entries.notReachedAnyLimit
      );

      expect(limits.included).toBeDefined();
      expect(limits.maximum).toBeDefined();
    });

    it('returns the included and maximum limits from the resource', function() {
      const limits = this.ResourceUtils.getResourceLimits(
        this.resources.entries.reachedIncludedLimit
      );

      expect(limits.included).toBe(5);
      expect(limits.maximum).toBe(10);
    });

    it('returns the parent limits if the child limits are not defined', function() {
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

      const limits = this.ResourceUtils.getResourceLimits(resource);

      expect(limits.included).toBe(500);
      expect(limits.maximum).toBe(1000);
    });

    it('returns a limits object even given a resource with a null limits key', function() {
      const resource = {
        name: 'Foo Resource',
        kind: 'permanent',
        usage: 7,
        limits: null
      };

      const limits = this.ResourceUtils.getResourceLimits(resource);
      expect(limits.included).toBe(null);
      expect(limits.maximum).toBe(null);
    });
  });

  describe('#useLegacy', () => {
    it('should return false if given a pricing V2 organization', async function() {
      expect(await this.ResourceUtils.useLegacy(this.organization)).toBe(false);
    });

    it('should return true if given a pricing V1 organization', async function() {
      this.organization.pricingVersion = this.pricingVersions.pricingVersion1;
      expect(await this.ResourceUtils.useLegacy(this.organization)).toBe(true);
    });
  });

  describe('#isLegacyOrganization', () => {
    it('should return true if the organization uses pricing version 1', function() {
      const organization = {
        pricingVersion: 'pricing_version_1',
        sys: {
          id: 'legacy_org'
        }
      };

      expect(this.ResourceUtils.isLegacyOrganization(organization)).toBe(true);
    });

    it('should return false if the organization uses pricing version 2', function() {
      const organization = {
        pricingVersion: 'pricing_version_2',
        sys: {
          id: 'legacy_org'
        }
      };

      expect(this.ResourceUtils.isLegacyOrganization(organization)).toBe(false);
    });
  });

  describe('#getStoreResource', function() {
    it('should return the store resource object if it exists', function() {
      expect(
        this.ResourceUtils.getStoreResource(this.storeResources, 'space_1234', 'record')
      ).toEqual(this.storeResources.space_1234.record);
    });

    it('should return null if the resource does not exist for the space', function() {
      expect(
        this.ResourceUtils.getStoreResource(this.storeResources, 'space_1234', 'content_type')
      ).toBe(null);
    });

    it('should return null if the space does not have any resources in the store', function() {
      expect(this.ResourceUtils.getStoreResource(this.storeResources, 'space_5678', 'record')).toBe(
        null
      );
    });
  });
});
