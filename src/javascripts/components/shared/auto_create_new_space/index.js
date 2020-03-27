import { getBrowserStorage } from 'core/services/BrowserStorage';
import { combine, getValue } from 'core/utils/kefir';
import { user$, spacesByOrganization$ as spacesByOrg$ } from 'services/TokenStore';
import createSampleSpace from './CreateSampleSpace';
import { organizations$ } from 'services/TokenStore';
import { getModule } from 'core/NgRegistry';
import { getSpaceAutoCreatedKey } from './getSpaceAutoCreatedKey';

import {
  getFirstOwnedOrgWithoutSpaces,
  hasAnOrgWithSpaces,
  ownsAtleastOneOrg,
  getCurrOrg,
  isUserOrgCreator,
} from 'data/User';

import { create } from 'components/shared/auto_create_new_space/CreateModernOnboarding';

const store = getBrowserStorage();

/**
 * @description
 * Auto creates a space using the product catalogue template
 * for a qualified user.
 * It is hooked up in the run block in application prelude.
 */
export function init() {
  let creatingSampleSpace = false;

  combine([user$, spacesByOrg$])
    .filter(
      ([user, spacesByOrg]) =>
        user && spacesByOrg && qualifyUser(user, spacesByOrg) && !creatingSampleSpace
    )
    .onValue(async ([user, spacesByOrg]) => {
      const org = getFirstOwnedOrgWithoutSpaces(user, spacesByOrg);

      create({
        markOnboarding,
        onDefaultChoice: async () => {
          const newSpace = await defaultChoice();

          store.set(
            `ctfl:${user.sys.id}:modernStackOnboarding:contentChoiceSpace`,
            newSpace.sys.id
          );
        },
        org,
        user,
      });

      creatingSampleSpace = true;

      async function defaultChoice() {
        // we swallow all errors, so auto creation modal will always have green mark
        const newSpace = await createSampleSpace(org).then(
          (createdSpace) => {
            store.set(getSpaceAutoCreatedKey(user, 'success'), true);

            return createdSpace;
          },
          () => {
            // serialize the fact that auto space creation failed to localStorage
            // to power any behaviour to work around the failure
            store.set(getSpaceAutoCreatedKey(user, 'failure'), true);
          }
        );

        creatingSampleSpace = false;

        return newSpace;
      }

      function markOnboarding(action = 'success') {
        store.set(getSpaceAutoCreatedKey(user, action), true);
      }
    });
}

function qualifyUser(user, spacesByOrg) {
  return (
    !attemptedSpaceAutoCreation(user) && // no auto space creation was attempted
    currentUserIsCurrentOrgCreator(user) && // current user created the current org aka Pioneer User
    !hasAnOrgWithSpaces(spacesByOrg) && // user has no space memberships in any org that they are a member of
    ownsAtleastOneOrg(user) // user owns atleast one org
  );
}

function currentUserIsCurrentOrgCreator(user) {
  const $stateParams = getModule('$stateParams');
  const orgId = $stateParams.orgId;
  const orgs = getValue(organizations$);
  const currOrg = getCurrOrg(orgs, orgId);

  return !!currOrg && isUserOrgCreator(user, currOrg);
}

function attemptedSpaceAutoCreation(user) {
  return (
    store.get(getSpaceAutoCreatedKey(user, 'success')) ||
    store.get(getSpaceAutoCreatedKey(user, 'failure'))
  );
}
