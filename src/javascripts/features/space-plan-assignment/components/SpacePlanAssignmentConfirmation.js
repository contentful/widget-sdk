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
  Tag,
  Subheading,
  Button,
  List,
  ListItem,
  Icon,
  Tooltip,
} from '@contentful/forma-36-react-components';
import { Flex, Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { isFreeProductPlan } from 'account/pricing/PricingDataProvider';
import { getIncludedResources, resourcesToDisplay, getTooltip } from '../utils/utils';
import { getRolesTooltip } from 'utils/RoleTooltipCopy';
import { shorten } from 'utils/NumberUtils';

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
  listItem: css({
    marginBottom: tokens.spacingS,
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: 'max-content',
    columnGap: tokens.spacingS,
    alignItems: 'center',
    ':last-child': {
      marginBottom: 0,
    },
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
  tooltipPointer: css({ cursor: 'pointer' }),
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
  const currentPlanResources = getIncludedResources(
    currentPlan.ratePlanCharges ?? currentPlan.productRatePlanCharges
  );
  const selectedPlanResources = getIncludedResources(selectedPlan.ratePlanCharges);

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
                <Tag tagType="muted">Current type</Tag>
                <Subheading>{currentPlan.name}</Subheading>
              </header>
              <List>
                {resourcesToDisplay.map(({ name, id }) => {
                  let usage = spaceResources[id].usage;
                  // Add "extra" environment and role to include `master` and `admin`
                  if (['environment', 'role'].includes(id)) {
                    usage = usage + 1;
                  }

                  return (
                    <ListItem key={id} className={styles.listItem}>
                      <Icon icon="CheckCircle" color="muted" />
                      <span>
                        Using {shorten(usage)} of {shorten(currentPlanResources[id])} {name}
                      </span>
                    </ListItem>
                  );
                })}
              </List>
            </div>

            <div className={styles.divider}>
              <Icon icon="ChevronRight" color="muted" className={styles.dividerIcon} />
            </div>

            <div>
              <header className={styles.header}>
                <Tag tagType="muted">New type</Tag>
                <Subheading>{selectedPlan.name}</Subheading>
              </header>
              <List>
                {resourcesToDisplay.map(({ name, id }) => {
                  let tooltipText = '';
                  // get tooltips texts for env, records and role
                  ['role'].includes(id)
                    ? (tooltipText = getRolesTooltip(
                        selectedPlanResources[id],
                        selectedPlan.roleSet
                      ))
                    : (tooltipText = getTooltip(id, selectedPlanResources[id]));

                  return (
                    <ListItem key={id} className={styles.listItem}>
                      <Icon icon="CheckCircle" color="positive" className={styles.icon} />{' '}
                      <Tooltip place="top" content={tooltipText}>
                        <span className={tooltipText && styles.tooltipPointer}>
                          {shorten(selectedPlanResources[id])} {name}
                        </span>
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </List>
            </div>
          </Grid>
        </Card>
        <Flex justifyContent="space-between" alignItems="center" marginTop="spacingL">
          <Button buttonType="muted" onClick={onPrev} disabled={inProgress} icon="ChevronLeft">
            Go back
          </Button>
          <Button buttonType="positive" onClick={onNext} loading={inProgress}>
            Confim and change
          </Button>
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
