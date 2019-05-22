import React, { Component } from 'react';
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

export default class JobsPageLink extends Component {
  render() {
    return (
      <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.JOBS}>
        {({ currentVariation }) => {
          return currentVariation === true ? (
            <div className={styles.linkContainer}>
              <StateLink to="spaces.detail.jobs">
                {({ getHref }) => (
                  <TextLink href={getHref()} icon="ExternalLink">
                    Scheduled Jobs
                  </TextLink>
                )}
              </StateLink>
            </div>
          ) : null;
        }}
      </BooleanFeatureFlag>
    );
  }
}
