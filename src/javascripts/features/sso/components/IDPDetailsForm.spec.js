import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IDPDetailsForm } from './IDPDetailsForm';
import * as Fake from 'test/helpers/fakeFactory';
import { updateFieldValue } from '../services/SSOService';
import { validate } from '../utils/utils';
import userEvent from '@testing-library/user-event';

const mockIdentityProvider = Fake.IdentityProvider();
const mockOrg = Fake.Organization();

jest.mock('features/sso/utils/utils', () => ({
  validate: jest.fn(),
}));

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

  it('should update identity provider name on change', async () => {
    build();
    userEvent.selectOptions(screen.getByTestId('sso-provider'), ['OneLogin']);
    await waitFor(() =>
      expect(updateFieldValue).toHaveBeenCalledWith(
        'idpName',
        'OneLogin',
        mockIdentityProvider.data.sys.version,
        mockOrg.sys.id
      )
    );
  });

  it('should update idp target url on change', async () => {
    build();
    const input = screen.getByLabelText('Single Sign-On Redirect URL');
    userEvent.type(input, 'https://contentful-app-dev.onelogin.com/trust/saml2/http-post/sso/123');
    await waitFor(() =>
      expect(validate).toHaveBeenCalledWith(
        'idpSsoTargetUrl',
        'https://contentful-app-dev.onelogin.com/trust/saml2/http-post/sso/123'
      )
    );
    expect(updateFieldValue).toHaveBeenCalledWith(
      'idpSsoTargetUrl',
      'https://contentful-app-dev.onelogin.com/trust/saml2/http-post/sso/123',
      mockIdentityProvider.data.sys.version,
      mockOrg.sys.id
    );
  });

  it('should update idp cert on change', async () => {
    build();
    const mockCert = `
        -----BEGIN CERTIFICATE-----
        MIIEHTCCAwWgAwIBAgIURpeRQfkW81lZeIepYruVOSshzsgwDQYJKoZIhvcNAQEF
        -----END CERTIFICATE-----
      `;

    const input = screen.getByLabelText('X.509 Certificate');
    userEvent.type(input, mockCert);
    await waitFor(() => expect(validate).toHaveBeenCalledWith('idpCert', mockCert));
    expect(updateFieldValue).toHaveBeenCalledWith(
      'idpCert',
      mockCert,
      mockIdentityProvider.data.sys.version,
      mockOrg.sys.id
    );
  });

  it('should update sso name on change', async () => {
    build();
    const input = screen.getByLabelText('SSO name');
    userEvent.type(input, 'test-app');
    await waitFor(() => expect(validate).toHaveBeenCalledWith('ssoName', 'test-app'));
    expect(updateFieldValue).toHaveBeenCalledWith(
      'ssoName',
      'test-app',
      mockIdentityProvider.data.sys.version,
      mockOrg.sys.id
    );
  });
});
