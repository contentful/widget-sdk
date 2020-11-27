import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import { TextLink, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { track } from 'analytics/Analytics';

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

export const LaunchAppDeepLink = ({ className, origin }) => {
  const { currentSpaceId: spaceId } = useSpaceEnvContext();
  const launchAppLink = `https://launch.contentful.com/spaces/${spaceId}`;
  return (
    <div className={cx(className, styles.noteWrapper)}>
      <div className={styles.pill}>New</div>
      <Paragraph>
        Plan and schedule releases in the new Contentful{' '}
        <TextLink
          href={launchAppLink}
          onClick={() =>
            track('launch_app:link_clicked', {
              eventOrigin: origin,
            })
          }
          target="_blank"
          rel="noopener noreferrer"
          linkType="muted"
          className={styles.textLink}
          icon="ChevronRight"
          iconPosition="right">
          Planner
        </TextLink>
      </Paragraph>
    </div>
  );
};

LaunchAppDeepLink.propTypes = {
  className: PropTypes.string,
  origin: PropTypes.string,
};
