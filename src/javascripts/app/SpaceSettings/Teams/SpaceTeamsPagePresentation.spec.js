import React from 'react';
import { noop } from 'lodash';
import { cleanup, render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import SpaceTeamsPagePresentation from './SpaceTeamsPagePresentation';

const build = (props = {}) =>
  render(
    <SpaceTeamsPagePresentation
      {...{
        teamSpaceMemberships: [],
        spaceMemberships: [],
        teams: [],
        availableRoles: [],
        onUpdateTeamSpaceMembership: noop,
        onRemoveTeamSpaceMembership: noop,
        isLoading: false,
        isPending: false,
        readOnly: false,
        currentUserAdminSpaceMemberships: [],
        ...props
      }}
    />
  );

let isLoading;
let teamSpaceMemberships;
let teams;

describe('SpaceTeamsPage', () => {
  afterEach(cleanup);

  describe('being rendered', () => {
    it('should not break', () => {
      expect(build).not.toThrow();
    });
  });

  describe('is loading', () => {
    beforeEach(() => {
      isLoading = true;
      teamSpaceMemberships = [
        {
          admin: true,
          roles: [],
          sys: {
            type: 'TeamSpaceMembership',
            id: 'membership1',
            team: {
              sys: {
                type: 'Team',
                id: 'team1'
              },
              description: 'This is the first test team',
              memberCount: 1,
              name: 'TestTeam1'
            }
          }
        }
      ];
    });
    teams = [
      {
        name: 'Team 1',
        sys: {
          id: 'team_1234'
        }
      },
      {
        name: 'Team 2',
        sys: {
          id: 'team_5678'
        }
      }
    ];

    it('should render 0 rows', () => {
      const { queryAllByTestId } = build({ teamSpaceMemberships, teams, isLoading });

      const rows = queryAllByTestId('membership-row');
      expect(rows).toHaveLength(0);
    });

    it('should render loading placeholder', () => {
      const { queryByTestId } = build({ teamSpaceMemberships, teams, isLoading });

      expect(queryByTestId('loading-placeholder')).toBeInTheDocument();
    });
  });

  describe('is not loading and has empty teamSpaceMemberships', () => {
    beforeEach(() => {
      isLoading = false;
      teamSpaceMemberships = [];
    });

    it('should render 0 rows', () => {
      const { queryAllByTestId } = build({ teamSpaceMemberships, teams, isLoading });

      const rows = queryAllByTestId('membership-row');
      expect(rows).toHaveLength(0);
    });
  });

  describe('is not loading and has teamSpaceMemberships', () => {
    beforeEach(() => {
      isLoading = false;
      teamSpaceMemberships = [
        {
          admin: true,
          roles: [],
          sys: {
            type: 'TeamSpaceMembership',
            id: 'membership1',
            team: {
              sys: {
                type: 'Team',
                id: 'team1'
              },
              description: 'This is the first test team',
              memberCount: 1,
              name: 'TestTeam1'
            }
          }
        },
        {
          admin: false,
          roles: [
            {
              sys: {
                type: 'Role',
                id: 'role1'
              },
              name: 'Role 1'
            },
            {
              sys: {
                type: 'Role',
                id: 'role2'
              },
              name: 'Role 2'
            }
          ],
          sys: {
            type: 'TeamSpaceMembership',
            id: 'membership2',
            team: {
              sys: {
                type: 'Team',
                id: 'team2'
              },
              description: 'This is the second test team',
              memberCount: 99,
              name: 'TestTeam2'
            }
          }
        }
      ];
    });

    it('should render 2 rows and action buttons', () => {
      const { getAllByTestId } = build({ teamSpaceMemberships, teams, isLoading });

      const rows = getAllByTestId('membership-row');
      expect(rows).toHaveLength(2);
      expect(getAllByTestId('row-menu.action-button')).toHaveLength(2);
    });

    it('should render cells with team details', () => {
      const { getAllByTestId } = build({ teamSpaceMemberships, teams, isLoading });

      const teamCells = getAllByTestId('team-cell');
      expect(teamCells[0]).toHaveTextContent('TestTeam1');
      expect(teamCells[0]).toHaveTextContent('This is the first test team');
      expect(teamCells[1]).toHaveTextContent('TestTeam2');
      expect(teamCells[1]).toHaveTextContent('This is the second test team');
    });

    it('should render cells with membership details', () => {
      const { getAllByTestId } = build({ teamSpaceMemberships, teams, isLoading });

      const roleCells = getAllByTestId('roles-cell');
      const membershipCells = getAllByTestId('member-count-cell');
      expect(roleCells[0]).toHaveTextContent('Admin');
      expect(roleCells[1]).toHaveTextContent('Role 1 and Role 2');
      expect(membershipCells[0]).toHaveTextContent('1 member');
      expect(membershipCells[1]).toHaveTextContent('99 members');
    });

    it('should disable the Add Teams button if number of teamSpaceMemberships equals number of teams', () => {
      let helpers;
      let addTeamsButton;

      helpers = build({ teamSpaceMemberships, teams: [{ sys: { id: 'team1' } }], isLoading });

      addTeamsButton = helpers.getByTestId('add-teams');

      expect(addTeamsButton.hasAttribute('disabled')).toBeFalse();

      cleanup();

      helpers = build({ teamSpaceMemberships, teams, isLoading });

      addTeamsButton = helpers.getByTestId('add-teams');

      expect(addTeamsButton.hasAttribute('disabled')).toBeTrue();
    });
  });
});
