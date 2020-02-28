import React from 'react';
import { render, wait } from '@testing-library/react';

import { getOrganization } from 'services/TokenStore';
import { getOrgFeature } from 'data/CMA/ProductCatalog';

import NewUserRoute from './NewUserRoute';

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn()
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  getOrgFeature: jest.fn()
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn().mockReturnValue(true)
}));

describe('NewUserRoute', () => {
  const build = custom => {
    const props = Object.assign(
      {
        orgId: 'org_1234'
      },
      custom
    );

    return render(<NewUserRoute {...props} />);
  };

  it('requests the organization and teams org feature', async () => {
    build();

    await wait();

    expect(getOrganization).toBeCalledWith('org_1234');
    expect(getOrgFeature).toBeCalledWith('org_1234', 'teams');
  });

  it('shows the error page if any of the requests err', async () => {
    getOrganization.mockRejectedValueOnce(new Error('Unknown organization'));

    const { queryByTestId } = build();

    await wait();

    expect(queryByTestId('cf-ui-error-state')).toBeVisible();
  });

  it('shows the loading state while the requests are pending', async () => {
    const { queryByTestId } = build();

    expect(queryByTestId('cf-ui-loading-state')).toBeVisible();

    await wait();

    expect(queryByTestId('cf-ui-loading-state')).toBeNull();
  });

  it('shows the NewUser invitation form when requests finish and are successful', async () => {
    getOrganization.mockResolvedValueOnce({
      hasSsoFeature: true
    });

    const { queryByTestId } = build();

    await wait();

    expect(queryByTestId('new-user-invitation-form')).toBeVisible();
  });
});
