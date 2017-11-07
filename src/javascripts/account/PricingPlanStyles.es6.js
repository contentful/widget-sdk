import {makeSum} from 'libs/sum-types';
import {byName as colors} from 'Styles/Colors';
import {default as iconTeamEdition} from 'svg/pricing-plan-team_edition';

export const PricingPlan = makeSum({
  // TODO other plans :-)
  TeamEdition: ['icon', 'bar'],
  Other: []
});

export function getPricingPlanStyle (typeName) {
  if (typeName === 'team-edition') {
    return PricingPlan.TeamEdition(
      iconTeamEdition,
      {backgroundColor: colors.greenMid, borderColor: colors.greenDark}
    );
  }
  return PricingPlan.Other();
}
