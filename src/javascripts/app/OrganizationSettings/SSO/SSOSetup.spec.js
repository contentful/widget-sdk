import React from 'react';
import Enzyme from 'enzyme';
import SSOSetup from './SSOSetup.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

describe('SSOSetup', () => {
  const organization = {
    name: 'My Org',
    sys: {
      id: 'org_1234'
    }
  };

  const render = ({ identityProvider, organization }) => {
    return Enzyme.shallow(
      <SSOSetup identityProvider={identityProvider} organization={organization} />
    );
  };

  it('should render the IDPSetupForm component if an identityProvider is given in props', () => {
    const identityProvider = {};
    const rendered = render({ identityProvider, organization });

    expect(rendered.find('IDPSetupForm')).toHaveLength(1);
  });

  it('should not render the IDPSetupForm component if an identityProvider is not given in props', () => {
    const rendered = render({ organization });

    expect(rendered.find('IDPSetupForm')).toHaveLength(0);
  });

  it('should attempt to create an identity provider if CTA button is clicked', () => {
    const endpoint = jest.fn();
    createOrganizationEndpoint.mockReturnValue(endpoint);

    const rendered = render({ organization });
    rendered
      .find('Button')
      .first()
      .simulate('click');

    expect(endpoint.mock.calls).toHaveLength(1);
  });
});
