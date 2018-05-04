import React from 'react';
import { mount } from 'enzyme';

describe('FetchSpacePlans', function () {
  beforeEach(function () {
    this.organization = {
      sys: {
        id: '1234'
      }
    };

    this.freeSpaceResource = {
      usage: 1,
      limits: {
        included: 2,
        maximum: 2
      },
      sys: {
        id: 'free_space',
        type: 'OrganizationResource'
      }
    };

    this.stubs = {
      getSpaceRatePlans: sinon.stub().resolves([]),
      getSpaceRatePlansForSpace: sinon.stub().resolves([]),
      createResourceService_get: sinon.stub().resolves(this.freeSpaceResource)
    };

    module('contentful/test', ($provide) => {
      $provide.value('account/pricing/PricingDataProvider', {
        getSpaceRatePlans: this.stubs.getSpaceRatePlans,
        getSpaceRatePlansForSpace: this.stubs.getSpaceRatePlansForSpace
      });

      $provide.value('services/ResourceService', {
        default: () => {
          return {
            get: this.stubs.createResourceService_get
          };
        }
      });
    });

    this.FetchSpacePlans = this.$inject('components/shared/space-wizard/FetchSpacePlans').default;
    this.renderChild = sinon.stub().returns(null);

    this.mount = (action) => {
      this.component = mount(
        <this.FetchSpacePlans
          organization={this.organization}
          action={action}
        >
          {this.renderChild}
        </this.FetchSpacePlans>
      );
    };
  });

  describe('create', function () {
    beforeEach(function () {
      this.mount('create');
    });

    it('should request all space rate plans', function () {
      expect(this.stubs.getSpaceRatePlans.called).toBe(true);
      expect(this.stubs.getSpaceRatePlansForSpace.called).toBe(false);
    });

    it('should initially call the render child with a pending request state', function () {
      expect(this.renderChild.calledWith({
        requestState: 'pending',
        error: null,
        spaceRatePlans: [],
        freeSpacesResource: {
          limits: {}
        }
      })).toBe(true);
    });

    it('should call the render child with data and a successful request state on success', async function () {
      await this.stubs.getSpaceRatePlans();
      await this.stubs.createResourceService_get();

      expect(this.renderChild.calledWith({
        requestState: 'success',
        error: null,
        spaceRatePlans: [],
        freeSpacesResource: {
          usage: 1,
          limits: {
            included: 2,
            maximum: 2
          },
          sys: {
            id: 'free_space',
            type: 'OrganizationResource'
          }
        }
      })).toBe(true);
    });

    it('should call the render child with an errorful request state on error', async function () {
      const error = new Error('Could not get space rate plans');

      this.stubs.getSpaceRatePlans.rejects(error);

      // Remount with new stub
      this.mount('create');

      try {
        await this.stubs.getSpaceRatePlans();
      } catch (e) {
        // Ignore error
      }

      await this.stubs.createResourceService_get();

      expect(this.renderChild.calledWith({
        error: error,
        spaceRatePlans: [],
        freeSpacesResource: {
          limits: {}
        },
        requestState: 'error'
      })).toBe(true);
    });
  });

  describe('change', function () {
    beforeEach(function () {
      this.mount('change');
    });

    it('should request space rate plans for given space', function () {
      expect(this.stubs.getSpaceRatePlansForSpace.called).toBe(true);
      expect(this.stubs.getSpaceRatePlans.called).toBe(false);
    });

    it('should initially call the render child with a pending request state', function () {
      expect(this.renderChild.calledWith({
        requestState: 'pending',
        error: null,
        spaceRatePlans: [],
        freeSpacesResource: {
          limits: {}
        }
      })).toBe(true);
    });

    it('should call the render child with data and a successful request state on success', async function () {
      await this.stubs.getSpaceRatePlansForSpace();
      await this.stubs.createResourceService_get();

      expect(this.renderChild.calledWith({
        requestState: 'success',
        error: null,
        spaceRatePlans: [],
        freeSpacesResource: {
          usage: 1,
          limits: {
            included: 2,
            maximum: 2
          },
          sys: {
            id: 'free_space',
            type: 'OrganizationResource'
          }
        }
      })).toBe(true);
    });

    it('should call the render child with an errorful request state on error', async function () {
      const error = new Error('Could not get space rate plans for space');

      this.stubs.getSpaceRatePlansForSpace.rejects(error);

      // Remount with new stub
      this.mount('change');

      try {
        await this.stubs.getSpaceRatePlansForSpace();
      } catch (e) {
        // Ignore error
      }

      await this.stubs.createResourceService_get();

      expect(this.renderChild.calledWith({
        error: error,
        spaceRatePlans: [],
        freeSpacesResource: {
          limits: {}
        },
        requestState: 'error'
      })).toBe(true);
    });
  });
});
