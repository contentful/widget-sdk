import React from 'react';
import NewUser from './NewUser';
import {
  render,
  cleanup,
  fireEvent,
  within,
  waitForElement,
  act,
  wait
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import {
  getAllSpaces,
  getAllRoles,
  invite,
  createOrgMembership
} from 'access_control/OrganizationMembershipRepository';
import ModalLauncher from 'app/common/ModalLauncher';
import { getVariation } from 'LaunchDarkly';
import { create as createSpaceMembershipRepo } from 'access_control/SpaceMembershipRepository';
import { createTeamMembership, getAllTeams } from 'access_control/TeamRepository';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';

const mockRoles = [
  {
    name: 'Editor',
    sys: {
      id: 'editorid',
      space: { sys: { id: '123' } }
    }
  },
  {
    name: 'Author',
    sys: {
      id: 'authorid',
      space: { sys: { id: '456' } }
    }
  }
];
const mockSpaces = [
  {
    name: 'Foo',
    sys: { id: '123' }
  },
  {
    name: 'Bar',
    sys: { id: '456' }
  }
];
const mockTeams = [
  {
    name: 'Super team',
    sys: { id: 'superteam' }
  },
  {
    name: 'The people',
    sys: { id: 'thepeople' }
  }
];
const mockTeamSpaceMemberships = [
  {
    admin: false,
    roles: [mockRoles[0]],
    sys: {
      space: mockSpaces[0],
      team: mockTeams[0]
    }
  }
];
const mockOrgMembership = { sys: { id: 'neworgmembership' } };
const mockOrgEndpoint = jest.fn().mockName('org endpoint');
const mockSpaceEndpoint = jest.fn().mockName('space endpoint');
const mockInviteToSpaceFn = jest.fn();
const mockOnReady = jest.fn();

jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn().mockName('create org endpoint'),
  createSpaceEndpoint: jest.fn()
}));

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllRoles: jest.fn(),
  getAllSpaces: jest.fn(),
  invite: jest.fn().mockResolvedValue({}),
  createOrgMembership: jest.fn()
}));

jest.mock('access_control/SpaceMembershipRepository', () => ({
  create: jest.fn()
}));

jest.mock('access_control/TeamRepository', () => ({
  createTeamMembership: jest.fn().mockResolvedValue({}),
  getAllTeams: jest.fn().mockResolvedValue(mockTeams),
  getAllTeamsSpaceMemberships: jest.fn().mockResolvedValue(mockTeamSpaceMemberships)
}));

describe('NewUser', () => {
  beforeEach(() => {
    mockInviteToSpaceFn.mockResolvedValue({});
    createOrganizationEndpoint.mockReturnValue(mockOrgEndpoint);
    createSpaceEndpoint.mockReturnValue(mockSpaceEndpoint);
    createSpaceMembershipRepo.mockReturnValue({
      invite: mockInviteToSpaceFn
    });
    getVariation.mockResolvedValue(false);
  });
  afterEach(() => {
    mockOnReady.mockReset();
    createOrgMembership.mockReset();
    mockInviteToSpaceFn.mockReset();
    createSpaceEndpoint.mockReset();
    createSpaceMembershipRepo.mockReset();
    createTeamMembership.mockReset();
    invite.mockReset();
    getVariation.mockReset();
    cleanup();
  });

  it('dismisses the loading state', () => {
    build();
    expect(mockOnReady).toHaveBeenCalled();
  });

  it('does not show the owner role as an option to non owners', () => {
    const { queryByLabelText } = build(false, false);
    expect(queryByLabelText('Owner')).toBeNull();
  });

  it('shows the owner role as an option to org owners', () => {
    const { getByLabelText } = build(false, true);
    expect(getByLabelText('Owner')).toBeVisible();
  });

  describe('validation fails', () => {
    it('validates the presence of at least one email addresses', async () => {
      const wrapper = build();
      const { emailsValidationMessage } = await submitForm(wrapper);
      expect(emailsValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
    });

    it('validates email addresses', async () => {
      const wrapper = build();
      const { emailsValidationMessage } = await submitForm(wrapper, 'invalid@');
      expect(emailsValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
    });

    it('validates the maximum number of email addresses', async () => {
      const wrapper = build();
      const emails = generateAddresses(101);
      const { emailsValidationMessage } = await submitForm(wrapper, emails);
      expect(emailsValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
    });

    it('validates that an org role was selected', async () => {
      const wrapper = build();
      const { orgRoleValidationMessage } = await submitForm(wrapper, 'john.doe@contentful.com', '');
      expect(orgRoleValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
    });

    it('it fails to send if a space role is not selected', async () => {
      const wrapper = build();
      const { spaceMembershipsValidationMessage } = await submitForm(
        wrapper,
        'expect@topass.com',
        'Member',
        [{ spaceName: 'Foo', roleNames: [] }]
      );

      expect(invite).not.toHaveBeenCalled();
      expect(spaceMembershipsValidationMessage).toBeVisible();
    });
  });

  describe('validation passes', () => {
    it('sends an invitation request', async () => {
      const wrapper = build();
      await submitForm(wrapper, ['john.doe@enterprise.com'], 'Owner', [
        { spaceName: 'Foo', roleNames: ['Editor'] }
      ]);
      await wait(() => wrapper.getByTestId('new-user.done'));
      expect(invite).toHaveBeenCalledWith(mockOrgEndpoint, {
        role: 'owner',
        email: 'john.doe@enterprise.com',
        spaceInvitations: [{ spaceId: '123', admin: false, roleIds: ['editorid'] }],
        teamInvitations: []
      });
    });

    it('sends requests to 100 addresses', async () => {
      const wrapper = build();
      const emails = generateAddresses(100);
      const {
        emailsValidationMessage,
        orgRoleValidationMessage,
        spaceMembershipsValidationMessage
      } = await submitForm(wrapper, emails, 'Member', [
        { spaceName: 'Foo', roleNames: ['Editor'] }
      ]);
      await wait(() => wrapper.getByTestId('new-user.done'));
      expect([
        emailsValidationMessage,
        orgRoleValidationMessage,
        spaceMembershipsValidationMessage
      ]).toEqual([null, null, null]);
      expect(invite).toHaveBeenCalledTimes(100);
    });

    it('will not submit if the confirmation dialog is not confirmed', async () => {
      const wrapper = build();
      ModalLauncher.open.mockResolvedValueOnce(false);
      await submitForm(wrapper, ['john.doe@enterprise.com'], 'Owner');
      expect(invite).not.toHaveBeenCalled();
    });

    describe('adding to spaces', () => {
      it('creates invitations with space memberships', async () => {
        const wrapper = build();
        await submitForm(wrapper, 'expect@topass.com', 'Member', [
          { spaceName: 'Foo', roleNames: ['Editor'] }
        ]);
        await wait(() => wrapper.getByTestId('new-user.done'));
        expect(createOrganizationEndpoint).toHaveBeenCalledWith('myorg');
        expect(invite).toHaveBeenCalledWith(mockOrgEndpoint, {
          role: 'member',
          email: 'expect@topass.com',
          spaceInvitations: [
            {
              admin: false,
              roleIds: ['editorid'],
              spaceId: '123'
            }
          ],
          teamInvitations: []
        });
        expect(createSpaceMembershipRepo).not.toHaveBeenCalled();
        expect(mockInviteToSpaceFn).not.toHaveBeenCalled();
      });

      it('creates space memberships', async () => {
        const wrapper = build(true);
        const spaceMemberships = [
          { spaceName: mockSpaces[0].name, roleNames: [mockRoles[0].name] },
          { spaceName: mockSpaces[1].name, roleNames: [mockRoles[1].name] }
        ];
        await submitForm(wrapper, 'expect@topass.com', 'Member', spaceMemberships);
        await wait(() => wrapper.getByTestId('new-user.done'));
        expect(invite).not.toHaveBeenCalled();
        expect(createSpaceMembershipRepo).toHaveBeenCalledWith(mockSpaceEndpoint);
        expect(createSpaceEndpoint).toHaveBeenNthCalledWith(1, mockSpaces[0].sys.id);
        expect(createSpaceEndpoint).toHaveBeenNthCalledWith(2, mockSpaces[1].sys.id);
        expect(mockInviteToSpaceFn).toHaveBeenNthCalledWith(1, 'expect@topass.com', ['editorid']);
        expect(mockInviteToSpaceFn).toHaveBeenNthCalledWith(2, 'expect@topass.com', ['authorid']);
      });
    });

    describe('adding to teams', () => {
      it('should invite to teams in orgs with sso', async () => {
        const wrapper = build(true, false, true);
        await submitForm(
          wrapper,
          ['john.doe@enterprise.com'],
          'Member',
          [],
          ['Super team', 'The people']
        );
        await wait(() => wrapper.getByTestId('new-user.done'));
        expect(createTeamMembership).toHaveBeenCalledTimes(2);
        expect(createTeamMembership).toHaveBeenNthCalledWith(
          1,
          mockOrgEndpoint,
          mockOrgMembership.sys.id,
          'superteam'
        );
        expect(createTeamMembership).toHaveBeenNthCalledWith(
          2,
          mockOrgEndpoint,
          mockOrgMembership.sys.id,
          'thepeople'
        );
      });

      it('should invite to teams in orgs without sso', async () => {
        const wrapper = build(false, false, true);
        await submitForm(
          wrapper,
          ['john.doe@enterprise.com'],
          'Member',
          [],
          ['Super team', 'The people']
        );
        await wait(() => wrapper.getByTestId('new-user.done'));
        expect(createTeamMembership).not.toHaveBeenCalled();
        expect(invite).toHaveBeenCalledWith(mockOrgEndpoint, {
          email: 'john.doe@enterprise.com',
          role: 'member',
          spaceInvitations: [],
          teamInvitations: [{ teamId: 'superteam' }, { teamId: 'thepeople' }]
        });
      });
    });

    it('shows a success message', async () => {
      const wrapper = build();
      await submitForm(wrapper, ['john.doe@enterprise.com'], 'Owner');
      await wait(() => wrapper.getByTestId('new-user.done'));
      const successState = wrapper.getByTestId('new-user.done.success');
      expect(successState).toBeVisible();
      expect(invite).toHaveBeenCalledTimes(1);
    });
  });
});

function build(hasSsoEnabled = false, isOwner = true, hasTeamsFeature = false) {
  // useAddToOrg.mockReturnValue([{ loading: false }, mockSubmitFn]);
  getAllRoles.mockReturnValue(mockRoles);
  getAllSpaces.mockReturnValue(mockSpaces);
  getAllTeams.mockReturnValue(mockTeams);
  createOrgMembership.mockReturnValue(mockOrgMembership);
  return render(
    <NewUser
      orgId="myorg"
      onReady={mockOnReady}
      hasSsoEnabled={hasSsoEnabled}
      isOwner={isOwner}
      hasTeamsFeature={hasTeamsFeature}
    />
  );
}

async function submitForm(wrapper, emails = '', role = '', spaceMemberships = [], teams = []) {
  const { getByTestId, getByLabelText, queryByTestId } = wrapper;
  const button = getByTestId('new-user.submit');
  const textarea = getByTestId('new-user.emails');

  // fill in the emails field
  fireEvent.change(textarea.querySelector('textarea'), { target: { value: emails } });

  // select org role
  if (role) {
    // role should be capitalized: Owner, Member, Admin
    const roleInput = getByLabelText(role);
    fireEvent.click(roleInput);
  }

  // add spaces and space roles
  if (spaceMemberships.length) {
    await addSpaceMemberships(wrapper, spaceMemberships);
  }

  // add teams
  if (teams.length) {
    await addTeams(wrapper, teams);
  }

  // submit the form
  act(() => {
    fireEvent.click(button);
  });

  // grab errors that might have showed up
  const emailsValidationMessage = within(textarea).queryByTestId('cf-ui-validation-message');
  const orgRoleValidationMessage = queryByTestId('new-user.org-role.error');
  const spaceMembershipsValidationMessage = queryByTestId('new-user.space-memberships.error');

  return {
    textarea,
    button,
    emailsValidationMessage,
    orgRoleValidationMessage,
    spaceMembershipsValidationMessage
  };
}

async function addSpaceMemberships(wrapper, spaceMemberships) {
  const { getByTestId, getAllByTestId, getByLabelText, getByText } = wrapper;
  const spacesSection = getByTestId('new-user.spaces');
  const spacesAutocomplete = within(spacesSection).getByTestId('autocomplete.input');

  // focus on the autocomplete input to display dropdown with options
  fireEvent.focus(spacesAutocomplete);
  // wait for the spaces to be lodaded
  await waitForElement(() => getAllByTestId('autocomplete.dropdown-list-item'));

  spaceMemberships.forEach(({ spaceName }) => {
    const space = getByText(spaceName);
    // select the space by name
    fireEvent.click(space);
    // focus again to select the next space
    fireEvent.focus(spacesAutocomplete);
  });

  spaceMemberships.forEach(({ roleNames }, index) => {
    // get the space membership form by index
    const spaceMembershipForm = getAllByTestId('space-membership-list.item')[index];
    // for each role, click on the checkbox referenced by a label with the correct role name
    roleNames.forEach(async roleName => {
      const roleEditorButton = within(spaceMembershipForm).getByTestId('space-role-editor.button');
      fireEvent.click(roleEditorButton);
      const roleOption = getByLabelText(roleName);
      fireEvent.click(roleOption);
    });
  });
}

async function addTeams(wrapper, teams) {
  const { getByTestId, getAllByTestId, getByText } = wrapper;
  const teamsSection = getByTestId('new-user.teams');
  const teamsAutocomplete = within(teamsSection).getByTestId('autocomplete.input');

  // focus on the autocomplete input to display dropdown with options
  fireEvent.focus(teamsAutocomplete);
  // wait for the spaces to be lodaded
  await waitForElement(() => getAllByTestId('autocomplete.dropdown-list-item'));
  teams.forEach(teamName => {
    const team = getByText(teamName);
    // select the team by name
    fireEvent.click(team);
    // focus again to select the next team
    fireEvent.focus(teamsAutocomplete);
  });
}

function generateAddresses(number) {
  return Array.from(new Array(number), (_, index) => `foo+${index}@bar.com`);
}
