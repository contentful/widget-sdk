import React from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import StateLink from 'app/common/StateLink.es6';

import tokens from '@contentful/forma-36-tokens';
import JobsFeatureFlag from './JobsFeatureFlag.es6';

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

export function JobsStateLink({ isMasterEnvironment, children }) {
  const path = `spaces.detail.${isMasterEnvironment ? '' : 'environment.'}jobs`;
  return <StateLink to={path}>{children}</StateLink>;
}

JobsStateLink.propTypes = {
  isMasterEnvironment: PropTypes.bool,
  children: PropTypes.func.isRequired
};

export default function JobsPageLink({ isMasterEnvironment }) {
  return (
    <JobsFeatureFlag>
      {({ currentVariation }) => {
        return currentVariation ? (
          <div className={styles.linkContainer}>
            <JobsStateLink isMasterEnvironment={isMasterEnvironment}>
              {({ getHref }) => (
                <React.Fragment>
                  <TextLink href={getHref()} icon="Clock">
                    Scheduled Content
                  </TextLink>
                </React.Fragment>
              )}
            </JobsStateLink>
          </div>
        ) : null;
      }}
    </JobsFeatureFlag>
  );
}

JobsPageLink.propTypes = {
  isMasterEnvironment: PropTypes.bool
};
