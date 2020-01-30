import React from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import StateLink from 'app/common/StateLink';

import tokens from '@contentful/forma-36-tokens';
import ScheduledActionsFeatureFlag from './ScheduledActionsFeatureFlag';

const styles = {
  linkContainer: css({
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    padding: tokens.spacingL,
    backgroundColor: tokens.colorElementLightest,
    borderRight: `1px solid ${tokens.colorElementDarkest}`,
    boxShadow: '1px 0 2px 0 rgba(0,0,0,0.09)'
  }),
  jobsAlphaTag: css({
    marginLeft: tokens.spacingXs
  })
};

export function ScheduledActionsStateLink({ isMasterEnvironment, children }) {
  const path = `spaces.detail.${isMasterEnvironment ? '' : 'environment.'}jobs.list`;
  return <StateLink path={path}>{children}</StateLink>;
}

ScheduledActionsStateLink.propTypes = {
  isMasterEnvironment: PropTypes.bool,
  children: PropTypes.func.isRequired
};

export default function ScheduledActionsPageLink({ isMasterEnvironment }) {
  return (
    <ScheduledActionsFeatureFlag>
      {({ currentVariation }) => {
        return currentVariation ? (
          <div className={styles.linkContainer}>
            <ScheduledActionsStateLink isMasterEnvironment={isMasterEnvironment}>
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

ScheduledActionsPageLink.propTypes = {
  isMasterEnvironment: PropTypes.bool
};
