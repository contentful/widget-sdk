import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { IDPDetailsForm } from './IDPDetailsForm';
import * as Fake from 'test/helpers/fakeFactory';
import { updateFieldValue, enable } from '../services/SSOService';
import { validate } from '../utils/utils';
import userEvent from '@testing-library/user-event';

const mockIdentityProvider = Fake.IdentityProvider();
const mockIdentityProviderEnabled = {
  data: {
    sys: { type: 'IdentityProvider', id: '2y6J2E3UVEzi5RFhI6xvPl', version: 8 },
    enabled: true,
    idpCert:
      '-----BEGIN CERTIFICATE-----MIIEHTCCAwWgAwIBAgIURpeRQfkW81lZeIepYruVOSshzsgwDQYJKoZIhvcNAQEF-----END CERTIFICATE-----',
    idpName: '',
    idpSsoTargetUrl: '"https://contentful-test-app-dev.com"',
    restrictedMode: false,
    ssoName: 'ssoName',
    testConnectionAt: null,
    testConnectionErrors: null,
    testConnectionResult: 'success',
  },
};

const mockOrg = Fake.Organization();
const onUpdateMock = jest.fn();

jest.mock('features/sso/utils/utils', () => ({
  validate: jest.fn(),
  connectionTestingAllowed: jest.fn(() => false),
}));

jest.mock('features/sso/services/SSOService', () => ({
  updateFieldValue: jest.fn(async () => mockIdentityProvider),
  enable: jest.fn(async () => mockIdentityProviderEnabled),
}));

describe('IDPDetailsForm', () => {
  const build = (identityProvider) => {
    return render(
      <IDPDetailsForm
        orgId={mockOrg.sys.id}
        orgName={mockOrg.name}
        identityProvider={identityProvider}
        onUpdate={onUpdateMock}
      />
    );
  };

  it('should render form', async () => {
    build(mockIdentityProvider);
    expect(screen.getByTestId('sso-provider')).toBeVisible();
    expect(screen.getByTestId('idp-sso-target-url')).toBeVisible();
    expect(screen.getByTestId('idp-cert')).toBeVisible();
    expect(screen.getByTestId('sso-name')).toBeVisible();
  });

  it('should update identity provider name on change', async () => {
    build(mockIdentityProvider);
    userEvent.selectOptions(screen.getByTestId('sso-provider'), ['OneLogin']);
    await waitFor(() =>
      expect(updateFieldValue).toHaveBeenCalledWith(
        'idpName',
        'OneLogin',
        mockIdentityProvider.data.sys.version,
        mockOrg.sys.id
      )
    );
    expect(onUpdateMock).toHaveBeenCalled();
  });

  it('should update idp target url on change', async () => {
    build(mockIdentityProvider);
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
    expect(onUpdateMock).toHaveBeenCalled();
  });

  it('should update idp cert on change', async () => {
    build(mockIdentityProvider);
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
    expect(onUpdateMock).toHaveBeenCalled();
  });

  it('should update sso name on change', async () => {
    build(mockIdentityProvider);
    const input = screen.getByLabelText('SSO name');
    userEvent.type(input, 'test-app');
    await waitFor(() => expect(validate).toHaveBeenCalledWith('ssoName', 'test-app'));
    expect(updateFieldValue).toHaveBeenCalledWith(
      'ssoName',
      'test-app',
      mockIdentityProvider.data.sys.version,
      mockOrg.sys.id
    );
    expect(onUpdateMock).toHaveBeenCalled();
  });

  it('should call enable on click', async () => {
    const mockIdentityProviderTestResultSuccess = {
      data: {
        sys: { type: 'IdentityProvider', id: '2y6J2E3UVEzi5RFhI6xvPl', version: 8 },
        enabled: false,
        idpCert: '',
        idpName: '',
        idpSsoTargetUrl: '',
        restrictedMode: false,
        ssoName: '',
        testConnectionAt: null,
        testConnectionErrors: null,
        testConnectionResult: 'success',
      },
    };
    build(mockIdentityProviderTestResultSuccess);

    const enableButton = screen.getByTestId('enable-button');
    expect(enableButton).toBeInTheDocument();
    expect(enableButton.hasAttribute('disabled')).toBeFalse();

    fireEvent.click(enableButton);
    await waitFor(() => expect(enable).toHaveBeenCalled());
  });
});
