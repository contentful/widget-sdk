import React from 'react';
import { render } from '@testing-library/react';
import UserProvisioningConfiguration from './UserProvisioningConfiguration';

const renderComponent = props => {
  const component = <UserProvisioningConfiguration {...props} />;
  return render(component);
};

describe('UserProvisioningConfiguration', () => {
  it('should render scim setup page, with scim url disabled input', async () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('scim-header').textContent).toBe('Set up user provisioning with SCIM 2.0');
  });
});
