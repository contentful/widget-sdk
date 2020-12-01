import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { LaunchAppDeepLink } from './LaunchAppDeepLink';
import * as Analytics from 'analytics/Analytics';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { useFeatureFlagAccessToLaunchApp } from 'app/Releases/ReleasesFeatureFlag';

jest.mock('analytics/Analytics', () => ({ track: jest.fn() }));
jest.mock('core/services/SpaceEnvContext/useSpaceEnvContext', () => ({
  useSpaceEnvContext: jest.fn(),
}));
useSpaceEnvContext.mockReturnValue({
  currentSpaceId: 'testSpaceId',
});
jest.mock('app/Releases/ReleasesFeatureFlag', () => ({
  useFeatureFlagAccessToLaunchApp: jest.fn().mockReturnValue({
    launchAppAccessEnabled: true,
    islaunchAppAccessLoading: false,
  }),
}));

jest.mock('analytics/Analytics', () => ({ track: jest.fn() }));
describe('components/ui/Loader', () => {
  it('render the component', () => {
    const { currentSpaceId } = useSpaceEnvContext();
    const { getByTestId } = render(<LaunchAppDeepLink eventOrigin="test-page" />);
    const textLink = getByTestId('cf-ui-text-link');
    expect(textLink).toHaveAttribute(
      'href',
      `https://launch.contentful.com/spaces/${currentSpaceId}`
    );
  });

  it('should track when link is clicked', () => {
    const { getByTestId } = render(<LaunchAppDeepLink eventOrigin="test-page" />);
    const textLink = getByTestId('cf-ui-text-link');
    fireEvent.click(textLink);
    expect(Analytics.track).toHaveBeenCalledWith('launch_app:link_clicked', {
      eventOrigin: 'test-page',
    });
  });

  it('should not display component when feature flag is disabled', () => {
    useFeatureFlagAccessToLaunchApp.mockReturnValue({ launchAppAccessEnabled: false });
    const { queryByTestId } = render(<LaunchAppDeepLink eventOrigin="test-page" />);
    expect(queryByTestId('launch-app-deep-link')).toBeNull();
  });
});
