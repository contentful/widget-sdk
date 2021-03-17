import React from 'react';
import { LEVEL } from '../constants';
import { Paragraph } from '@contentful/forma-36-react-components';

interface LevelHelpTextParams {
  level?: LEVEL;
}

export function LevelHelpText({ level }: LevelHelpTextParams) {
  switch (level) {
    case LEVEL.MIGRATING:
      return (
        <>
          <Paragraph>
            Asset metadata returned from the Delivery, Management and Preview API contains Public
            Asset URLs. All assets will still be unprotected and accessible.
          </Paragraph>
          <Paragraph>
            You can generate signing keys to sign Secure Asset URLs and fetch assets from the Secure
            Asset CDN using Signed Secure Asset URLs. Typography
          </Paragraph>
        </>
      );
    case LEVEL.UNPUBLISHED:
      return (
        <>
          <Paragraph>
            All asset URLs returned from the CMA and CPA will point to the Secure Assets CDN and
            must be signed before use.
          </Paragraph>
          <Paragraph>
            All unpublished media URLs pointing to the normal assets CDN will cease to function
            within 48 hours.
          </Paragraph>
          <Paragraph>
            All published assets will remain publicly accessible and URLs returned from the CDA will
            continue to point to the normal Assets CDN. An asset is considered published if it is
            published in any environment in a space.
          </Paragraph>
        </>
      );
    case LEVEL.ALL:
      return (
        <>
          <Paragraph>
            All asset URLs returned from the CDA, CMA, and CPA will point to the Secure Assets CDN
            and must be signed before use.
          </Paragraph>
          <Paragraph>
            All media URLs pointing to the normal assets CDN will cease to function within 48 hours.
          </Paragraph>
        </>
      );
    default:
      return null;
  }
}
