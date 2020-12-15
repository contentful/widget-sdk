import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import { TextLink, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { track } from 'analytics/Analytics';
import { useFeatureFlagAccessToLaunchApp } from '../ReleasesFeatureFlag';
import { launchAppUrl } from 'Config';

const styles = {
  noteWrapper: css({
    display: 'flex',
    gap: tokens.spacingXs,
  }),
  pill: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '3rem',
    padding: `0.1rem ${tokens.spacing2Xs}`,
    textTransform: 'uppercase',
    fontSize: tokens.fontSizeS,
    background: 'linear-gradient(90deg, #5096EF 0%, #38C29B 100%)',
    color: tokens.colorWhite,
    textAlign: 'center',
    borderRadius: '3px',
    letterSpacing: tokens.letterSpacingWide,
    textIndent: tokens.letterSpacingWide,
    fontWeight: tokens.fontWeightMedium,
  }),
  textLink: css({
    '&:link': {
      textDecoration: 'underline',
      fontWeight: tokens.fontWeightNormal,
    },
  }),
};

function getDeepLink(spaceId, environmentId) {
  const base = launchAppUrl;
  return !environmentId || environmentId === 'master'
    ? `${base}/spaces/${spaceId}`
    : `${base}/spaces/${spaceId}/environments/${environmentId}`;
}

export const LaunchAppDeepLink = ({ className, eventOrigin }) => {
  const { launchAppAccessEnabled, islaunchAppAccessLoading } = useFeatureFlagAccessToLaunchApp();
  const {
    currentSpaceId: spaceId,
    currentEnvironmentId,
    currentEnvironmentAliasId,
  } = useSpaceEnvContext();

  if (islaunchAppAccessLoading || !launchAppAccessEnabled) return null;

  return (
    <div className={cx(className, styles.noteWrapper)} data-test-id="launch-app-deep-link">
      <div className={styles.pill}>New</div>
      <Paragraph>
        Plan and schedule releases in the new Contentful{' '}
        <TextLink
          href={getDeepLink(spaceId, currentEnvironmentAliasId || currentEnvironmentId)}
          onClick={() =>
            track('launch_app:link_clicked', {
              eventOrigin: eventOrigin,
            })
          }
          target="_blank"
          rel="noopener noreferrer"
          linkType="muted"
          className={styles.textLink}
          icon="ChevronRight"
          iconPosition="right">
          Launch
        </TextLink>
      </Paragraph>
    </div>
  );
};

LaunchAppDeepLink.propTypes = {
  className: PropTypes.string,
  eventOrigin: PropTypes.string,
};
