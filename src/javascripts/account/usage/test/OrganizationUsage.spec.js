import React from 'react';
import { shallow } from 'enzyme';

import { OrganizationUsage } from '../OrganizationUsage.es6';

let defaultProps = null;
let testOrg = null;
const shallowRenderComponent = async props => {
  const wrapper = shallow(<OrganizationUsage {...props} />);
  // Need to wait for internal async logic to finish
  // This means `componentDidMount` is called twice,
  //  which could potentially cause problems if it's not
  //  idempotent.
  await wrapper.instance().componentDidMount();
  return wrapper;
};

describe('OrganizationUsage', () => {
  beforeEach(() => {
    testOrg = {};
    defaultProps = {
      orgId: '23423',
      onReady: jest.fn(),
      onForbidden: jest.fn(),
      $services: {
        OrganizationRoles: { isOwnerOrAdmin: jest.fn(() => true) },
        PricingDataProvider: {
          isEnterprisePlan: jest.fn(() => true),
          getBasePlan: jest.fn(),
          getPlansWithSpaces: jest.fn()
        },
        ResourceService: {
          default: jest.fn(() => ({
            get: jest
              .fn()
              .mockReturnValueOnce({ limits: { included: 1000000 } })
              .mockReturnValueOnce({
                usage: 200,
                unitOfMeasure: 'MB',
                limits: { included: 2000 }
              }),
            getAll: jest.fn()
          }))
        },
        ReloadNotification: { trigger: jest.fn() },
        OrganizationMembershipRepository: { getAllSpaces: jest.fn() },
        EndpointFactory: { createOrganizationEndpoint: jest.fn() },
        Analytics: { track: jest.fn() },
        LaunchDarkly: { getCurrentVariation: jest.fn() },
        TokenStore: { getOrganization: jest.fn(() => testOrg) }
      }
    };
  });

  it('should render page without errors', async () => {
    await shallowRenderComponent(defaultProps);
  });

  it('should call `onReady`', async () => {
    await shallowRenderComponent(defaultProps);

    expect(defaultProps.onReady).toHaveBeenCalled();
  });

  describe('user is not owner or admin', () => {
    beforeEach(() => {
      defaultProps.$services.OrganizationRoles.isOwnerOrAdmin.mockReturnValue(false);
    });

    it('should call `onForbidden`', async () => {
      await shallowRenderComponent(defaultProps);

      expect(defaultProps.$services.TokenStore.getOrganization).toHaveBeenCalledWith(
        defaultProps.orgId
      );
      expect(defaultProps.$services.OrganizationRoles.isOwnerOrAdmin).toHaveBeenCalledWith(testOrg);
      expect(defaultProps.onForbidden).toHaveBeenCalledWith(new Error('No permission'));
    });
  });

  describe('fetching org data fails with 404', () => {
    const error404 = new Error('Test error');
    error404.status = 404;

    beforeEach(() => {
      defaultProps.$services.ResourceService.default.mockImplementation(
        jest.fn(() => ({
          getAll: () => Promise.reject(error404)
        }))
      );
    });

    it('should call `onForbidden`', async () => {
      await shallowRenderComponent(defaultProps);

      expect(defaultProps.onForbidden).toHaveBeenCalledWith(error404);
    });
  });

  describe('fetching org data fails with 403', () => {
    const error403 = new Error('Test error');
    error403.status = 403;

    beforeEach(() => {
      defaultProps.$services.ResourceService.default.mockImplementation(
        jest.fn(() => ({
          getAll: () => Promise.reject(error403)
        }))
      );
    });

    it('should call `onForbidden`', async () => {
      await shallowRenderComponent(defaultProps);

      expect(defaultProps.onForbidden).toHaveBeenCalledWith(error403);
    });
  });

  describe('fetching org data fails with 400', () => {
    const error400 = new Error('Test error');
    error400.status = 400;

    beforeEach(() => {
      defaultProps.$services.ResourceService.default.mockImplementation(
        jest.fn(() => ({
          getAll: () => Promise.reject(error400)
        }))
      );
    });

    it('should trigger reload notification', async () => {
      await shallowRenderComponent(defaultProps);

      expect(defaultProps.onForbidden).not.toHaveBeenCalled();
      expect(defaultProps.$services.ReloadNotification.trigger).toHaveBeenCalled();
    });
  });
});
