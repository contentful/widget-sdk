import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
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
export const PricingNewCommunitySpace = ({ onNext }) => (
  <Grid columns={2} rows={1} columnGap="spacingXl" flow="row" className={styles.grid}>
    <NewCommunitySpaceImage />
    <div className={styles.content}>
      <Typography>
        <DisplayText size="large">We increased your space limit - for free.</DisplayText>
        <DisplayText className={styles.text}>
          Our new Community space has replaced the free Micro space
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

PricingNewCommunitySpace.propTypes = {
  onNext: PropTypes.func.isRequired,
};
