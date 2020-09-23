import pluralize from 'pluralize';
import { joinWithAnd } from 'utils/StringUtils';

export function getRolesTooltip(limit, roleSet) {
  const roles = ['Admin', ...roleSet.roles];
  // all roles joined by comma and `and`
  const rolesString = joinWithAnd(roles);
  const pluralized = pluralize('role', roles.length);
  const hasAdminOnly = limit === 1;

  // has many translator roles
  const translator = 'Translator';
  const translatorRolesCount = roles.filter((name) => name.includes(translator)).length;
  const withoutTranslator = roles.filter((name) => !name.includes(translator)).join(', ');
  const hasMultipleTranslators = translatorRolesCount > 1;

  // has limits greater than number of roles in role set
  const hasCustomRoles = limit > roles.length;
  const customRolesNumber = limit - roles.length;
  const customRolesString = `${customRolesNumber > 1 ? customRolesNumber : ''} ${pluralize(
    'custom roles',
    customRolesNumber
  )}`;

  const intro = 'This space type includes the';

  if (hasAdminOnly) {
    return `${intro} Admin role only`;
  } else if (hasMultipleTranslators) {
    // e.g. [...] Admin, Editor, and 10 Translator roles
    return `${intro} ${withoutTranslator}, and ${translatorRolesCount} Translator roles`;
  } else if (hasCustomRoles) {
    // e.g. [...] Admin, Editor, and an additional 10 custom roles
    return `${intro} ${rolesString} ${pluralized} and an additional ${customRolesString}`;
  } else {
    // e.g. [...] Admin, Editor, and Translator roles
    return `${intro} ${rolesString} ${pluralized}`;
  }
}
