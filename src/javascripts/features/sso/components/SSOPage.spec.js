import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';

import { SSOPage } from 'features/sso';
import * as fake from 'test/helpers/fakeFactory';

const mockIdentityProvider = fake.IdentityProvider();
const mockOrg = fake.Organization();

jest.mock('features/sso/services/SSOService', () => ({
  retrieveIdp: () => mockIdentityProvider,
  createIdp: () => mockIdentityProvider,
}));

describe('SSOPage', () => {
  const renderComponent = async () => {
    await render(<SSOPage organization={mockOrg} />);
  };

  it('should have create-idp button present', async () => {
    await renderComponent();

    expect(screen.getByTestId('create-idp')).toBeInTheDocument();
  });

  it('should show form afer create-idp button was clicked', async () => {
    await renderComponent();

    const createButton = screen.getByTestId('create-idp');
    fireEvent.click(createButton);

    expect(screen.getByTestId('sso-provider')).toBeInTheDocument();
  });
});
