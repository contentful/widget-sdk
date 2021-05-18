import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fake from 'test/helpers/fakeFactory';
import { TeamMembershipList } from './TeamMembershipList';

const mockTeam = fake.Team();
const mockUser = fake.User({ firstName: 'John', lastName: 'Doe' });
const mockOrgMembership = fake.OrganizationMembership('member', 'active', mockUser);
const mockTeamMembership = fake.TeamMembership(
  fake.Link('Team', mockTeam.sys.id),
  mockOrgMembership,
  mockUser
);
const teamMembers = [mockTeamMembership];
const removeFromTeamCB = jest.fn();

describe('TeamMembershipList', () => {
  const build = (props) => {
    return render(
      <TeamMembershipList
        orgId={'orgId'}
        items={teamMembers}
        readOnlyPermission={true}
        removeFromTeam={removeFromTeamCB}
        {...props}
      />
    );
  };

  it('renders the team members list', async () => {
    await build();
    const list = screen.getByTestId('team-members-table');
    expect(list).toBeInTheDocument();
    const memberRow = screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`);
    expect(memberRow).toBeInTheDocument();
  });

  it('not show remove button if readOnlyPermission', async () => {
    await build();
    const removeBtn = screen.queryByTestId('remove-button');
    expect(removeBtn).toBeNull();
  });

  it('show remove button if not readOnlyPermission', async () => {
    await build({ readOnlyPermission: false });
    const removeBtn = screen.getByTestId('remove-button');
    expect(removeBtn).toBeInTheDocument();
    fireEvent.click(removeBtn);
    expect(removeFromTeamCB).toHaveBeenCalledTimes(1);
  });
});
