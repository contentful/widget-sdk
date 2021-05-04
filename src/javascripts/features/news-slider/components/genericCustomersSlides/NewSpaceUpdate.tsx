import React from 'react';
import { css } from 'emotion';
import { NewCommunitySpaceImage, NewTeamFeaturesImage } from '../illustrations';
import tokens from '@contentful/forma-36-tokens';
import { Typography, DisplayText, Button, Icon } from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { BasePlanNames } from '../GenericCustomerSlides';

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

interface NewSpaceUpdateProps {
  onNext: () => void;
  basePlanName: string;
}

export const NewSpaceUpdate = ({ onNext, basePlanName }: NewSpaceUpdateProps) => {
  return (
    <Grid columns={2} rows={1} columnGap="spacingXl" className={styles.grid}>
      {basePlanName === BasePlanNames.TEAM ? <NewTeamFeaturesImage /> : <NewCommunitySpaceImage />}
      <div className={styles.content}>
        <Typography>
          <DisplayText size="large">We&apos;ve upgraded your organization!</DisplayText>
          <DisplayText className={styles.text}>
            {`To give you access to the latest and greatest Contentful has to offer, we’ve upgraded your
            account to our ${basePlanName} tier.`}
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
};
