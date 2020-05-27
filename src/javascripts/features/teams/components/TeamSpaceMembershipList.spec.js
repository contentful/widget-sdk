import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fake from 'test/helpers/fakeFactory';
import { TeamSpaceMembershipList } from './TeamSpaceMembershipList';

const mockTeam = fake.Team();
const mockSpace = fake.Space({ name: 'my space' });
const mockTeamSpaceMembership = fake.TeamSpaceMembership(
  fake.Link('Team', mockTeam.sys.id),
  fake.Link('Space', mockSpace.sys.id),
  [],
  true
);
const spaceMemberships = [mockTeamSpaceMembership];
const removeTeamSpaceMembershipCB = jest.fn();
const onEditCB = jest.fn();

describe('TeamSpaceMembershipList', () => {
  const build = (props) => {
    return render(
      <TeamSpaceMembershipList
        orgId={'orgId'}
        items={spaceMemberships}
        readOnlyPermission={true}
        onEdit={onEditCB}
        removeTeamSpaceMembership={removeTeamSpaceMembershipCB}
        {...props}
      />
    );
  };

  it('renders the space memberships list', async () => {
    await build();
    const list = screen.getByTestId('team-space-memberships-table');
    expect(list).toBeInTheDocument();
    const rows = screen.getAllByTestId('cf-ui-table-row');
    expect(rows).toHaveLength(2);
  });

  it('not show remove or edit button if readOnlyPermission', async () => {
    await build();
    const removeBtn = screen.queryByTestId('remove-button');
    expect(removeBtn).toBeNull();
    const editBtn = screen.queryByTestId('edit-button');
    expect(editBtn).toBeNull();
  });

  it('show remove button if not readOnlyPermission', async () => {
    await build({ readOnlyPermission: false });
    const removeBtn = screen.getByTestId('remove-button');
    expect(removeBtn).toBeInTheDocument();
    fireEvent.click(removeBtn);
    expect(removeTeamSpaceMembershipCB).toHaveBeenCalledTimes(1);
  });
});
