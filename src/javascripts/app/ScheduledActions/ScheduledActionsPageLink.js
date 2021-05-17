import React from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';
import { ScheduledActionsFeatureFlag } from 'features/scheduled-actions';
import { ReactRouterLink } from 'core/react-routing';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

const styles = {
  linkContainer: css({
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    padding: tokens.spacingL,
    backgroundColor: tokens.colorElementLightest,
    boxShadow: '1px 0 2px 0 rgba(0,0,0,0.09)',
  }),
  jobsAlphaTag: css({
    marginLeft: tokens.spacingXs,
  }),
};

export function ScheduledActionsStateLink({ children }) {
  const { currentSpaceId, currentEnvironmentId } = useSpaceEnvContext();
  return (
    <ReactRouterLink
      route={{
        path: 'spaces.details.jobs',
        spaceId: currentSpaceId,
        environmentId: currentEnvironmentId,
      }}>
      {children}
    </ReactRouterLink>
  );
}

ScheduledActionsStateLink.propTypes = {
  children: PropTypes.func.isRequired,
};

export default function ScheduledActionsPageLink() {
  return (
    <ScheduledActionsFeatureFlag>
      {({ currentVariation }) => {
        return currentVariation ? (
          <div className={styles.linkContainer}>
            <ScheduledActionsStateLink>
              {({ getHref, onClick }) => (
                <TextLink href={getHref()} onClick={onClick} icon="Clock">
                  Scheduled Content
                </TextLink>
              )}
            </ScheduledActionsStateLink>
          </div>
        ) : null;
      }}
    </ScheduledActionsFeatureFlag>
  );
}
