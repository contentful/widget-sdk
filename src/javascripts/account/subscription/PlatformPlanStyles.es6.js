import {byName as colors} from 'Styles/Colors';
import {default as iconTeamEdition} from 'svg/pricing-plan-team_edition';

export function getPlatformPlanStyle (typeName) {
  // TODO other plans :-)
  if (typeName === 'team-edition') {
    return makePlatformPlan(iconTeamEdition, colors.greenMid, colors.greenDark);
  }
  return {};
}

function makePlatformPlan (icon, color, colorDark) {
  return {
    icon,
    bar: {backgroundColor: color, borderColor: colorDark}
  };
}
