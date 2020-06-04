import React from 'react';

import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';

import * as fake from 'test/helpers/fakeFactory';
import { TeamList } from './TeamList';
import { getAllTeams } from 'features/teams/services/TeamRepository';

const teamA = fake.Team('Team A', 'the awesome team');
const teamB = fake.Team('Team B', 'the brave team');
const mockTeams = [teamA, teamB];

jest.mock('features/teams/services/TeamRepository', () => ({
  getAllTeams: jest.fn(async () => {
    return { items: mockTeams };
  }),
}));

describe('TeamList', () => {
  const renderComponent = (props) => {
    render(
      <TeamList orgId={teamA.sys.organization.sys.id} readOnlyPermission={false} {...props} />
    );

    // the component makes getAllTeams request on mount
    return waitForElementToBeRemoved(() => screen.getAllByTestId('cf-ui-skeleton-form'));
  };

  it('can view teams', async () => {
    await renderComponent();
    expect(getAllTeams).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('the awesome team')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
    expect(screen.getByText('the brave team')).toBeInTheDocument();
  });

  it('can see add new team dialog on btn', async () => {
    await renderComponent();
    const newTeamBtn = screen.getByTestId('new-team-button');
    expect(newTeamBtn).toBeInTheDocument();
    await fireEvent.click(newTeamBtn);
    expect(screen.getByTestId('team-form')).toBeInTheDocument();
  });

  it('can see remove and edit btns for teams', async () => {
    await renderComponent();
    expect(screen.getAllByTestId('team-list.menu')).toHaveLength(2);
    await fireEvent.click(screen.getAllByTestId('team-list.menu.trigger')[0]);
    expect(screen.getByTestId('edit-team-button')).toBeInTheDocument();
    expect(screen.getByTestId('remove-team-button')).toBeInTheDocument();
  });

  it('should not see actions menu if readOnlyPermission', async () => {
    await renderComponent({ readOnlyPermission: true });
    expect(screen.queryAllByTestId('team-list.menu')).toHaveLength(0);
  });

  it('should see disabled new team button with tooltip', async () => {
    await renderComponent({ readOnlyPermission: true });
    expect(screen.queryAllByTestId('team-list.menu')).toHaveLength(0);
    const newTeamBtn = screen.getByTestId('new-team-button');
    expect(newTeamBtn).toBeInTheDocument();
    expect(newTeamBtn).toBeDisabled();
    await fireEvent.mouseOver(newTeamBtn);
    expect(screen.getByTestId('read-only-tooltip')).toBeInTheDocument();
  });
});
