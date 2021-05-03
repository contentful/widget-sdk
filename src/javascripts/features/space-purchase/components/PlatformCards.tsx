import React from 'react';

import { EVENTS } from '../utils/analyticsTracking';
import { PLATFORM_CONTENT, PlatformKind } from '../utils/platformContent';
import { ProductCard } from './ProductCard';
import { EnterpriseCard } from './EnterpriseCard';
import { CONTACT_SALES_HREF } from './EnterpriseTalkToUsButton';

import type { State } from '../context';
import type { SpaceProductRatePlan } from '../types';

interface PlatformCardsProps {
  organizationId?: string;
  composeAndLaunchProductRatePlan?: State['composeAndLaunchProductRatePlan'];
  canCreatePaidSpace?: boolean;
  selectedPlan?: State['selectedPlan'];
  selectedPlatform?: State['selectedPlatform'];
  disabled?: boolean;
  onSelectPlatform: (platform?: State['selectedPlatform']) => void;
  track: (eventName: string, metadata: unknown) => void;
}

export function PlatformCards({
  organizationId,
  composeAndLaunchProductRatePlan,
  canCreatePaidSpace,
  selectedPlan,
  selectedPlatform,
  disabled = false,
  onSelectPlatform,
  track,
}: PlatformCardsProps) {
  return (
    <>
      {Object.values(PLATFORM_CONTENT).map((platform, idx) => {
        const selectedPlanIsFree =
          (selectedPlan as SpaceProductRatePlan)?.productPlanType === 'free_space';
        const platformIsComposeLaunch = platform.type === PlatformKind.WEB_APP_COMPOSE_LAUNCH;
        const composeAndLaunchIsLoading =
          platformIsComposeLaunch && !composeAndLaunchProductRatePlan;

        const tooltipText =
          platformIsComposeLaunch && !composeAndLaunchIsLoading
            ? getTooltipText(canCreatePaidSpace, selectedPlanIsFree)
            : '';

        const platformPlan = {
          ...platform,
          // in the Web app + Compose + Launch card we need to pass the price that we get from the backend
          ...(platformIsComposeLaunch && {
            price: composeAndLaunchProductRatePlan?.price,
          }),
        };

        return (
          <ProductCard
            key={idx}
            cardType="platform"
            disabled={disabled || !!tooltipText || composeAndLaunchIsLoading}
            selected={selectedPlatform?.title === platform.title}
            current={!platformIsComposeLaunch}
            onClick={() => onSelectPlatform(platformPlan)}
            tooltipText={tooltipText}
            loading={composeAndLaunchIsLoading}
            content={platformPlan}
            isNew={platformIsComposeLaunch}
            testId="platform-card"
          />
        );
      })}

      <EnterpriseCard
        disabled={disabled}
        organizationId={organizationId}
        onSelect={() =>
          track(EVENTS.EXTERNAL_LINK_CLICKED, {
            href: CONTACT_SALES_HREF,
            intent: 'upgrade_to_enterprise',
          })
        }
      />
    </>
  );
}

function getTooltipText(canCreatePaidSpace, selectedPlanIsFree) {
  // If they cannot create a paid space, then they cannot pay for compose+launch either
  if (!canCreatePaidSpace) {
    return `Please contact your organization owner and have them add billing information for your organization so you can purchase ${PLATFORM_CONTENT.COMPOSE_AND_LAUNCH.title}`;
  }

  if (selectedPlanIsFree) {
    return 'You need a paid space to use Compose + Launch';
  }

  return '';
}