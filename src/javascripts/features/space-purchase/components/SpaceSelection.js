import React from 'react';
import cn from 'classnames';
import { css } from 'emotion';

import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { Card, Heading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { websiteUrl } from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { SpaceCard } from './SpaceCard';
import { SPACE_PURCHASE_CONTENT } from '../utils/spacePurchaseContent';

const styles = {
  fullRow: css({
    gridColumn: '1 / 4',
  }),
  sectionHeading: css({
    marginBottom: tokens.spacingM,
  }),
  normalWeight: css({
    fontWeight: tokens.fontWeightNormal,
  }),
  communitySection: css({
    display: 'flex',
    flexDirection: 'column',
    '& a': { margin: `${tokens.spacingM} auto 0` },
  }),
  card: css({
    position: 'relative',
    padding: `${tokens.spacingXl} ${tokens.spacingL}`,
    overflow: 'hidden',
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      backgroundColor: tokens.colorYellowMid,
      width: tokens.spacingXs,
      height: '100%',
    },
  }),
};

export const SpaceSelection = () => {
  return (
    <section aria-labelledby="section-label">
      <Grid columns={3} rows="repeat(3, 'auto')" columnGap="spacingL" rowGap="spacingM">
        <Heading
          id="section-label"
          element="h2"
          className={cn(styles.fullRow, styles.sectionHeading)}>
          Choose the space that’s right for your project
        </Heading>

        {SPACE_PURCHASE_CONTENT.map((spaceContent, idx) => (
          <SpaceCard key={idx} content={spaceContent} handleSelect={() => {}} /> // TODO: pass here the function to select space for purchase
        ))}

        <div className={cn(styles.fullRow, styles.communitySection)}>
          <Card className={styles.card}>
            <Heading element="h3" className={styles.normalWeight}>
              Community
            </Heading>
            <Paragraph>Free space limited to 1 per organization.</Paragraph>
          </Card>
          <ExternalTextLink href={websiteUrl('pricing/#feature-overview')}>
            See full feature list
          </ExternalTextLink>
        </div>
      </Grid>
    </section>
  );
};
