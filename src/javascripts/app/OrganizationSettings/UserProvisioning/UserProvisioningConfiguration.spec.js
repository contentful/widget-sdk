import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import UserProvisioningConfiguration from './UserProvisioningConfiguration';
import ModalLauncher from '__mocks__/app/common/ModalLauncher';

jest.mock('app/settings/api/cma-tokens/TokenResourceManager', () => ({
  create: jest.fn()
}));

const renderComponent = props => {
  const component = <UserProvisioningConfiguration {...props} />;
  return render(component);
};

describe('UserProvisioningConfiguration', () => {
  it('should render scim setup page, with scim url and generate button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('scim-url')).toBeInTheDocument();
    expect(getByTestId('generate-btn').textContent).toBe('Generate personal access token');
  });

  it('should open generate personal access token modal on btn click', async () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('generate-btn'));
    expect(ModalLauncher.open).toHaveBeenCalled();
  });
});
