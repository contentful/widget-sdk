import React from 'react';
import Enzyme from 'enzyme';
import IDPSetupForm from './IDPSetupForm.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

describe('IDPSetupForm', () => {
  let rendered;
  let endpoint;
  let identityProvider;

  const render = ({ identityProvider, organization }) => {
    return Enzyme.shallow(
      <IDPSetupForm organization={organization} identityProvider={identityProvider} />
    );
  };

  const organization = {
    name: 'My Awesome Org',
    sys: {
      id: 'org_1234'
    }
  };

  beforeEach(() => {
    identityProvider = {
      sys: {
        version: 1
      }
    };

    endpoint = jest.fn().mockResolvedValue(identityProvider);
    createOrganizationEndpoint.mockReturnValue(endpoint);

    rendered = render({ identityProvider, organization });
  });

  it('should show a secondary TextField if "other" is selected as SSO provider', async () => {
    expect(rendered.find('TextField[name="otherSsoProvider"]')).toHaveLength(0);

    rendered
      .find('[testId="ssoProvider"]')
      .first()
      .simulate('change', { target: { value: 'other' } });

    await endpoint();

    expect(rendered.find('[testId="otherSsoProvider"]')).toHaveLength(1);
  });

  it('should update a field every 500ms on change', async () => {
    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'li' } });
    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'lill' } });
    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'lilly' } });

    expect(endpoint.mock.calls).toHaveLength(0);

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(endpoint.mock.calls).toHaveLength(1);
  });

  it('should update a field immediately if input is blurred', () => {
    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('blur', { target: { value: 'lilly' } });

    expect(endpoint.mock.calls).toHaveLength(1);
  });
});
