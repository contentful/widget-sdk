import {byName as colors} from 'Styles/Colors';
import {default as iconTeamEdition} from 'svg/pricing-plan-team_edition';

export function getBasePlanStyle (key) {
  // TODO other plans :-)
  if (key === 'team-edition') {
    return makeBasePlan(iconTeamEdition, colors.greenMid, colors.greenDark);
  }
  return {};
}

function makeBasePlan (icon, color, colorDark) {
  return {
    icon,
    bar: {backgroundColor: color, borderColor: colorDark}
  };
}
