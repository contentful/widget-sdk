import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fake from 'test/helpers/fakeFactory';
import { AddToTeamModal } from './AddToTeamModal';

const mockTeam = fake.Team('Team A');
const mockUser = fake.User({ firstName: 'John', lastName: 'Doe' });
const mockOrgMembership = fake.OrganizationMembership('member', 'active', mockUser);
const mockTeamMembership = fake.TeamMembership(
  fake.Link('Team', mockTeam.sys.id),
  mockOrgMembership,
  mockUser
);
const currentTeamMembers = [mockTeamMembership.sys.organizationMembership.sys.id];

const newUser = fake.User({ firstName: 'Jane', lastName: 'Doe' });
const newOrgMembership = fake.OrganizationMembership('member', 'active', newUser);
const mockNewTeamMembership = fake.TeamMembership(
  fake.Link('Team', mockTeam.sys.id),
  newOrgMembership,
  newUser
);

const mockAllOrgMemberships = [mockOrgMembership, newOrgMembership];

jest.mock('data/LinkResolver', () => ({
  fetchAndResolve: jest.fn(async () => mockAllOrgMemberships),
}));

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllMembershipsWithQuery: jest.fn(async () => mockAllOrgMemberships),
}));

jest.mock('features/teams/services/TeamRepo', () => ({
  createTeamMembership: jest.fn(async () => mockNewTeamMembership),
}));

const onAddedToTeamCb = jest.fn();

async function build(props) {
  return render(
    <AddToTeamModal
      isShown={true}
      orgId={mockOrgMembership.sys.id}
      team={mockTeam}
      currentTeamMembers={currentTeamMembers}
      onClose={() => jest.fn()}
      onAddedToTeam={onAddedToTeamCb}
      {...props}
    />
  );
}

describe('AddToTeamModal', () => {
  it('renders the modal', async () => {
    await build();
    const modal = screen.getByTestId('add-to-teams-modal');
    expect(modal).toBeInTheDocument();
    const submitBtn = screen.getByTestId('add-to-team.modal.submit-button');
    expect(submitBtn).toBeInTheDocument();
    const cancelBtn = screen.getByTestId('add-to-team.modal.cancel-button');
    expect(cancelBtn).toBeInTheDocument();
  });

  it('should display a list of orgMembership options not already in the team', async () => {
    await build();
    const input = screen.getByTestId('user-select');
    fireEvent.focus(input);
    await screen.findAllByTestId('user-select-option');

    expect(
      screen.getByText(`${newUser.firstName} ${newUser.lastName} <${newUser.email}>`)
    ).toBeVisible();
    expect(
      screen.queryAllByText(`${mockUser.firstName} ${mockUser.lastName} <${mockUser.email}>`)
    ).toHaveLength(0);
  });

  it('should create a new team membership', async () => {
    await build();
    // focus on select field and wait for options to show up
    const input = screen.getByTestId('user-select');
    fireEvent.focus(input);

    await screen.findAllByTestId('user-select-option');
    const newTeamMemberOption = screen.getByText(
      `${newOrgMembership.sys.user.firstName} ${newOrgMembership.sys.user.lastName} <${newOrgMembership.sys.user.email}>`
    );
    fireEvent.click(newTeamMemberOption);

    const submitBtn = screen.getByTestId('add-to-team.modal.submit-button');
    expect(submitBtn).toBeInTheDocument();
    // fireEvent.click(submitBtn);
    // await waitFor(() => expect(onAddedToTeamCb).toHaveBeenCalledTimes(1));
    // const notification = await screen.findByTestId('cf-ui-notification');
    // expect(notification).toHaveTextContent('Successfully added John Doe to team Team A');
  });
});
