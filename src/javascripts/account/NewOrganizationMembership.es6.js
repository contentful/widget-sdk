import {omit, pick, negate, trim, sortedUniq, sortBy, get as getAtPath} from 'lodash';
import {h} from 'ui/Framework';
import { assign } from 'utils/Collections';
import {getOrganization} from 'services/TokenStore';
import * as RoleRepository from 'RoleRepository';
import {runTask} from 'utils/Concurrent';
import {ADMIN_ROLE_ID} from 'access_control/SpaceMembershipRepository';
import {getUsers, getSpaces, createEndpoint} from 'access_control/OrganizationMembershipRepository';
import {makeCtor, match} from 'utils/TaggedValues';
import {invite, progress$} from 'account/SendOrganizationInvitation';
import {isValidEmail} from 'stringUtils';
import {go} from 'states/Navigator';
import client from 'client';
import {
  header,
  sidebar,
  emailsInput,
  organizationRole,
  accessToSpaces,
  progressMessage,
  errorMessage,
  successMessage
} from 'account/NewOrganizationMembershipTemplate';

const adminRole = {
  name: 'Admin',
  id: ADMIN_ROLE_ID
};
const maxNumberOfEmails = 100;
const defaultOrgRole = 'member';

const Idle = makeCtor('idle');
const Invalid = makeCtor('invalid'); // used to show form errors after user tried to submit
const InProgress = makeCtor('inProgress');
const Success = makeCtor('success');
const Failure = makeCtor('failure');

export default function ($scope) {
  let state = {
    orgSpacesCount: null,
    spaces: [],
    emails: [],
    emailsInputValue: '',
    invalidAddresses: [],
    orgRole: defaultOrgRole,
    spaceMemberships: {},
    failedOrgInvitations: [],
    successfulOrgInvitations: [],
    status: Idle(),
    organization: {}
  };

  const actions = {
    updateSpaceRole,
    updateOrgRole,
    updateEmails,
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

  runTask(function* () {
    // 1st step - get org ingo and render page without the spaces grid
    const organization = yield* getOrgInfo(orgId);
    state = assign(state, {organization});
    rerender();

    // 2nd step - load the spaces and assign spaces count
    const orgSpaces = yield getOrgSpaces(organization.spaceLimit);
    state = assign(state, {orgSpacesCount: orgSpaces.total});
    rerender();

    // 3rd step - load all space roles
    orgSpaces.items
      .map(space => client.newSpace(space)) // workaround necessary to fetch space roles
      .forEach(setSpaceRoles);
  });

  function setSpaceRoles (space) {
    runTask(function* () {
      const roles = yield RoleRepository.getInstance(space).getAll();
      const spaceRoles = roles.map(role => ({
        name: role.name,
        id: role.sys.id,
        spaceId: role.sys.space.sys.id
      }));

      state = assign(state, {spaces: [
        ...state.spaces, {
          id: space.data.sys.id,
          createdAt: space.data.sys.createdAt,
          name: space.data.name,
          roles: sortBy(spaceRoles, role => role.name)
        }
      ]});
      rerender();
    });
  }

  function updateSpaceRole (checked, role, spaceMemberships) {
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

  function updateOrgRole (checked, role) {
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
  function submitInvitations (evt) {
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

    if (
      emails.length &&
      emails.length <= maxNumberOfEmails &&
      emails.length <= organization.remainingInvitations &&
      !invalidAddresses.length
    ) {
      runTask(function* () {
        yield invite({
          emails,
          orgRole,
          spaceMemberships,
          suppressInvitation,
          orgId
        });
        const organization = yield* getOrgInfo(orgId);

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

    state = assign(state, {status});
    rerender();
  }

  /**
   * Toggle flag `suppressInvitation` that goes in the org invitation call.
   * This flag indicates whether or not we should send an email to the invited
   * users saying they were invited.
   */
  function toggleInvitationEmailOption () {
    state = assign(state, {
      suppressInvitation: !state.suppressInvitation
    });
  }

  /**
   * Restart the form, seting the status to `Idle`, and keeping the selected
   * orgRole and space roles.
   * It also enables to restart with a given list of emails.
   * @param {Array<String>} emails
   */
  function restart (emails = []) {
    state = assign(state, {
      emails: emails,
      emailsInputValue: emails.join(', '),
      status: Idle(),
      failedOrgInvitations: [],
      successfulOrgInvitations: [],
      // if re-trying to invite failed users, keep org role and space settings
      orgRole: emails.length ? state.orgRole : defaultOrgRole,
      spaceMemberships: emails.length ? state.spaceMemberships : {}
    });

    rerender();
  }

  /**
   * Navigate to organization users list
   */
  function goToList () {
    go({
      path: ['account', 'organizations', 'users', 'gatekeeper']
    });
  }
  /**
   * Receives a string with email addresses
   * separated by comma and transforms it into
   * an array of emails and, possibly, an array with
   * the invalid addresses.
   */
  function updateEmails (emailsInputValue) {
    const list = emailsInputValue
      .split(',')
      .map(trim)
      .filter(email => email.length);
    const emails = sortedUniq(list);
    const invalidAddresses = emails.filter(negate(isValidEmail));

    state = assign(state, {
      emailsInputValue,
      emails,
      invalidAddresses
    });

    rerender();
  }

  function rerender () {
    $scope.properties.context.ready = true;
    $scope.component = render(state, actions);
    $scope.$applyAsync();
  }

  /**
   * Add role id to the set of space roles that will be assigned to the users being invited
   * If the user is Admin, she/he cannot have other assigned roles, and vice-versa
   */
  function addRole (role, spaceRoles) {
    if (role.id === adminRole.id) {
      return [role.id];
    } else {
      return spaceRoles
        .filter((roleId) => roleId !== adminRole.id)
        .concat([role.id]);
    }
  }

  function removeRole (role, spaceRoles) {
    return spaceRoles.filter(id => id !== role.id);
  }

  function onProgressValue (email) {
    state = assign(state, {
      successfulOrgInvitations: [...state.successfulOrgInvitations, email]
    });
    rerender();
  }

  function onProgressError (email) {
    state.failedOrgInvitations.push(email);
  }

  /**
   * Gets org info from the token and makes a request to
   * organization users endpoint to get the `total` value.
   * This is a workaround for the token 15min cache that won't let
   * us get an updated number after an invitation request
   */
  function* getOrgInfo () {
    const org = yield getOrganization(orgId);
    const membershipLimit = getAtPath(org, 'subscriptionPlan.limits.permanent.organizationMembership');
    const spaceLimit = getAtPath(org, 'subscriptionPlan.limits.permanent.space');
    const users = yield getUsers(orgEndpoint, {limit: 0});
    const membershipsCount = users.total;

    return assign(state.organization, {
      membershipLimit,
      membershipsCount,
      spaceLimit,
      hasSsoEnabled: org.hasSsoEnabled,
      remainingInvitations: membershipLimit - membershipsCount
    });
  }

  function getOrgSpaces (limit) {
    return getSpaces(orgEndpoint, {limit});
  }
}

function render (state, actions) {
  return h('.workbench', [
    header(),
    h('form.workbench-main', {
      dataTestId: 'organization-membership.form',
      onSubmit: actions.submitInvitations
    }, [
      h('.workbench-main__content', {
        style: { padding: '2rem 3.15rem' }
      }, [
        match(state.status, {
          [Success]: () => successMessage(state.emails, state.successfulOrgInvitations, actions.restart, actions.goToList),
          [Failure]: () => errorMessage(state.failedOrgInvitations, actions.restart),
          [InProgress]: () => progressMessage(state.emails, state.successfulOrgInvitations),
          _: () => h('', [
            emailsInput(
              maxNumberOfEmails,
              Invalid,
              pick(state, ['emails', 'emailsInputValue', 'invalidAddresses', 'organization', 'status']),
              pick(actions, ['updateEmails'])
            ),
            organizationRole(state.orgRole, actions.updateOrgRole),
            accessToSpaces(
              adminRole,
              pick(state, ['spaces', 'orgSpacesCount', 'spaceMemberships']),
              pick(actions, ['updateSpaceRole'])
            )
          ])
        })
      ]),
      sidebar(
        {Idle, Invalid},
        pick(state, ['status', 'organization', 'suppressInvitation']),
        pick(actions, ['toggleInvitationEmailOption'])
      )
    ])
  ]);
}
