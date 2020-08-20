import React from 'react';
import { SSOEnabled } from './SSOEnabled';
import * as fake from 'test/helpers/fakeFactory';
import { render, fireEvent, screen } from '@testing-library/react';

describe('SSOEnabled', () => {
  const organization = fake.Organization();
  const trackFn = jest.fn();
  const build = ({ restricted }) => {
    return render(
      <SSOEnabled
        orgId={organization.sys.id}
        ssoName="testName"
        restrictedModeEnabled={restricted}
        onTrackSupportClick={trackFn}
      />
    );
  };

  it('should show the restricted support link if restricted mode is enabled', () => {
    build({ restricted: true });

    expect(screen.getByTestId('restricted-support-link')).toBeVisible();
  });

  it('should track when the restricted support link is clicked', () => {
    build({ restricted: true });
    const link = screen.getByTestId('restricted-support-link');

    expect(link).toBeVisible();
    fireEvent.click(link);

    expect(trackFn).toHaveBeenCalledTimes(1);
  });

  it('should track when the unrestricted support link is clicked', () => {
    build({ restricted: false });
    const link = screen.getByTestId('unrestricted-support-link');

    expect(link).toBeVisible();
    fireEvent.click(link);

    expect(trackFn).toHaveBeenCalledTimes(1);
  });

  it('should show the unrestricted support link if resstricted mode is not enabled', () => {
    build({ restricted: false });

    expect(screen.getByTestId('unrestricted-support-link')).toBeVisible();
  });

  it('should show the ssoName and bookmarkable link', () => {
    build({ restricted: false });

    expect(screen.getByTestId('ssoName')).toBeVisible();
    expect(screen.getByTestId('login-url')).toBeVisible();
  });
});
