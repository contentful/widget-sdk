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

export default function JobsPageLink({ environmentId }) {
  let path;
  if (environmentId === 'master') {
    path = 'spaces.detail.jobs';
  } else {
    path = 'spaces.detail.environment.jobs';
  }
  return (
    <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.JOBS}>
      <div className={styles.linkContainer}>
        <StateLink to={path}>
          {({ getHref }) => (
            <TextLink href={getHref()} icon="ExternalLink">
              Scheduled Content
            </TextLink>
          )}
        </StateLink>
      </div>
    </BooleanFeatureFlag>
  );
}

JobsPageLink.propTypes = {
  environmentId: PropTypes.string
};
