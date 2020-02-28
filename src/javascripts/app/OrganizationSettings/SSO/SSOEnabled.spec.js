import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';
import SSOEnabled from './SSOEnabled';
import { track } from 'analytics/Analytics';
import * as fake from 'testHelpers/fakeFactory';

describe('SSOEnabled', () => {
  const organization = fake.Organization();

  const render = ({ ssoName = '', restricted = undefined } = {}) => {
    return Enzyme.shallow(
      <SSOEnabled
        organization={organization}
        ssoName={ssoName}
        restrictedModeEnabled={restricted}
      />
    );
  };

  afterEach(() => {
    track.mockClear();
  });

  it('should show the restricted support link if restricted mode is enabled', () => {
    const rendered = render({ restricted: true });

    expect(rendered.find('[testId="restricted-support-link"]')).toHaveLength(1);
  });

  it('should track when the restricted support link is clicked', () => {
    const rendered = render({ restricted: true });

    rendered
      .find('[testId="restricted-support-link"]')
      .first()
      .simulate('click');

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenNthCalledWith(1, 'sso:contact_support');
  });

  it('should show the unrestricted support link if restricted mode is not enabled', () => {
    const rendered = render({ restricted: false });

    expect(rendered.find('[testId="unrestricted-support-link"]')).toHaveLength(1);
  });

  it('should track when the unrestricted support link is clicked', () => {
    const rendered = render({ restricted: false });

    rendered
      .find('[testId="unrestricted-support-link"]')
      .first()
      .simulate('click');

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenNthCalledWith(1, 'sso:contact_support');
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
