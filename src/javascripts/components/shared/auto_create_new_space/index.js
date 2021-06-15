import * as K from 'core/utils/kefir';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { combine, getValue } from 'core/utils/kefir';
import { user$, spacesByOrganization$ as spacesByOrg$ } from 'services/TokenStore';
import { organizations$ } from 'services/TokenStore';
import { getSpaceAutoCreatedKey } from './getSpaceAutoCreatedKey';
import {
  getFirstOwnedOrgWithoutSpaces,
  hasAnOrgWithSpaces,
  ownsAtleastOneOrg,
  getCurrOrg,
  isUserOrgCreator,
} from 'data/User';
import { create } from 'components/shared/auto_create_new_space/CreateModernOnboarding';
import { isDeveloper as checkIfDeveloper, goToDeveloperOnboarding } from 'features/onboarding';
import { router } from 'core/react-routing';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { getSpaceContext } from 'classes/spaceContext';

let creatingSampleSpace = false;

const enabledBus = K.createPropertyBus(true);
const enabled$ = enabledBus.property;

export function disable() {
  enabledBus.set(false);
}

export function enable() {
  enabledBus.set(true);
}

export function resetCreatingSampleSpace() {
  creatingSampleSpace = false;
}

/**
 * @description
 * Auto creates a space using the product catalogue template
 * for a qualified user.
 * It's called on EmptyHomeRouter when the first route is loaded after a user is logged in.
 */
export function init() {
  const store = getBrowserStorage();
  combine([user$, spacesByOrg$, enabled$])
    .filter(([user, spacesByOrg, enabled]) => {
      return (
        enabled &&
        user &&
        spacesByOrg &&
        qualifyUser(user, spacesByOrg, store) &&
        !creatingSampleSpace
      );
    })
    .onValue(async ([user, spacesByOrg]) => {
      const org = getFirstOwnedOrgWithoutSpaces(user, spacesByOrg);
      creatingSampleSpace = true;

      const isPreAssignEnabled = await getVariation(FLAGS.PREASSIGN_ONBOARDING_FLOW, {
        organization: org.sys.id,
      });
      const isDeveloper = await checkIfDeveloper();

      if (isPreAssignEnabled && isDeveloper) {
        goToDeveloperOnboarding({
          markOnboarding,
          org,
        });
      } else {
        create({
          markOnboarding,
          onDefaultChoice: () => startAppsTrial(org.sys.id),
          org,
          user,
        });
      }

      function markOnboarding(action = 'success') {
        store.set(getSpaceAutoCreatedKey(user, action), true);
      }
    });
}

function qualifyUser(user, spacesByOrg, store) {
  return (
    !attemptedSpaceAutoCreation(user, store) && // no auto space creation was attempted
    currentUserIsCurrentOrgCreator(user) && // current user created the current org aka Pioneer User
    !hasAnOrgWithSpaces(spacesByOrg) && // user has no space memberships in any org that they are a member of
    ownsAtleastOneOrg(user) // user owns atleast one org
  );
}

function currentUserIsCurrentOrgCreator(user) {
  const spaceContext = getSpaceContext();
  const organizationId = spaceContext.getData('organization.sys.id');
  const orgs = getValue(organizations$);
  const currOrg = getCurrOrg(orgs, organizationId);

  return !!currOrg && isUserOrgCreator(user, currOrg);
}

function attemptedSpaceAutoCreation(user, store) {
  return (
    store.get(getSpaceAutoCreatedKey(user, 'success')) ||
    store.get(getSpaceAutoCreatedKey(user, 'failure'))
  );
}

function startAppsTrial(orgId) {
  router.navigate(
    {
      path: 'account.organizations.start_trial',
      orgId,
      navigationState: {
        existingUsers: false,
        from: 'content_choice_path',
      },
    },
    { location: 'replace' }
  );
}
