import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import UserProvisioning from './UserProvisioning';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import * as fake from 'test/helpers/fakeFactory';

const mockOrganization = fake.Organization();
const onReady = jest.fn();

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn().mockReturnValue(true),
}));

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(async () => mockOrganization),
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  getOrgFeature: jest.fn().mockResolvedValue(true),
}));

const renderComponent = () => {
  render(<UserProvisioning orgId={mockOrganization.sys.id} onReady={onReady} />);
  return waitFor(() => expect(isOwnerOrAdmin).toHaveBeenCalled());
};

describe('UserProvisioning', () => {
  it('should render page if scim feature enabled', async () => {
    await renderComponent();
    expect(screen.getByTestId('generate-btn')).toBeInTheDocument();
  });

  it('should render upsell page if scim feature not enabled', async () => {
    getOrgFeature.mockResolvedValue(false);
    await renderComponent();
    expect(screen.getByTestId('get-in-touch-btn')).toBeInTheDocument();
  });
});
