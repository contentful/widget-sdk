import React from 'react';
import { render } from '@testing-library/react';
import UserProvisioning from './UserProvisioning';

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn().mockReturnValue(true)
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  getOrgFeature: jest.fn().mockResolvedValue(true)
}));

describe('UserProvisioning', () => {
  const organization = {
    name: 'My Org',
    sys: {
      id: 'org_1234'
    }
  };
  const props = {
    organization: organization,
    onReady: jest.fn()
  };

  const renderComponent = () => {
    return render(<UserProvisioning {...props} />);
  };

  it('should render scim setup page', async () => {
    const { getByTestId } = renderComponent();
    expect(props.onReady).toHaveBeenCalled();
    expect(getByTestId('scim-header').textContent).toBe('Set up user provisioning with SCIM 2.0');
  });
});
