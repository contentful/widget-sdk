import React from 'react';
import { render } from '@testing-library/react';
import UserProvisioning from './UserProvisioning';

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn().mockReturnValue(true)
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  getOrgFeature: jest.fn().mockResolvedValue(false)
}));

const renderComponent = props => {
  const component = <UserProvisioning {...props} />;
  return render(component);
};

describe('UserProvisioning', () => {
  const props = { orgId: 'org_1234', onReady: jest.fn() };

  it('should render scim setup page', async () => {
    renderComponent(props);
    expect(props.onReady).toHaveBeenCalled();
    // expect(getByTestId('scim-header').textContent).toBe('Set up user provisioning with SCIM 2.0');
  });
});
