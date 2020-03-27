import React from 'react';
import NewUser from './NewUser';
import {
  render,
  fireEvent,
  within,
  waitForElement,
  act,
  wait,
  screen,
} from '@testing-library/react';

import {
  getAllSpaces,
  getAllRoles,
  invite,
  createOrgMembership,
} from 'access_control/OrganizationMembershipRepository';
import ModalLauncher from 'app/common/ModalLauncher';
import { getVariation } from 'LaunchDarkly';
import { create as createSpaceMembershipRepo } from 'access_control/SpaceMembershipRepository';
import {
  createTeamMembership,
  getAllTeams,
  getAllTeamsSpaceMemberships,
} from 'access_control/TeamRepository';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';

const mockOrgMembership = { sys: { id: 'neworgmembership' } };
const mockOrgEndpoint = jest.fn().mockName('org endpoint');
const mockSpaceEndpoint = jest.fn().mockName('space endpoint');
const mockInviteToSpaceFn = jest.fn();
const mockOnReady = jest.fn();

let mockRoles, mockSpaces, mockTeams, mockTeamSpaceMemberships;

jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn().mockName('create org endpoint'),
  createSpaceEndpoint: jest.fn(),
}));

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllRoles: jest.fn(),
  getAllSpaces: jest.fn(),
  invite: jest.fn().mockResolvedValue({}),
  createOrgMembership: jest.fn(),
}));

jest.mock('access_control/SpaceMembershipRepository', () => ({
  create: jest.fn(),
}));

jest.mock('access_control/TeamRepository', () => ({
  createTeamMembership: jest.fn(),
  getAllTeams: jest.fn(),
  getAllTeamsSpaceMemberships: jest.fn(),
}));

describe('NewUser', () => {
  beforeEach(() => {
    mockRoles = [
      {
        name: 'Editor',
        sys: {
          id: 'editorid',
          space: { sys: { id: '123' } },
        },
      },
      {
        name: 'Author',
        sys: {
          id: 'authorid',
          space: { sys: { id: '456' } },
        },
      },
    ];
    mockSpaces = [
      {
        name: 'Foo',
        sys: { id: '123' },
      },
      {
        name: 'Bar',
        sys: { id: '456' },
      },
    ];
    mockTeams = [
      {
        name: 'Super team',
        sys: { id: 'superteam' },
      },
      {
        name: 'The people',
        sys: { id: 'thepeople' },
      },
    ];
    mockTeamSpaceMemberships = [
      {
        admin: false,
        roles: [mockRoles[0]],
        sys: {
          space: mockSpaces[0],
          team: mockTeams[0],
        },
      },
    ];

    createTeamMembership.mockResolvedValue({});
    getAllTeams.mockResolvedValue(mockTeams);
    getAllTeamsSpaceMemberships.mockResolvedValue(mockTeamSpaceMemberships);

    mockInviteToSpaceFn.mockResolvedValue({});
    createOrganizationEndpoint.mockReturnValue(mockOrgEndpoint);
    createSpaceEndpoint.mockReturnValue(mockSpaceEndpoint);
    createSpaceMembershipRepo.mockReturnValue({
      invite: mockInviteToSpaceFn,
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
    getAllTeams.mockReset();
    getAllTeamsSpaceMemberships.mockReset();
    invite.mockReset();
    getVariation.mockReset();
  });

  it('does not show the owner role as an option to non owners', async () => {
    build(false, false);
    expect(screen.queryByLabelText('Owner')).toBeNull();
    await wait();
  });

  it('shows the owner role as an option to org owners', async () => {
    build(false, true);
    expect(screen.getByLabelText('Owner')).toBeVisible();
    await wait();
  });

  describe('validation fails', () => {
    it('validates the presence of at least one email addresses', async () => {
      build();
      await wait();
      const { emailsValidationMessage } = await submitForm();
      expect(emailsValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
      await wait();
    });

    it('validates email addresses', async () => {
      build();
      await wait();
      const { emailsValidationMessage } = await submitForm('invalid@');
      expect(emailsValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
      await wait();
    });

    it('validates the maximum number of email addresses', async () => {
      build();
      await wait();
      const emails = generateAddresses(101);

      const { emailsValidationMessage } = await submitForm(emails);
      expect(emailsValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
      await wait();
    });

    it('validates that an org role was selected', async () => {
      build();
      await wait();
      const { orgRoleValidationMessage } = await submitForm('john.doe@contentful.com', '');
      expect(orgRoleValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
      await wait();
    });

    it('it fails to send if a space role is not selected', async () => {
      build();
      await wait();
      const { spaceMembershipsValidationMessage } = await submitForm(
        'expect@topass.com',
        'Member',
        [{ spaceName: 'Foo', roleNames: [] }]
      );

      expect(invite).not.toHaveBeenCalled();
      expect(spaceMembershipsValidationMessage).toBeVisible();
      await wait();
    });
  });

  describe('validation passes', () => {
    it('sends an invitation request', async () => {
      build();
      await wait();
      await submitForm(['john.doe@enterprise.com'], 'Owner', [
        { spaceName: 'Foo', roleNames: ['Editor'] },
      ]);
      await wait(() => screen.getByTestId('new-user.done'));
      expect(invite).toHaveBeenCalledWith(mockOrgEndpoint, {
        role: 'owner',
        email: 'john.doe@enterprise.com',
        spaceInvitations: [{ spaceId: '123', admin: false, roleIds: ['editorid'] }],
        teamInvitations: [],
      });
      await wait();
    });

    it('sends requests to 100 addresses', async () => {
      build();
      await wait();
      const emails = generateAddresses(100);
      const {
        emailsValidationMessage,
        orgRoleValidationMessage,
        spaceMembershipsValidationMessage,
      } = await submitForm(emails, 'Member', [{ spaceName: 'Foo', roleNames: ['Editor'] }]);
      await wait(() => screen.getByTestId('new-user.done'));
      expect([
        emailsValidationMessage,
        orgRoleValidationMessage,
        spaceMembershipsValidationMessage,
      ]).toEqual([null, null, null]);
      expect(invite).toHaveBeenCalledTimes(100);
      await wait();
    });

    it('will not submit if the confirmation dialog is not confirmed', async () => {
      build();
      await wait();
      ModalLauncher.open.mockResolvedValueOnce(false);
      await submitForm(['john.doe@enterprise.com'], 'Owner');
      expect(invite).not.toHaveBeenCalled();
      await wait();
    });

    describe('adding to spaces', () => {
      it('creates invitations with space memberships', async () => {
        build();
        await wait();
        await submitForm('expect@topass.com', 'Member', [
          { spaceName: 'Foo', roleNames: ['Editor'] },
        ]);
        await wait(() => screen.getByTestId('new-user.done'));
        expect(createOrganizationEndpoint).toHaveBeenCalledWith('myorg');
        expect(invite).toHaveBeenCalledWith(mockOrgEndpoint, {
          role: 'member',
          email: 'expect@topass.com',
          spaceInvitations: [
            {
              admin: false,
              roleIds: ['editorid'],
              spaceId: '123',
            },
          ],
          teamInvitations: [],
        });
        expect(createSpaceMembershipRepo).not.toHaveBeenCalled();
        expect(mockInviteToSpaceFn).not.toHaveBeenCalled();
        await wait();
      });

      it('creates space memberships', async () => {
        build(true);
        await wait();
        const spaceMemberships = [
          { spaceName: mockSpaces[0].name, roleNames: [mockRoles[0].name] },
          { spaceName: mockSpaces[1].name, roleNames: [mockRoles[1].name] },
        ];
        await submitForm('expect@topass.com', 'Member', spaceMemberships);
        await wait(() => screen.getByTestId('new-user.done'));
        expect(invite).not.toHaveBeenCalled();
        expect(createSpaceMembershipRepo).toHaveBeenCalledWith(mockSpaceEndpoint);
        expect(createSpaceEndpoint).toHaveBeenNthCalledWith(1, mockSpaces[0].sys.id);
        expect(createSpaceEndpoint).toHaveBeenNthCalledWith(2, mockSpaces[1].sys.id);
        expect(mockInviteToSpaceFn).toHaveBeenNthCalledWith(1, 'expect@topass.com', ['editorid']);
        expect(mockInviteToSpaceFn).toHaveBeenNthCalledWith(2, 'expect@topass.com', ['authorid']);
        await wait();
      });
    });

    describe('adding to teams', () => {
      it('should invite to teams in orgs with sso', async () => {
        build(true, false, true);
        await wait();
        await submitForm(['john.doe@enterprise.com'], 'Member', [], ['Super team', 'The people']);
        await wait(() => screen.getByTestId('new-user.done'));
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
        await wait();
      });

      it('should invite to teams in orgs without sso', async () => {
        build(false, false, true);
        await wait();
        await submitForm(['john.doe@enterprise.com'], 'Member', [], ['Super team', 'The people']);
        await wait(() => screen.getByTestId('new-user.done'));
        expect(createTeamMembership).not.toHaveBeenCalled();
        expect(invite).toHaveBeenCalledWith(mockOrgEndpoint, {
          email: 'john.doe@enterprise.com',
          role: 'member',
          spaceInvitations: [],
          teamInvitations: [{ teamId: 'superteam' }, { teamId: 'thepeople' }],
        });
        await wait();
      });
    });

    describe('result state', () => {
      const forbiddenError = new Error('Forbidden');
      const unprocessableError = new Error('Unprocessable');
      forbiddenError.statusCode = 403;
      unprocessableError.statusCode = 422;

      it('shows a success message', async () => {
        build();

        await wait();

        await submitForm(['john.doe@enterprise.com'], 'Owner');
        await wait(() => screen.getByTestId('new-user.done'));
        const successState = screen.getByTestId('new-user.done.success');
        expect(successState).toBeVisible();
        expect(invite).toHaveBeenCalledTimes(1);
        await wait();
      });

      it('shows a plan limit failure message', async () => {
        invite.mockRejectedValueOnce(forbiddenError);

        build();

        await wait();

        await submitForm(['john.doe@enterprise.com'], 'Owner');
        await wait(() => screen.getByTestId('new-user.done'));
        const planLimitErrorMessage = screen.getByTestId('new-user.done.failed.planLimitHit');
        const alreadyInErrorMessage = screen.queryByTestId('new-user.done.failed.alreadyIn');
        expect(planLimitErrorMessage).toBeVisible();
        expect(alreadyInErrorMessage).toBeNull();
        await wait();
      });

      it('shows an already invited failure message', async () => {
        invite.mockRejectedValueOnce(unprocessableError);

        build();

        await wait();
        await submitForm(['john.doe@enterprise.com'], 'Owner');
        await wait(() => screen.getByTestId('new-user.done'));
        const planLimitErrorMessage = screen.queryByTestId('new-user.done.failed.planLimitHit');
        const alreadyInErrorMessage = screen.getByTestId('new-user.done.failed.alreadyIn');
        expect(alreadyInErrorMessage).toBeVisible();
        expect(planLimitErrorMessage).toBeNull();
        await wait();
      });

      it('shows messages for mixed results', async () => {
        invite
          .mockRejectedValueOnce(unprocessableError)
          .mockResolvedValueOnce({})
          .mockRejectedValueOnce(forbiddenError);

        build();

        await wait();
        await submitForm(
          ['john.doe@enterprise.com', 'jane.doe@enterprise.com', 'jack.doe@enterprise.com'],
          'Owner'
        );
        await wait(() => screen.getByTestId('new-user.done'));
        const successState = screen.getByTestId('new-user.done.success');
        const planLimitErrorMessage = screen.getByTestId('new-user.done.failed.planLimitHit');
        const alreadyInErrorMessage = screen.getByTestId('new-user.done.failed.alreadyIn');
        expect(alreadyInErrorMessage).toBeVisible();
        expect(planLimitErrorMessage).toBeVisible();
        expect(successState).toBeVisible();
        await wait();
      });
    });
  });
});

async function build(hasSsoEnabled = false, isOwner = true, hasTeamsFeature = false) {
  getAllRoles.mockReturnValue(mockRoles);
  getAllSpaces.mockReturnValue(mockSpaces);
  getAllTeams.mockReturnValue(mockTeams);
  createOrgMembership.mockReturnValue(mockOrgMembership);
  render(
    <NewUser
      orgId="myorg"
      onReady={mockOnReady}
      hasSsoEnabled={hasSsoEnabled}
      isOwner={isOwner}
      hasTeamsFeature={hasTeamsFeature}
    />
  );
}

async function submitForm(emails = '', role = '', spaceMemberships = [], teams = []) {
  const button = screen.getByTestId('new-user.submit');
  const textarea = screen.getByTestId('new-user.emails');

  // fill in the emails field
  act(() => {
    fireEvent.change(textarea.querySelector('textarea'), { target: { value: emails } });
  });

  // select org role
  if (role) {
    // role should be capitalized: Owner, Member, Admin
    const roleInput = screen.getByLabelText(role);
    act(() => {
      fireEvent.click(roleInput);
    });
  }

  // add spaces and space roles
  if (spaceMemberships.length) {
    await addSpaceMemberships(spaceMemberships);
  }

  // add teams
  if (teams.length) {
    await addTeams(teams);
  }

  // submit the form
  act(() => {
    fireEvent.click(button);
  });

  // grab errors that might have showed up
  const emailsValidationMessage = within(textarea).queryByTestId('cf-ui-validation-message');
  const orgRoleValidationMessage = screen.queryByTestId('new-user.org-role.error');
  const spaceMembershipsValidationMessage = screen.queryByTestId(
    'new-user.space-memberships.error'
  );

  return {
    textarea,
    button,
    emailsValidationMessage,
    orgRoleValidationMessage,
    spaceMembershipsValidationMessage,
  };
}

async function addSpaceMemberships(spaceMemberships) {
  const spacesSection = screen.getByTestId('add-to-spaces');
  const spacesAutocomplete = within(spacesSection).getByTestId('autocomplete.input');

  // focus on the autocomplete input to display dropdown with options
  fireEvent.focus(spacesAutocomplete);
  // wait for the spaces to be lodaded
  await waitForElement(() => screen.getAllByTestId('autocomplete.dropdown-list-item'));

  spaceMemberships.forEach(({ spaceName }) => {
    const space = screen.getByText(spaceName);
    // select the space by name
    fireEvent.click(space);
    // focus again to select the next space
    fireEvent.focus(spacesAutocomplete);
  });

  spaceMemberships.forEach(({ roleNames }, index) => {
    // get the space membership form by index
    const spaceMembershipForm = screen.getAllByTestId('add-to-spaces.list.item')[index];
    // for each role, click on the checkbox referenced by a label with the correct role name
    roleNames.forEach(async (roleName) => {
      const roleEditorButton = within(spaceMembershipForm).getByTestId('space-role-editor.button');
      fireEvent.click(roleEditorButton);
      const roleOption = screen.getByLabelText(roleName);
      fireEvent.click(roleOption);
    });
  });
}

async function addTeams(teams) {
  const teamsSection = screen.getByTestId('new-user.teams');
  const teamsAutocomplete = within(teamsSection).getByTestId('autocomplete.input');

  // focus on the autocomplete input to display dropdown with options
  fireEvent.focus(teamsAutocomplete);
  // wait for the spaces to be lodaded
  await waitForElement(() => screen.getAllByTestId('autocomplete.dropdown-list-item'));
  teams.forEach((teamName) => {
    const team = screen.getByText(teamName);
    // select the team by name
    fireEvent.click(team);
    // focus again to select the next team
    fireEvent.focus(teamsAutocomplete);
  });
}

function generateAddresses(number) {
  return Array.from(new Array(number), (_, index) => `foo+${index}@bar.com`);
}
