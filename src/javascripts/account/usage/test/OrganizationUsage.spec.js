import React from 'react';
import { shallow } from 'enzyme';

import { OrganizationUsage } from '../OrganizationUsage.es6';

let defaultProps = null;
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
          default: () => ({
            get: jest
              .fn()
              .mockReturnValueOnce({ limits: { included: 1000000 } })
              .mockReturnValueOnce({
                usage: 200,
                unitOfMeasure: 'MB',
                limits: { included: 2000 }
              }),
            getAll: jest.fn()
          })
        },
        ReloadNotification: { trigger: jest.fn() },
        OrganizationMembershipRepository: { getAllSpaces: jest.fn() },
        EndpointFactory: { createOrganizationEndpoint: jest.fn() },
        Analytics: { track: jest.fn() },
        LaunchDarkly: { getCurrentVariation: jest.fn() },
        TokenStore: { getOrganization: jest.fn() }
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

      expect(defaultProps.onForbidden).toHaveBeenCalledWith(new Error('No permission'));
    });
  });
});
