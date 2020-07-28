import React from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import StateLink from 'app/common/StateLink';

import tokens from '@contentful/forma-36-tokens';
import ReleasesFeatureFlag from '../ReleasesFeatureFlag';

const styles = {
  linkContainer: css({
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    padding: tokens.spacingL,
    backgroundColor: tokens.colorElementLightest,
    boxShadow: tokens.boxShadowDefault,
  }),
};

export function ReleasesStateLink({ isMasterEnvironment, children }) {
  const path = `spaces.detail.${isMasterEnvironment ? '' : 'environment.'}releases.list`;
  return <StateLink path={path}>{children}</StateLink>;
}

ReleasesStateLink.propTypes = {
  isMasterEnvironment: PropTypes.bool,
  children: PropTypes.func.isRequired,
};

export default function ReleasesPageLink({ isMasterEnvironment }) {
  return (
    <ReleasesFeatureFlag>
      {({ currentVariation }) => {
        return currentVariation ? (
          <div className={styles.linkContainer}>
            <ReleasesStateLink isMasterEnvironment={isMasterEnvironment}>
              {({ getHref, onClick }) => (
                <TextLink href={getHref()} onClick={onClick} icon="Release">
                  Releases
                </TextLink>
              )}
            </ReleasesStateLink>
          </div>
        ) : null;
      }}
    </ReleasesFeatureFlag>
  );
}

ReleasesPageLink.propTypes = {
  isMasterEnvironment: PropTypes.bool,
};
