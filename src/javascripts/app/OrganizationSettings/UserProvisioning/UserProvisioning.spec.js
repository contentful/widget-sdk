import React from 'react';
import { render, wait } from '@testing-library/react';
import UserProvisioning from './UserProvisioning';
import { getVariation } from '__mocks__/LaunchDarkly';
import { getOrgFeature } from 'data/CMA/ProductCatalog';

jest.mock('features/api-keys-management', () => ({
  TokenResourceManager: {
    createToken: jest.fn(),
  },
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  getOrgFeature: jest.fn().mockResolvedValue(true),
}));

const renderComponent = () => {
  const onReady = jest.fn();
  const component = <UserProvisioning orgId={'testOrgId'} onReady={onReady} />;
  return render(component);
};

describe('UserProvisioning', () => {
  it('should render forbidden flow if accessTools and scim feature not enabled', async () => {
    getOrgFeature.mockResolvedValue(false);
    getVariation.mockResolvedValue(false);
    const { getByText } = renderComponent();
    await wait();
    expect(getByText('Access forbidden (403)')).toBeInTheDocument();
  });
});
