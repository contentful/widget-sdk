import React from 'react';
import { css } from 'emotion';
import { NewCommunitySpaceImage } from '../illustrations';
import tokens from '@contentful/forma-36-tokens';
import { Typography, DisplayText, Button, Icon } from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';

const styles = {
  grid: css({
    alignItems: 'center',
    height: '100%',
    '@media screen and (min-width: 769px)': {
      gap: `0 ${tokens.spacing3Xl}`,
    },
  }),
  content: css({
    '@media screen and (min-width: 769px)': {
      marginRight: '160px',
    },
  }),
  text: css({
    color: tokens.colorTextLight,
    fontWeight: tokens.fontWeightNormal,
    marginBottom: tokens.spacingL,
  }),
  alignedButtonLabel: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
};

interface NewCommunitySpaceProps {
  onNext: () => void;
}

export const NewCommunitySpace = ({ onNext }: NewCommunitySpaceProps) => (
  <Grid columns={2} rows={1} columnGap="spacingXl" flow="row" className={styles.grid}>
    <NewCommunitySpaceImage />
    <div className={styles.content}>
      <Typography>
        <DisplayText size="large">We&apos;ve upgraded your organization!</DisplayText>
        <DisplayText className={styles.text}>
          To give you access to the latest and greatest Contentful has to offer, we’ve upgraded your
          account to our Community tier.
        </DisplayText>
      </Typography>
      <Button size="large" onClick={onNext}>
        <span className={styles.alignedButtonLabel}>
          What&apos;s new?
          <Icon icon="ChevronRight" color="white" size="medium" />
        </span>
      </Button>
    </div>
  </Grid>
);
