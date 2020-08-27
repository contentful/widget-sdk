import { Notification } from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { fieldErrorMessage } from '../utils/utils';

export async function retrieveIdp(orgId) {
  const endpoint = createOrganizationEndpoint(orgId);
  try {
    return await endpoint({
      method: 'GET',
      path: ['identity_provider'],
    });
  } catch (e) {
    return;
  }
}

export async function createIdp(orgId) {
  const endpoint = createOrganizationEndpoint(orgId);

  try {
    await endpoint({
      method: 'POST',
      path: ['identity_provider'],
      data: {
        ssoName: null,
      },
    });
  } catch (e) {
    Notification.error('Could not set up SSO. Try again.');
    return;
  }
  track('sso:start_setup');
}

export async function updateFieldValue(fieldName, value, version, orgId) {
  const endpoint = createOrganizationEndpoint(orgId);
  try {
    await endpoint({
      method: 'PUT',
      path: ['identity_provider'],
      version,
      data: {
        [fieldName]: value,
      },
    });
  } catch (e) {
    throw new Error(fieldErrorMessage(fieldName, e.status));
  }
}

export async function enable(orgId) {
  const endpoint = createOrganizationEndpoint(orgId);

  try {
    await endpoint({
      method: 'POST',
      path: ['identity_provider', 'enable'],
    });
  } catch (e) {
    Notification.error('Could not enable SSO. Try again.');
    return;
  }

  track('sso:enable');
  Notification.success('SSO successfully enabled!');
}
