import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Card, Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { SpacePurchaseState } from 'features/space-purchase/context/index';
import { PLATFORM_TYPES } from 'features/space-purchase/utils/platformContent';
import {
  SPACE_PLANS_CONTENT,
  SPACE_PURCHASE_TYPES,
} from 'features/space-purchase/utils/spacePurchaseContent';
import { ProductCard } from './ProductCard';
import { canUserCreatePaidSpace, canOrgCreateFreeSpace } from '../utils/canCreateSpace';

const styles = {
  chooseLaterCard: css({
    gridColumn: '1 / 4',
    marginTop: tokens.spacingL,
    opacity: 1,
    transition: 'opacity 0.2s ease-in-out',
    '& p': { fontWeight: tokens.fontWeightMedium },
  }),
};

export const SpacePlanCards = ({ selectedPlatform, selectedSpacePlan, onSelect }) => {
  const {
    state: { subscriptionPlans, spaceRatePlans, freeSpaceResource, organization },
  } = useContext(SpacePurchaseState);

  const orgHasPaidSpaces = subscriptionPlans?.length > 0;
  const canCreateFreeSpace = canOrgCreateFreeSpace(freeSpaceResource);
  const canCreatePaidSpace = canUserCreatePaidSpace(organization);

  return (
    <>
      {SPACE_PLANS_CONTENT.filter(
        (content) => content.type !== SPACE_PURCHASE_TYPES.ENTERPRISE
      ).map((spacePlanContent, idx) => {
        const plan = spaceRatePlans.find((plan) => plan.name === spacePlanContent.type) ?? {};
        const content = formatSpacePlanContent(spacePlanContent, plan.price ?? 0);

        const tooltipText = getTooltipText(
          selectedPlatform,
          spacePlanContent.type,
          orgHasPaidSpaces,
          canCreateFreeSpace,
          canCreatePaidSpace
        );

        return (
          <ProductCard
            key={idx}
            cardType="space"
            loading={!spaceRatePlans}
            disabled={!selectedPlatform || !!tooltipText}
            tooltipText={tooltipText}
            selected={selectedSpacePlan === plan.name}
            onClick={() => onSelect(plan.name)}
            content={content}
            testId="space-plan-card"
          />
        );
      })}

      {/* The option to "choose space later" should only be shown when an org has paid spaces and 
      selects compose+launch, so they can buy compose+launch without having to buy a new space */}
      {orgHasPaidSpaces && selectedPlatform === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH && (
        <Card
          className={styles.chooseLaterCard}
          padding="large"
          testId="choose-space-later-button"
          onClick={() => onSelect('')}>
          <Heading element="p">Choose space later</Heading>
        </Card>
      )}
    </>
  );
};

SpacePlanCards.propTypes = {
  selectedPlatform: PropTypes.string,
  selectedSpacePlan: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

function formatSpacePlanContent(spacePlanContent, price) {
  return {
    title: spacePlanContent.title,
    description: spacePlanContent.description,
    price,
    limits: spacePlanContent.limits, // TODO: we need to use plan.inlcudedResources somehow
  };
}

function getTooltipText(
  selectedPlatform,
  planType,
  orgHasPaidSpaces,
  canCreateFreeSpace,
  canCreatePaidSpace
) {
  if (!selectedPlatform) {
    return '';
  }

  // freeSpace is disabled when selectedPlatform is SPACE+COMPOSE and they don't have any paid spaces
  if (
    planType === SPACE_PURCHASE_TYPES.COMMUNITY &&
    selectedPlatform === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH &&
    !orgHasPaidSpaces
  ) {
    return 'You must have a paid space to purchase Compose + Launch';
  }

  // freeSpace is disabled when user cannot make another freeSpace
  if (planType === SPACE_PURCHASE_TYPES.COMMUNITY && !canCreateFreeSpace) {
    return 'You have already used your free space';
  }

  // paidSpaces are disabled when user can't create a paid space
  if (planType !== SPACE_PURCHASE_TYPES.COMMUNITY && !canCreatePaidSpace) {
    return 'Please contact your organization owner and have them add billing information for your organization so you can purchase spaces';
  }

  return '';
}
