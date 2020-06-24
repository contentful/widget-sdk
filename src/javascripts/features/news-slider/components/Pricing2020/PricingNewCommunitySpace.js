import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import NewCommunitySpaceImage from 'svg/illustrations/new-spaces-illustrations-a.svg';
import tokens from '@contentful/forma-36-tokens';
import { Typography, DisplayText, Button } from '@contentful/forma-36-react-components';
import { Grid, GridItem } from '@contentful/forma-36-react-components/dist/alpha';

const styles = {
  grid: css({ alignItems: 'center' }),
  content: css({ marginRight: '160px' }),
  text: css({
    color: tokens.colorTextLight,
    fontWeight: tokens.fontWeightNormal,
    marginBottom: tokens.spacingL,
  }),
};
export const PricingNewCommunitySpace = ({ onNext }) => (
  <Grid columns={2} rows={1} columnGap="spacing3Xl" flow="row" className={styles.grid}>
    <GridItem>
      <NewCommunitySpaceImage />
    </GridItem>
    <GridItem>
      <div className={styles.content}>
        <Typography>
          <DisplayText size="large">We increased your space limit - for free.</DisplayText>
          <DisplayText className={styles.text}>
            Our new community space has replaced the free micro space
          </DisplayText>
        </Typography>
        <Button size="large" onClick={onNext}>
          What&apos;s new?
        </Button>
      </div>
    </GridItem>
  </Grid>
);

PricingNewCommunitySpace.propTypes = {
  onNext: PropTypes.func.isRequired,
};
