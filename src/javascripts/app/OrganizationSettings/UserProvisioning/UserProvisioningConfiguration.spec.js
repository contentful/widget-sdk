import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import UserProvisioningConfiguration from './UserProvisioningConfiguration';
import ModalLauncher from '__mocks__/app/common/ModalLauncher';

jest.mock('app/settings/api/cma-tokens/TokenResourceManager', () => ({
  create: jest.fn()
}));

const renderComponent = () => {
  const component = <UserProvisioningConfiguration orgId={'testOrgId'} />;
  return render(component);
};

describe('UserProvisioningConfiguration', () => {
  it('should render scim setup page, with scim url and generate button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('scim-url')).toHaveValue(
      'https://api.contentful.com/scim/v2/organizations/testOrgId'
    );
    expect(getByTestId('generate-btn')).toBeInTheDocument();
  });

  it('should open generate personal access token modal on btn click', async () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('generate-btn'));
    expect(ModalLauncher.open).toHaveBeenCalled();
  });
});
