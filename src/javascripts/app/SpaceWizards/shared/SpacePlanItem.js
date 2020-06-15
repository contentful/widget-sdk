import React from 'react';
import PropTypes from 'prop-types';
import { camelCase } from 'lodash';
import { css, cx } from 'emotion';
import { Tooltip, Icon, Card, Subheading } from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import PlanFeatures from '../shared/PlanFeatures';
import { Pluralized, Price } from 'core/components/formatting';

const getPlanBGColor = (backgroundColor) => {
  return css({
    '&:before': {
      backgroundColor,
    },
  });
};

const styles = {
  helpIcon: css({
    fill: tokens.colorElementDarkest,
    marginBottom: '-3px',
    marginLeft: tokens.spacingXs,
  }),

  planCard: css({
    position: 'relative',
    paddingLeft: tokens.spacingXl,
    marginBottom: tokens.spacingM,
    cursor: 'pointer',
    transition: 'all ease-in-out 0.1s',
    '&:last-child': {
      marginBottom: 0,
    },
    '&:before': {
      content: '""',
      position: 'absolute',
      width: tokens.spacingXs,
      height: '100%',
      top: 0,
      left: 0,
      backgroundColor: tokens.colorElementLight,
    },
  }),

  plans: {
    free: getPlanBGColor(tokens.colorElementLight),
    micro: getPlanBGColor(tokens.colorOrangeMid),
    small: getPlanBGColor(tokens.colorRedLight),
    medium: getPlanBGColor(tokens.colorBlueLight),
    large: getPlanBGColor(tokens.colorGreenLight),
    partnerSpacePlan: getPlanBGColor(tokens.colorBlueBase),
    proofOfConcept: getPlanBGColor(tokens.colorBlueBase),
  },

  currentPlan: css({
    '&:after': {
      content: `"Current"`, // the content property needs the extra ""
      backgroundColor: tokens.colorElementMid,
      position: 'absolute',
      top: 'calc(50% - 14px)', // 14px is half the height of this tag
      right: '-20px',
      padding: `${tokens.spacingXs} ${tokens.spacingS}`,
      color: tokens.colorWhite,
      fontSize: tokens.fontSizeS,
      fontWeight: tokens.fontWeightDemiBold,
      lineHeight: 1,
      textTransform: 'uppercase',
      borderRadius: '2px',
    },
  }),

  recommendedPlan: css({
    '&:after': {
      content: `"Recommended"`, // the content property needs the extra ""
      backgroundColor: tokens.colorBlueBase,
      position: 'absolute',
      top: 'calc(50% - 14px)', // 14px is half the height of this tag
      right: '-20px',
      padding: `${tokens.spacingXs} ${tokens.spacingS}`,
      color: tokens.colorWhite,
      fontSize: tokens.fontSizeS,
      fontWeight: tokens.fontWeightDemiBold,
      lineHeight: 1,
      textTransform: 'uppercase',
      borderRadius: '2px',
    },
  }),

  disabled: css({
    cursor: 'not-allowed !important',
    color: tokens.colorTextLightest,
    '& h2': {
      color: tokens.colorTextLightest,
    },
    '&:before': {
      opacity: 0.3,
    },
    '&:hover': {
      border: '1px solid #d3dce0',
    },
  }),

  headingContainer: css({
    display: 'flex',
    alignItems: 'center',
    fontSize: tokens.fontSizeL,
    '& h2': {
      marginBottom: 0,
      marginRight: tokens.spacingXs,
    },
  }),

  arrowIconColumn: css({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: '100%',
  }),
};

export default function SpacePlanItem(props) {
  const {
    plan,
    isSelected,
    isRecommended,
    freeSpacesResource,
    isPayingOrg,
    onSelect,
    isCommunityPlanEnabled,
  } = props;
  const freeSpacesLimit = freeSpacesResource && freeSpacesResource.limits.maximum;

  // We should not show the chevron in the following cases:
  // - the plan is disabled
  // - the plan is not free, and the org is not paying
  const showChevron = plan.disabled ? false : plan.isFree ? true : isPayingOrg ? true : false;

  const tooltipContent = isCommunityPlanEnabled ? (
    <>
      You have <Pluralized text="free community space" count={freeSpacesLimit} /> for your
      organization. If you delete a community space, you can create another one.
    </>
  ) : (
    <>
      You can have up to <Pluralized text="free space" count={freeSpacesLimit} /> for your
      organization. If you delete a free space, another one can be created.
    </>
  );

  const handleClick = () => !plan.disabled && onSelect(plan);

  return (
    <Card
      className={cx(styles.planCard, styles.plans[camelCase(plan.name)], {
        [styles.currentPlan]: plan.current,
        [styles.recommendedPlan]: isRecommended,
        [styles.disabled]: plan.disabled,
      })}
      selected={isSelected}
      onClick={handleClick}
      testId="space-plan-item">
      <Grid columns="auto 18px" columnGap="spacingS">
        <div data-test-id="contents">
          <div className={styles.headingContainer}>
            <Subheading element="h2" testId="space-plan-name">
              {plan.name}
            </Subheading>

            {plan.price > 0 && (
              <span data-test-id="space-plan-price">
                <Price value={plan.price} unit="month" />
              </span>
            )}

            {plan.isFree && freeSpacesLimit && (
              <>
                <Pluralized text="free space" count={freeSpacesLimit} />
                <Tooltip content={tooltipContent}>
                  <Icon icon="HelpCircle" className={styles.helpIcon} />
                </Tooltip>
              </>
            )}
          </div>

          <PlanFeatures resources={plan.includedResources} roleSet={plan.roleSet} />
        </div>
        <div className={styles.arrowIconColumn}>
          {showChevron && <Icon testId="plan-chevron" icon="ChevronRight" color="muted" />}
        </div>
      </Grid>
    </Card>
  );
}

SpacePlanItem.propTypes = {
  plan: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  freeSpacesResource: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  isPayingOrg: PropTypes.bool.isRequired,
  isCommunityPlanEnabled: PropTypes.bool,
  isRecommended: PropTypes.bool,
};
