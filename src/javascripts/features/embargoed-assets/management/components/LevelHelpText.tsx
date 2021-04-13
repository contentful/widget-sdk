import React from 'react';
import { Level, LEVEL } from '../constants';
import { Paragraph, Typography } from '@contentful/forma-36-react-components';

import { styles } from '../EmbargoedAssets.styles';

interface LevelHelpTextParams {
  level?: Level;
}

export function LevelHelpText({ level }: LevelHelpTextParams) {
  switch (level) {
    case LEVEL.MIGRATING:
      return (
        <Typography>
          <Paragraph className={styles.largeMarginBottom}>
            All asset URLs returned from the CDA, CMA, and CPA will point to the normal assets CDN
            and will be publicly accessible.
          </Paragraph>
          <Paragraph className={styles.largeMarginBottom}>
            You can generate signing keys and fetch assets from the secure assets CDN using signed
            secure asset URLs.
          </Paragraph>
        </Typography>
      );
    case LEVEL.UNPUBLISHED:
      return (
        <Typography>
          <Paragraph className={styles.largeMarginBottom}>
            All asset URLs returned from the CMA and CPA will point to the secure assets CDN and
            must be signed before use.
          </Paragraph>
          <Paragraph className={styles.largeMarginBottom}>
            All unpublished asset URLs pointing to the normal assets CDN will cease to function
            within 48 hours.
          </Paragraph>
          <Paragraph className={styles.largeMarginBottom}>
            All published assets will remain publicly accessible and URLs returned from the CDA will
            continue to point to the normal assets CDN. An asset is considered published if it is
            published in any environment in a space.
          </Paragraph>
        </Typography>
      );
    case LEVEL.ALL:
      return (
        <Typography>
          <Paragraph className={styles.largeMarginBottom}>
            All asset URLs returned from the CDA, CMA, and CPA will point to the secure assets CDN
            and must be signed before use.
          </Paragraph>
          <Paragraph className={styles.largeMarginBottom}>
            All asset URLs pointing to the normal assets CDN will cease to function within 48 hours.
          </Paragraph>
        </Typography>
      );
    default:
      return null;
  }
}
