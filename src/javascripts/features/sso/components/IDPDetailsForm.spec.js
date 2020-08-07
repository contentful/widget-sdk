import React from 'react';
import { render, screen } from '@testing-library/react';
import { IDPDetailsForm } from './IDPDetailsForm';
import * as Fake from 'test/helpers/fakeFactory';
// import { updateFieldValue } from '../services/SSOService';

const mockIdentityProvider = Fake.IdentityProvider();
const mockOrg = Fake.Organization();

jest.mock('lodash/debounce', () => (fn) => fn);

jest.mock('features/sso/services/SSOService', () => ({
  updateFieldValue: jest.fn(async () => mockIdentityProvider),
}));

describe('IDPDetailsForm', () => {
  const build = () => {
    return render(
      <IDPDetailsForm
        orgId={mockOrg.sys.id}
        orgName={mockOrg.name}
        identityProvider={mockIdentityProvider}
      />
    );
  };

  it('should render form', async () => {
    build();
    expect(screen.getByTestId('sso-provider')).toBeVisible();
    expect(screen.getByTestId('idp-sso-target-url')).toBeVisible();
    expect(screen.getByTestId('idp-cert')).toBeVisible();
    expect(screen.getByTestId('sso-name')).toBeVisible();
  });

  // it('should update identity provider name on change', async () => {
  //   build();
  //   fireEvent.change(screen.getByTestId('sso-provider'), {
  //     target: {
  //       value: 'OneLogin',
  //     },
  //   });
  //   await waitFor(() =>
  //     expect(updateFieldValue).toHaveBeenCalledWith(
  //       'idpName',
  //       'OneLogin',
  //       mockIdentityProvider.data.sys.version,
  //       mockOrg.sys.id
  //     )
  //   );
  // });

  // it('should update idp target url on change', async () => {
  //   build();
  //   const input = screen.getByLabelText('Single Sign-On Redirect URL');
  //   fireEvent.change(input, {
  //     target: {
  //       value: 'https://contentful-app-dev.onelogin.com/trust/saml2/http-post/sso/1234',
  //     },
  //   });
  //   await waitFor(() => expect(updateFieldValue).toHaveBeenCalled());
  // });

  // it('should show error for invalid idp target url on change', async () => {
  //   build();
  //   const input = screen.getByLabelText('Single Sign-On Redirect URL');
  //   fireEvent.change(input, {
  //     target: {
  //       value: 'contentful',
  //     },
  //   });
  //   expect(screen.findByText('URL is not valid')).toBeVisible();
  // });

  // it('should show error for invalid idp cert on change', async () => {
  //   build();
  //   const invalidCert = 'test';
  //   const input = screen.getByLabelText('X.509 Certificate');
  //   await fireEvent.change(input, {
  //     target: {
  //       value: invalidCert,
  //     },
  //   });
  //   expect(screen.findByText('X.509 certificate format is not correct')).toBeVisible();
  // });

  // it('should update sso name on change', async () => {
  //   build();
  //   const input = screen.getByLabelText('SSO name');
  //   fireEvent.change(input, {
  //     target: {
  //       value: 'test-app',
  //     },
  //   });
  //   await waitFor(() =>
  //     expect(updateFieldValue).toHaveBeenCalledWith(
  //       'ssoName',
  //       'test-app',
  //       mockIdentityProvider.data.sys.version,
  //       mockOrg.sys.id
  //     )
  //   );
  // });
});
