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

jest.mock('app/Releases/ReleasesFeatureFlag', () => ({
  useFeatureFlagAccessToLaunchApp: jest.fn(),
}));

const defaultSpaceContextValues = {
  currentSpaceId: 'testSpaceId',
  currentEnvironmentId: 'master',
  currentEnvironmentAliasId: undefined,
};

describe('components/ui/Loader', () => {
  beforeEach(() => {
    useSpaceEnvContext.mockReturnValue(defaultSpaceContextValues);

    useFeatureFlagAccessToLaunchApp.mockReturnValue({
      launchAppAccessEnabled: true,
      islaunchAppAccessLoading: false,
    });
  });

  it('render the component', () => {
    const { getByTestId } = render(<LaunchAppDeepLink eventOrigin="test-page" />);
    const textLink = getByTestId('cf-ui-text-link');
    expect(textLink).toHaveAttribute(
      'href',
      `https://launch.contentful.com/spaces/${defaultSpaceContextValues.currentSpaceId}`
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

  it('should take environment into account if not master', () => {
    const expectedValues = {
      currentSpaceId: 'testSpaceId',
      currentEnvironmentId: 'development',
    };

    useSpaceEnvContext.mockReturnValue(expectedValues);

    const { getByTestId } = render(<LaunchAppDeepLink eventOrigin="test-page" />);
    const textLink = getByTestId('cf-ui-text-link');
    expect(textLink).toHaveAttribute(
      'href',
      `https://launch.contentful.com/spaces/${expectedValues.currentSpaceId}/environments/${expectedValues.currentEnvironmentId}`
    );
  });

  it('should take alias id instead of environment if provided', () => {
    const expectedValues = {
      currentSpaceId: 'testSpaceId',
      currentEnvironmentId: 'development-2020-08-02',
      currentEnvironmentAliasId: 'development',
    };

    useSpaceEnvContext.mockReturnValue(expectedValues);

    const { getByTestId } = render(<LaunchAppDeepLink eventOrigin="test-page" />);
    const textLink = getByTestId('cf-ui-text-link');
    expect(textLink).toHaveAttribute(
      'href',
      `https://launch.contentful.com/spaces/${expectedValues.currentSpaceId}/environments/${expectedValues.currentEnvironmentAliasId}`
    );
  });

  it('should not display component when feature flag is disabled', () => {
    useFeatureFlagAccessToLaunchApp.mockReturnValue({ launchAppAccessEnabled: false });
    const { queryByTestId } = render(<LaunchAppDeepLink eventOrigin="test-page" />);
    expect(queryByTestId('launch-app-deep-link')).toBeNull();
  });
});
