import React from 'react';
import { render } from '@testing-library/react';
import UserProvisioningToken from './UserProvisioningToken';

const renderComponent = token => {
  const component = <UserProvisioningToken personalAccessToken={token} />;
  return render(component);
};

describe('UserProvisioningToken', () => {
  it('should render token in disabled input field, with copy button', () => {
    const fakeToken = { name: 'test', token: 'CFPAT-user_token' };
    const { getByTestId } = renderComponent(fakeToken);
    expect(getByTestId('scim-token')).toHaveProperty('disabled');
    expect(getByTestId('cf-ui-copy-button')).toBeInTheDocument();
  });
});
