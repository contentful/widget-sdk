import {
  isFreePlan,
  isSelfServicePlan,
  isPartnerPlan,
  isProBonoPlan,
} from 'account/pricing/PricingDataProvider';
import type { BasePlan } from 'features/pricing-entities';
import { v1migrationDestinationNames } from 'classes/spaceContextTypes';
import { BasePlanNames } from '../components/V1MigrationNote';

export function generateBasePlanName(
  basePlan: BasePlan,
  v1migrationDestination?: v1migrationDestinationNames
) {
  let basePlanName;
  if (
    isFreePlan(basePlan) &&
    v1migrationDestination === v1migrationDestinationNames.V1_DESTINATION_COMMUNITY
  ) {
    basePlanName = BasePlanNames.COMMUNITY;
  } else if (
    isSelfServicePlan(basePlan) &&
    v1migrationDestination === v1migrationDestinationNames.V1_DESTINATION_TEAM
  ) {
    basePlanName = BasePlanNames.TEAM;
  } else if (
    isProBonoPlan(basePlan) &&
    v1migrationDestination === v1migrationDestinationNames.V1_DESTINATION_PRO_BONO
  ) {
    basePlanName = BasePlanNames.PRO_BONO;
  } else if (
    isPartnerPlan(basePlan) &&
    v1migrationDestination === v1migrationDestinationNames.V1_DESTINATION_PARTNER
  ) {
    basePlanName = BasePlanNames.PARTNER;
  }

  return basePlanName;
}
