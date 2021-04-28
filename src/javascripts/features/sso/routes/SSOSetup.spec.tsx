import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { SSOSetup } from 'features/sso';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import * as fake from 'test/helpers/fakeFactory';

const mockOrganization = fake.Organization();

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn().mockReturnValue(true),
}));

jest.mock('core/utils/getCurrentOrg', () => ({
  getCurrentOrg: jest.fn(async () => mockOrganization),
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  ...(jest.requireActual('data/CMA/ProductCatalog') as any),
  getOrgFeature: jest.fn().mockResolvedValue(true),
}));

const renderComponent = () => {
  render(<SSOSetup />);
  return waitFor(() => expect(isOwnerOrAdmin).toHaveBeenCalled());
};

describe('SSOSetup', () => {
  it('should render page if sso feature enabled', async () => {
    await renderComponent();
    expect(screen.getByTestId('create-idp')).toBeInTheDocument();
  });

  it('should render upsell page if sso feature not enabled', async () => {
    (getOrgFeature as jest.Mock).mockResolvedValue(false);
    await renderComponent();
    expect(screen.getByTestId('get-in-touch-btn')).toBeInTheDocument();
  });
});
