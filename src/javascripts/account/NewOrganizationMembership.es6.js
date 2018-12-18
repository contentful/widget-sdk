import { omit, pick, negate, trim, sortedUniq, isObject, get } from 'lodash';
import { h } from 'ui/Framework';
import { assign } from 'utils/Collections.es6';
import { getOrganization } from 'services/TokenStore.es6';
import { runTask } from 'utils/Concurrent.es6';
import { ADMIN_ROLE_ID } from 'access_control/SpaceMembershipRepository.es6';
import { createOrganizationEndpoint as createEndpoint } from 'data/EndpointFactory.es6';
import {
  getUsers,
  getAllSpaces,
  getAllRoles
} from 'access_control/OrganizationMembershipRepository.es6';
import { makeCtor, match } from 'utils/TaggedValues.es6';
import {
  sendInvites,
  createOrgMemberships,
  progress$
} from 'account/SendOrganizationInvitation.es6';
import { isValidEmail } from 'utils/StringUtils.es6';
import { go } from 'states/Navigator.es6';
import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import {
  header,
  sidebar,
  emailsInput,
  organizationRole,
  accessToSpaces,
  progressMessage,
  errorMessage,
  successMessage
} from 'account/NewOrganizationMembershipTemplate.es6';
import createResourceService from 'services/ResourceService.es6';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';
import * as featureFlags from 'featureFlags.es6';

// Start: For Next Steps for a TEA space (a space created using the example space template)
import { track, updateUserInSegment } from 'analytics/Analytics.es6';
import $state from '$state';
import { getStore } from 'TheStore';
const GROUP_ID = 'tea_onboarding_steps';
const store = getStore('local');
// End: For Next Steps for a TEA space (a space created using the example space template)

const adminRole = {
  name: 'Admin',
  id: ADMIN_ROLE_ID
};
const maxNumberOfEmails = 100;
const defaultOrgRole = 'member';

const Loading = makeCtor('loading');
const Idle = makeCtor('idle');
const Invalid = makeCtor('invalid'); // used to show form errors after user tried to submit
const InProgress = makeCtor('inProgress');
const Success = makeCtor('success');
const Failure = makeCtor('failure');

export default function($scope) {
  let state = {
    spaces: [],
    emails: [],
    emailsInputValue: '',
    invalidAddresses: [],
    orgRole: defaultOrgRole,
    spaceMemberships: {},
    suppressInvitation: false,
    failedOrgInvitations: [],
    successfulOrgInvitations: [],
    status: Loading(),
    organization: {},
    metadata: {}
  };

  const actions = {
    updateSpaceRole,
    updateOrgRole,
    updateEmails,
    validateEmails,
    toggleInvitationEmailOption,
    restart,
    goToList,
    submitInvitations
  };

  const orgId = $scope.properties.orgId;
  const orgEndpoint = createEndpoint(orgId);

  progress$.onValue(onProgressValue);
  progress$.onError(onProgressError);

  $scope.component = h('noscript');
  $scope.$on('$destroy', () => {
    progress$.offValue(onProgressValue);
    progress$.offError(onProgressError);
  });

  runTask(function*() {
    const organization = yield getOrganization(orgId);
    const canAccess = isOwnerOrAdmin(organization);

    if (!canAccess) {
      denyAccess();
      return;
    }

    // 1st step - get org and user info and render page without the spaces grid
    const metadata = yield* getOrgInfo();
    state = assign(state, { metadata, organization, isOwner: isOwner(organization) });

    rerender();

    // 2nd step - load all space roles
    const orgRoles = yield* getAllSpacesWithRoles();
    state = assign(state, {
      spaces: orgRoles,
      status: Idle()
    });
    rerender();

    // 3rd step - get feature flag for invitations
    const useLegacy = !(yield getCurrentVariation(featureFlags.BV_USER_INVITATIONS));
    state = assign(state, {
      useLegacy
    });
    rerender();
  });

  function* getAllSpacesWithRoles() {
    const sortByName = (role, previous) => role.name.localeCompare(previous.name);
    const allRoles = yield getAllRoles(orgEndpoint);
    // get a map of roles by spaceId
    const rolesBySpace = allRoles.reduce((acc, role) => {
      const spaceId = role.sys.space.sys.id;
      if (!acc[spaceId]) {
        acc[spaceId] = [];
      }
      acc[spaceId].push({
        name: role.name,
        id: role.sys.id,
        spaceId: role.sys.space.sys.id
      });
      return acc;
    }, {});
    const allSpaces = yield getAllSpaces(orgEndpoint);

    return allSpaces
      .map(space => ({
        id: space.sys.id,
        createdAt: space.sys.createdAt,
        name: space.name,
        roles: rolesBySpace[space.sys.id] ? rolesBySpace[space.sys.id].sort(sortByName) : []
      }))
      .sort(sortByName);
  }

  function updateSpaceRole(checked, role, spaceMemberships) {
    const spaceRoles = spaceMemberships[role.spaceId] || [];
    let newSpaceRoles;
    let updatedMemberships;

    if (checked) {
      newSpaceRoles = addRole(role, spaceRoles);
    } else {
      newSpaceRoles = removeRole(role, spaceRoles);
    }

    if (newSpaceRoles.length) {
      updatedMemberships = assign(state.spaceMemberships, {
        [role.spaceId]: newSpaceRoles
      });
    } else {
      // remove property if there are no roles left in it
      updatedMemberships = omit(state.spaceMemberships, [role.spaceId]);
    }

    state = assign(state, {
      spaceMemberships: updatedMemberships
    });

    rerender();
  }

  function updateOrgRole(checked, role) {
    if (checked) {
      state = assign(state, {
        orgRole: role
      });
      rerender();
    }
  }

  /**
   * Send invitations to the organization to all emails in the form
   * If the org invitation succeeds (or if it fails with 422 (taken), automatically
   * proceeds to invite the user to all selected spaces with respective roles
   */
  function submitInvitations(evt) {
    evt.preventDefault();

    let status;
    const {
      orgRole,
      emails,
      invalidAddresses,
      failedOrgInvitations,
      spaceMemberships,
      suppressInvitation,
      organization
    } = state;

    let isInputValid =
      emails.length && emails.length <= maxNumberOfEmails && !invalidAddresses.length;
    if (isInputValid && organization.membershipLimit) {
      const { membershipUsage, membershipLimit } = organization;
      isInputValid = emails.length <= membershipLimit - membershipUsage;
    }

    const { hasSsoEnabled } = organization;

    if (isInputValid) {
      runTask(function*() {
        // If the org is SSO enabled, we create the org membership directly rather than
        // inviting the user
        const invitationMetadata = {
          emails,
          orgRole,
          spaceMemberships,
          suppressInvitation,
          orgId
        };

        if (hasSsoEnabled) {
          yield createOrgMemberships(invitationMetadata);
        } else {
          yield sendInvites(invitationMetadata);
        }

        const organization = yield* getOrgInfo(orgId);

        // Start: For Next Steps for a TEA space (a space created using the example space template)
        const inviteTrackingKey = `ctfl:${orgId}:progressTEA:inviteDevTracking`;

        const pendingInvitesForTEA = store.get(inviteTrackingKey);

        if (isObject(pendingInvitesForTEA)) {
          track('element:click', {
            elementId: 'invite_users',
            groupId: GROUP_ID,
            fromState: $state.current.name,
            spaceId: pendingInvitesForTEA.spaceId,
            organizationId: orgId
          });

          // track in intercom
          updateUserInSegment({
            teaOnboardingInvitedUsers: true
          });

          store.remove(inviteTrackingKey);
        }
        // End: For Next Steps for a TEA space (a space created using the example space template)

        state = assign(state, {
          status: failedOrgInvitations.length ? Failure() : Success(),
          organization
        });

        rerender();
      });

      status = InProgress();
    } else {
      status = Invalid();
    }

    state = assign(state, { status });
    rerender();
  }

  /**
   * Toggle flag `suppressInvitation` that goes in the org invitation call.
   * This flag indicates whether or not we should send an email to the invited
   * users saying they were invited.
   */
  function toggleInvitationEmailOption() {
    state = assign(state, {
      suppressInvitation: !state.suppressInvitation
    });
    rerender();
  }

  /**
   * Restart the form, seting the status to `Idle`, and keeping the selected
   * orgRole and space roles.
   * It also enables to restart with a given list of emails.
   * @param {Array<String>} emails
   */
  function restart(emails = []) {
    state = assign(state, {
      emails,
      emailsInputValue: emails.join(', '),
      status: Idle(),
      failedOrgInvitations: [],
      successfulOrgInvitations: [],
      // if re-trying to invite failed users, keep org role and space settings
      suppressInvitation: emails.length ? state.suppressInvitation : false,
      orgRole: emails.length ? state.orgRole : defaultOrgRole,
      spaceMemberships: emails.length ? state.spaceMemberships : {}
    });

    rerender();
  }

  /**
   * Navigate to organization users list
   */
  function goToList() {
    go({
      path: ['account', 'organizations', 'users', 'list']
    });
  }
  /**
   * Receives a string with email addresses
   * separated by comma and transforms it into
   * an array of emails.
   */
  function updateEmails(emailsInputValue) {
    const list = emailsInputValue
      .split(',')
      .map(trim)
      .filter(email => email.length);
    const emails = sortedUniq(list);

    state = assign(state, {
      emailsInputValue,
      emails
    });

    rerender(false);
  }

  /**
   * Update state with invalid emails addresses
   */
  function validateEmails() {
    const invalidAddresses = state.emails.filter(negate(isValidEmail));

    state = assign(state, { invalidAddresses });
    rerender();
  }

  function rerender(renderAsync = true) {
    $scope.properties.context.ready = true;
    $scope.component = render(state, actions);
    renderAsync ? $scope.$applyAsync() : $scope.$apply();
  }

  function denyAccess() {
    $scope.properties.context.forbidden = true;
    $scope.$applyAsync();
  }

  /**
   * Add role id to the set of space roles that will be assigned to the users being invited
   * If the user is Admin, she/he cannot have other assigned roles, and vice-versa
   */
  function addRole(role, spaceRoles) {
    if (role.id === adminRole.id) {
      return [role.id];
    } else {
      return spaceRoles.filter(roleId => roleId !== adminRole.id).concat([role.id]);
    }
  }

  function removeRole(role, spaceRoles) {
    return spaceRoles.filter(id => id !== role.id);
  }

  function onProgressValue(email) {
    state = assign(state, {
      successfulOrgInvitations: [...state.successfulOrgInvitations, email]
    });
    rerender();
  }

  function onProgressError(email) {
    state.failedOrgInvitations.push(email);
  }

  /**
   * Gets org info from the token and makes a request to
   * organization users endpoint to get the `total` value.
   * This is a workaround for the token 15min cache that won't let
   * us get an updated number after an invitation request.
   */
  function* getOrgInfo() {
    const org = yield getOrganization(orgId);

    const resourceService = createResourceService(orgId, 'organization');
    const orgMembershipResource = yield resourceService.get('organization_membership');
    const pendingInvitationResource = yield resourceService.get('pending_invitation');
    const membershipLimit = get(orgMembershipResource, 'limits.maximum');

    const useLegacy = !(yield getCurrentVariation(featureFlags.BV_USER_INVITATIONS));

    // We cannot rely on usage data from organization (token) since the cache
    // is not invalidated on user creation.
    // We should use resources API later when it's available for org memberships.
    const users = yield getUsers(orgEndpoint, { limit: 0 });
    const invitationLimit = membershipLimit;
    let invitationUsage;

    if (useLegacy) {
      invitationUsage = users.total;
    } else {
      invitationUsage = users.total + pendingInvitationResource.usage;
    }

    return {
      invitationUsage,
      invitationLimit,
      hasSsoEnabled: org.hasSsoEnabled
    };
  }
}

function render(state, actions) {
  return h('.workbench', [
    header(),
    h(
      'form.workbench-main',
      {
        dataTestId: 'organization-membership.form',
        onSubmit: actions.submitInvitations
      },
      [
        h(
          '.workbench-main__content',
          {
            style: { padding: '2rem 3.15rem' }
          },
          [
            match(state.status, {
              [Success]: () => successMessage(state.successfulOrgInvitations, actions.goToList),
              [Failure]: () =>
                h('', [
                  errorMessage(state.useLegacy, state.failedOrgInvitations, actions.restart),
                  state.successfulOrgInvitations.length > 0 &&
                    successMessage(
                      state.successfulOrgInvitations,
                      actions.restart,
                      actions.goToList
                    )
                ]),
              [InProgress]: () => progressMessage(state.emails, state.successfulOrgInvitations),
              _: () =>
                h('', [
                  emailsInput(
                    maxNumberOfEmails,
                    Invalid,
                    pick(state, [
                      'emails',
                      'emailsInputValue',
                      'invalidAddresses',
                      'metadata',
                      'status'
                    ]),
                    pick(actions, ['updateEmails', 'validateEmails'])
                  ),
                  organizationRole(state.orgRole, state.isOwner, actions.updateOrgRole),
                  accessToSpaces(
                    Loading,
                    adminRole,
                    pick(state, ['status', 'spaces', 'spaceMemberships']),
                    pick(actions, ['updateSpaceRole'])
                  )
                ])
            })
          ]
        ),
        sidebar(
          { Idle, Invalid },
          pick(state, ['status', 'organization', 'metadata', 'suppressInvitation']),
          pick(actions, ['toggleInvitationEmailOption'])
        )
      ]
    )
  ]);
}
