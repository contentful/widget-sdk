import React from 'react';
import Enzyme from 'enzyme';
import SSOEnabled from './SSOEnabled.es6';

describe('SSOEnabled', () => {
  const organization = {
    name: 'My Org',
    sys: {
      id: 'org_1234'
    }
  }

  const render = ({
    ssoName = '',
    restricted = undefined
  } = {}) => {
    return Enzyme.shallow(
      <SSOEnabled
        organization={organization}
        ssoName={ssoName}
        restrictedModeEnabled={restricted}
      />
    );
  };

  it('should show the restricted support link if restricted mode is enabled', () => {
    const rendered = render({ restricted: true });

    expect(rendered.find('[testId="restricted-support-link"]')).toHaveLength(1);
  });

  it('should show the unrestricted support link if restricted mode is not enabled', () => {
    const rendered = render({ restricted: false });

    expect(rendered.find('[testId="unrestricted-support-link"]')).toHaveLength(1);
  });

  it('should show the ssoName and bookmarkable link regardless of restricted status', () => {
    let rendered;

    rendered = render({ restricted: false });

    expect(rendered.find('[testId="sign-in-name"]')).toHaveLength(1);
    expect(rendered.find('[testId="login-url"]')).toHaveLength(1);

    rendered = render({ restricted: true });

    expect(rendered.find('[testId="sign-in-name"]')).toHaveLength(1);
    expect(rendered.find('[testId="login-url"]')).toHaveLength(1);
  });
});
