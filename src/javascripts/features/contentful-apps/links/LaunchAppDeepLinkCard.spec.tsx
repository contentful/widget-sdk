import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { LaunchAppDeepLinkCard } from './LaunchAppDeepLinkCard';
import * as Analytics from 'analytics/Analytics';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { useContentfulAppsConfig } from 'features/contentful-apps';

jest.mock('features/contentful-apps/hooks/useContentfulAppConfig', () => ({
  ...(jest.requireActual('features/contentful-apps/hooks/useContentfulAppConfig') as any),
  useContentfulAppsConfig: jest.fn().mockReturnValue({
    isPurchased: true,
    isEnabled: true,
    isInstalled: true,
  }),
}));

jest.mock('analytics/Analytics', () => ({ track: jest.fn() }));
jest.mock('core/services/SpaceEnvContext', () => ({
  useSpaceEnvContext: jest.fn(),
}));

const defaultSpaceContextValues = {
  currentSpaceId: 'testSpaceId',
  currentEnvironmentId: 'master',
  currentEnvironmentAliasId: undefined,
};

describe('components/ui/Loader', () => {
  beforeEach(() => {
    (useSpaceEnvContext as jest.Mock).mockReturnValue(defaultSpaceContextValues);

    (useContentfulAppsConfig as jest.Mock).mockReturnValue({
      isPurchased: true,
      isEnabled: true,
      isInstalled: true,
    });
  });

  it('render the component', () => {
    const { getByTestId } = render(<LaunchAppDeepLinkCard eventOrigin="test-page" />);
    const textLink = getByTestId('cf-ui-text-link');
    expect(textLink).toHaveAttribute(
      'href',
      `https://launch.contentful.com/spaces/${defaultSpaceContextValues.currentSpaceId}`
    );
  });

  it('should track when link is clicked', () => {
    const { getByTestId } = render(<LaunchAppDeepLinkCard eventOrigin="test-page" />);
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

    (useSpaceEnvContext as jest.Mock).mockReturnValue(expectedValues);

    const { getByTestId } = render(<LaunchAppDeepLinkCard eventOrigin="test-page" />);
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

    (useSpaceEnvContext as jest.Mock).mockReturnValue(expectedValues);

    const { getByTestId } = render(<LaunchAppDeepLinkCard eventOrigin="test-page" />);
    const textLink = getByTestId('cf-ui-text-link');
    expect(textLink).toHaveAttribute(
      'href',
      `https://launch.contentful.com/spaces/${expectedValues.currentSpaceId}/environments/${expectedValues.currentEnvironmentAliasId}`
    );
  });

  it('should not display component when feature flag is disabled', () => {
    (useContentfulAppsConfig as jest.Mock).mockReturnValue({
      isPurchased: false,
      isEnabled: false,
      isInstalled: false,
    });
    const { queryByTestId } = render(<LaunchAppDeepLinkCard eventOrigin="test-page" />);
    expect(queryByTestId('launch-app-deep-link')).toBeNull();
  });
});
