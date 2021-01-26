import React from 'react';
import PropTypes from 'prop-types';
import {
  Plan as PlanPropType,
  Resource as ResourcePropType,
  Space as SpacePropType,
} from 'app/OrganizationSettings/PropTypes';
import {
  Typography,
  Heading,
  Paragraph,
  Card,
  Subheading,
  SectionHeading,
  Button,
  Icon,
} from '@contentful/forma-36-react-components';
import { Flex, Grid } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { isFreeProductPlan } from 'account/pricing/PricingDataProvider';
import { SpacePlanResourceList } from './SpacePlanResourceList';

const styles = {
  text: css({
    textAlign: 'center',
  }),
  content: css({
    width: tokens.contentWidthText,
    margin: 'auto',
  }),
  header: css({
    marginBottom: tokens.spacingM,
  }),
  divider: css({
    display: 'flex',
    alignItems: 'center',
    minWidth: 18,
    marginTop: 60,
    borderLeft: `1px solid ${tokens.colorElementMid}`,
  }),
  dividerIcon: css({
    position: 'relative',
    left: -9,
    background: 'white',
  }),
};

export function SpacePlanAssignmentConfirmation({
  currentPlan,
  selectedPlan,
  space,
  spaceResources,
  onPrev,
  onNext,
  inProgress,
}) {
  return (
    <>
      <Typography className={styles.text}>
        <Heading>One more thing ☝️</Heading>
        <Paragraph>
          {`You are about to change ${space.name} type. Check one last time to make sure everything is in order, then confirm.`}
          {isFreeProductPlan(currentPlan) && (
            <>
              <br />
              <strong>
                This cannot be undone as {space.name} is a {currentPlan.name}
              </strong>
            </>
          )}
        </Paragraph>
      </Typography>

      <section className={styles.content}>
        <Card padding="large">
          <Grid columns="1fr 0 1fr" rows="2" columnGap="spacing2Xl">
            <div>
              <header className={styles.header}>
                <SectionHeading>Current type</SectionHeading>
                <Subheading>{currentPlan.name}</Subheading>
              </header>
              <SpacePlanResourceList plan={currentPlan} spaceResources={spaceResources} />
            </div>

            <div className={styles.divider}>
              <Icon icon="ChevronRight" color="muted" className={styles.dividerIcon} />
            </div>

            <div>
              <header className={styles.header}>
                <SectionHeading>New type</SectionHeading>
                <Subheading>{selectedPlan.name}</Subheading>
              </header>
              <SpacePlanResourceList plan={selectedPlan} />
            </div>
          </Grid>
        </Card>
        <Flex justifyContent="flex-end" alignItems="center" flexGrow="1" marginTop="spacingL">
          <Button buttonType="muted" onClick={onPrev} disabled={inProgress} testId="go-back-btn">
            Back
          </Button>
          <Flex marginLeft="spacingM">
            <Button
              buttonType="positive"
              onClick={onNext}
              loading={inProgress}
              testId="confirm-btn">
              Confim and change
            </Button>
          </Flex>
        </Flex>
      </section>
    </>
  );
}

SpacePlanAssignmentConfirmation.propTypes = {
  currentPlan: PlanPropType.isRequired,
  selectedPlan: PlanPropType.isRequired,
  spaceResources: PropTypes.objectOf(ResourcePropType).isRequired,
  space: SpacePropType.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  inProgress: PropTypes.bool,
};
