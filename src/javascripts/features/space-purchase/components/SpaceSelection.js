import React from 'react';
import cn from 'classnames';
import { css } from 'emotion';
import PropTypes from 'prop-types';

import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { Card, Heading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { websiteUrl } from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { SpaceCard } from './SpaceCard';
import { SPACE_PURCHASE_CONTENT, SPACE_PURCHASE_TYPES } from '../utils/spacePurchaseContent';

const styles = {
  fullRow: css({
    gridColumn: '1 / 4',
  }),
  sectionHeading: css({
    marginBottom: tokens.spacingM,
    fontWeight: '600',
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

export const SpaceSelection = ({ organizationId, selectPlan }) => {
  const getSelectHandler = (planType) => {
    switch (planType) {
      case SPACE_PURCHASE_TYPES.MEDIUM:
      case SPACE_PURCHASE_TYPES.LARGE:
        return () => {
          // NOTE: Add SELECT_PLAN space wizard tracking here
          selectPlan(planType);
        };

      case SPACE_PURCHASE_TYPES.ENTERPRISE:
        return () => {
          trackCTAClick(CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
            organizationId,
          });
        };
      default:
        return () => {};
    }
  };

  return (
    <section aria-labelledby="space-selection-section" data-test-id="space-selection-section">
      <Grid columns={3} rows="repeat(3, 'auto')" columnGap="spacingL" rowGap="spacingM">
        <Heading
          id="space-selection-heading"
          element="h2"
          className={cn(styles.fullRow, styles.sectionHeading)}
          testId="space-selection.heading">
          Choose the space that’s right for your project
        </Heading>

        {SPACE_PURCHASE_CONTENT.map((spaceContent, idx) => (
          <SpaceCard
            key={idx}
            content={spaceContent}
            handleSelect={getSelectHandler(spaceContent.type)}
          />
        ))}

        <div className={cn(styles.fullRow, styles.communitySection)}>
          <Card className={styles.card} testId="space-selection.community-card">
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

SpaceSelection.propTypes = {
  organizationId: PropTypes.string,
  selectPlan: PropTypes.func,
};