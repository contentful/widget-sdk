import React from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import StateLink from 'app/common/StateLink.es6';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import tokens from '@contentful/forma-36-tokens';
import * as FeatureFlagKey from 'featureFlags.es6';

const styles = {
  linkContainer: css({
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    padding: tokens.spacingL,
    backgroundColor: tokens.colorElementLightest,
    borderRight: `1px solid ${tokens.colorElementDarkest}`,
    boxShadow: '1px 0 2px 0 rgba(0,0,0,0.09)'
  })
};

export function JobsStateLink({ environmentId, children }) {
  let path;
  if (environmentId === 'master') {
    path = 'spaces.detail.jobs';
  } else {
    path = 'spaces.detail.environment.jobs';
  }
  return <StateLink to={path}>{children}</StateLink>;
}

JobsStateLink.propTypes = {
  environmentId: PropTypes.string,
  children: PropTypes.func.isRequired
};

export default function JobsPageLink({ environmentId }) {
  return (
    <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.JOBS}>
      <div className={styles.linkContainer}>
        <JobsStateLink environmentId={environmentId}>
          {({ getHref }) => (
            <TextLink href={getHref()} icon="ExternalLink">
              Scheduled Content
            </TextLink>
          )}
        </JobsStateLink>
      </div>
    </BooleanFeatureFlag>
  );
}

JobsPageLink.propTypes = {
  environmentId: PropTypes.string
};
