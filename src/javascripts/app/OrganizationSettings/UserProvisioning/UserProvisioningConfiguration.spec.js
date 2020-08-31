import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import UserProvisioningConfiguration from './UserProvisioningConfiguration';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';

jest.mock('features/api-keys-management', () => ({
  TokenResourceManager: {
    createToken: jest.fn(),
  },
}));

const renderComponent = () => {
  const component = <UserProvisioningConfiguration orgId={'testOrgId'} />;
  return render(component);
};

describe('UserProvisioningConfiguration', () => {
  it('should render scim url in a disabled text input, with copy button', () => {
    const { getByTestId, getByLabelText } = renderComponent();
    expect(getByLabelText('SCIM URL')).toHaveProperty('disabled');
    expect(getByTestId('cf-ui-copy-button')).toBeInTheDocument();
  });

  it('should render the generate token button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('generate-btn')).toBeInTheDocument();
  });

  it('should open generate personal access token modal on btn click', async () => {
    jest.spyOn(ModalLauncher, 'open').mockImplementation(() => Promise.resolve(true));
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('generate-btn'));
    expect(ModalLauncher.open).toHaveBeenCalled();
  });

  it('should render link to account.profile.cma_tokens page', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('tokens-url')).toBeInTheDocument();
  });
});
