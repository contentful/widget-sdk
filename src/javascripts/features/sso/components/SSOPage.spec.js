import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';

import { SSOPage } from 'features/sso';
import * as fake from 'test/helpers/fakeFactory';
import { retrieveIdp, createIdp } from 'features/sso/services/SSOService';

const mockIdentityProvider = fake.IdentityProvider();
const mockOrg = fake.Organization();

jest.mock('features/sso/services/SSOService', () => ({
  retrieveIdp: jest.fn(() => {}),
  createIdp: jest.fn(() => mockIdentityProvider),
}));

describe('SSOPage', () => {
  const renderComponent = () => {
    return render(<SSOPage organization={mockOrg} />);
  };

  it('should have create-idp button present', async () => {
    renderComponent();

    await waitFor(() => expect(screen.getByTestId('create-idp')).toBeInTheDocument());
  });

  it('should call create afer create-idp button was clicked', async () => {
    renderComponent();
    await waitFor(() => expect(retrieveIdp).toHaveBeenCalled());

    const createButton = screen.getByTestId('create-idp');
    fireEvent.click(createButton);

    expect(createIdp).toHaveBeenCalledTimes(1);
  });

  it('should show form afer create-idp button was clicked', async () => {
    renderComponent();
    await waitFor(() => expect(retrieveIdp).toHaveBeenCalled());

    const createButton = screen.getByTestId('create-idp');
    fireEvent.click(createButton);

    await waitFor(() => expect(screen.getByTestId('audience-uri')).toBeInTheDocument());
  });
});
