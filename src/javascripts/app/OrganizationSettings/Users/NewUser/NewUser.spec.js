import React from 'react';
import NewUser from './NewUser';
import { render, fireEvent, within, wait, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fakeFactory from 'test/helpers/fakeFactory';
import { invite } from 'access_control/OrganizationMembershipRepository';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { create as createSpaceMembershipRepo } from 'access_control/SpaceMembershipRepository';
import { createTeamMembership } from 'access_control/TeamRepository';
import { createSpaceEndpoint } from 'data/EndpointFactory';

const mockFooSpace = fakeFactory.Space();
const mockBarSpace = fakeFactory.Space();
const mockEditorRole = fakeFactory.Role('Editor', mockFooSpace);
const mockAuthorRole = fakeFactory.Role('Author', mockBarSpace);
const mockTeamA = fakeFactory.Team('Team A');
const mockTeamB = fakeFactory.Team('Team B');
const mockTeamSpaceMemberships = [
  fakeFactory.TeamSpaceMembership(mockTeamA, mockFooSpace, [mockEditorRole], false),
  fakeFactory.TeamSpaceMembership(mockTeamB, mockBarSpace, [], true),
];
const mockInvitation = fakeFactory.Invitation();

const mockOnReady = jest.fn();
const mockOrgEndpoint = jest.fn();
const mockSpaceEndpoint = jest.fn();
const mockInviteToSpaceFn = jest.fn(() => Promise.resolve());

jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn(() => mockOrgEndpoint),
  createSpaceEndpoint: jest.fn(() => mockSpaceEndpoint),
}));

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllRoles: jest.fn(async () => [mockEditorRole, mockAuthorRole]),
  getAllSpaces: jest.fn(async () => [mockFooSpace, mockBarSpace]),
  invite: jest.fn(async () => mockInvitation),
}));

jest.mock('access_control/SpaceMembershipRepository', () => ({
  create: jest.fn(() => ({
    invite: mockInviteToSpaceFn,
  })),
}));

jest.mock('access_control/TeamRepository', () => ({
  createTeamMembership: jest.fn(() => Promise.resolve()),
  getAllTeams: jest.fn(async () => [mockTeamA, mockTeamB]),
  getAllTeamsSpaceMemberships: jest.fn(async () => mockTeamSpaceMemberships),
}));

describe('NewUser', () => {
  it('does not show the owner role as an option to non owners', async () => {
    build(false);
    await wait();
    expect(screen.queryByLabelText('Owner')).toBeNull();
  });

  it('shows the owner role as an option to org owners', async () => {
    build(true);
    await wait();
    expect(screen.getByLabelText('Owner')).toBeVisible();
  });

  describe('validation fails', () => {
    it('validates the presence of at least one email addresses', async () => {
      build();
      await wait();
      const { emailsValidationMessage } = await submitForm();
      expect(emailsValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
    });

    it('validates email addresses', async () => {
      build();
      await wait();
      const { emailsValidationMessage } = await submitForm(['invalid@']);
      expect(emailsValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
    });

    it('validates the maximum number of email addresses', async () => {
      build();
      await wait();
      const emails = generateAddresses(101);

      const { emailsValidationMessage } = await submitForm(emails);
      expect(emailsValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
    });

    it('validates that an org role was selected', async () => {
      build();
      await wait();
      const { orgRoleValidationMessage } = await submitForm(['john.doe@contentful.com'], '');
      expect(orgRoleValidationMessage).toBeVisible();
      expect(invite).not.toHaveBeenCalled();
      await wait();
    });

    it('it fails to send if a space role is not selected', async () => {
      build();
      await wait();
      const { spaceMembershipsValidationMessage } = await submitForm(
        ['expect@topass.com'],
        'Member',
        [{ spaceName: mockFooSpace.name, roleNames: [] }]
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
        { spaceName: mockFooSpace.name, roleNames: [mockEditorRole.name] },
      ]);
      await wait(() => screen.getByTestId('new-user.done'));
      expect(invite).toHaveBeenCalledWith(mockOrgEndpoint, {
        role: 'owner',
        email: 'john.doe@enterprise.com',
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
      } = await submitForm(emails, 'Member', [
        { spaceName: mockBarSpace.name, roleNames: [mockAuthorRole.name] },
      ]);

      await screen.findByTestId('new-user.done');

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
      it('creates space memberships', async () => {
        build(true);
        await wait();
        const spaceMemberships = [
          { spaceName: mockFooSpace.name, roleNames: [mockEditorRole.name] },
          { spaceName: mockBarSpace.name, roleNames: [mockAuthorRole.name] },
        ];
        await submitForm(['expect@topass.com'], 'Member', spaceMemberships);
        await wait(() => screen.getByTestId('new-user.done'));
        expect(invite).toHaveBeenCalled();
        expect(createSpaceMembershipRepo).toHaveBeenCalledWith(mockSpaceEndpoint);
        expect(createSpaceEndpoint).toHaveBeenNthCalledWith(1, mockFooSpace.sys.id);
        expect(createSpaceEndpoint).toHaveBeenNthCalledWith(2, mockBarSpace.sys.id);
        expect(mockInviteToSpaceFn).toHaveBeenNthCalledWith(1, 'expect@topass.com', [
          mockEditorRole.sys.id,
        ]);
        expect(mockInviteToSpaceFn).toHaveBeenNthCalledWith(2, 'expect@topass.com', [
          mockAuthorRole.sys.id,
        ]);
        await wait();
      });
    });

    describe('adding to teams', () => {
      it('should invite to teams', async () => {
        build(false, true);
        await wait();
        await submitForm(
          ['john.doe@enterprise.com'],
          'Member',
          [],
          [mockTeamA.name, mockTeamB.name]
        );
        await screen.findByTestId('new-user.done');
        expect(createTeamMembership).toHaveBeenCalledTimes(2);
        expect(createTeamMembership).toHaveBeenNthCalledWith(
          1,
          mockOrgEndpoint,
          mockInvitation.sys.organizationMembership.sys.id,
          mockTeamA.sys.id
        );
        expect(createTeamMembership).toHaveBeenNthCalledWith(
          2,
          mockOrgEndpoint,
          mockInvitation.sys.organizationMembership.sys.id,
          mockTeamB.sys.id
        );
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
        await screen.findByTestId('new-user.done');
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
          .mockResolvedValueOnce(mockInvitation)
          .mockRejectedValueOnce(forbiddenError);

        build();

        await wait();
        await submitForm(
          ['john.doe@enterprise.com', 'jane.doe@enterprise.com', 'jack.doe@enterprise.com'],
          'Owner'
        );
        await screen.findByTestId('new-user.done');
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

async function build(isOwner = true, hasTeamsFeature = false) {
  render(
    <NewUser
      orgId="myorg"
      onReady={mockOnReady}
      isOwner={isOwner}
      hasTeamsFeature={hasTeamsFeature}
    />
  );
}

async function submitForm(emails = [], role = '', spaceMemberships = [], teams = []) {
  const button = screen.getByTestId('new-user.submit');
  const emailsField = screen.getByTestId('new-user.emails');
  const textarea = within(emailsField).getByTestId('cf-ui-textarea');

  // fill in the emails field
  fireEvent.change(textarea, { target: { value: emails.join(', ') } });

  // select org role
  if (role) {
    // role should be capitalized: Owner, Member, Admin
    const roleInput = screen.getByLabelText(role);
    userEvent.click(roleInput);
  }

  // add spaces and space roles
  if (spaceMemberships.length) {
    await addSpaceMemberships(spaceMemberships);
  }

  // add teams
  if (teams.length) {
    await addTeams(teams);
  }

  userEvent.click(button);

  // grab errors that might have showed up
  const emailsValidationMessage = within(emailsField).queryByTestId('cf-ui-validation-message');
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

  for await (const { spaceName } of spaceMemberships) {
    // focus on the autocomplete input to display dropdown with options
    fireEvent.focus(spacesAutocomplete);
    // wait for the spaces to be lodaded
    const space = await screen.findByText(spaceName);
    // select the space by name
    userEvent.click(space);
  }

  spaceMemberships.forEach(({ roleNames }, index) => {
    // get the space membership form by index
    const spaceMembershipForm = screen.getAllByTestId('add-to-spaces.list.item')[index];
    // for each role, click on the checkbox referenced by a label with the correct role name
    roleNames.forEach(async (roleName) => {
      const roleEditorButton = within(spaceMembershipForm).getByTestId('space-role-editor.button');
      userEvent.click(roleEditorButton);
      const roleOption = screen.getByLabelText(roleName);
      userEvent.click(roleOption);
    });
  });
}

async function addTeams(teams) {
  const teamsSection = screen.getByTestId('new-user.teams');
  const teamsAutocomplete = within(teamsSection).getByTestId('autocomplete.input');

  for await (const teamName of teams) {
    // focus on the autocomplete input to display dropdown with options
    fireEvent.focus(teamsAutocomplete);
    // wait for the spaces to be lodaded
    const team = await screen.findByText(teamName);
    // select the team by name
    userEvent.click(team);
  }
}

function generateAddresses(number) {
  return new Array(number).fill().map((_, index) => `foo+${index}@bar.com`);
}
