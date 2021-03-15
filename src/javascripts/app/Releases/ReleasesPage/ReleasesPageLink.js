import React from 'react';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';
import { LaunchAppDeepLink, IfAppInstalled } from 'features/contentful-apps';

const styles = {
  linkContainer: css({
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    padding: tokens.spacingL,
    backgroundColor: tokens.colorElementLightest,
    boxShadow: tokens.boxShadowDefault,
  }),
};

export default function ReleasesPageLink() {
  return (
    <IfAppInstalled appId="launch">
      <div className={styles.linkContainer}>
        <LaunchAppDeepLink withIcon iconSize={20} withExternalIcon eventOrigin="entry-editor">
          Releases
        </LaunchAppDeepLink>
      </div>
    </IfAppInstalled>
  );
}
