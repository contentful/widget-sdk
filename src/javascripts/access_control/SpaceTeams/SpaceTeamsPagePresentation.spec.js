import React from 'react';
import SpaceTeamsPagePresentation from './SpaceTeamsPagePresentation.es6';
import { cleanup, render } from '@testing-library/react';
import 'jest-dom/extend-expect';

const build = props => render(<SpaceTeamsPagePresentation {...props} />);

let isLoading;
let memberships;

describe('SpaceTeamsPage', () => {
  afterEach(cleanup);

  describe('being rendered', () => {
    it('should not break', () => {
      expect(() => build({ memberships: [], isLoading: false })).not.toThrow();
    });
  });

  describe('is loading', () => {
    beforeEach(() => {
      isLoading = true;
      memberships = [
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

    it('should render 0 rows', () => {
      const { queryAllByTestId } = build({ memberships, isLoading });

      const rows = queryAllByTestId('membership-row');
      expect(rows).toHaveLength(0);
    });

    it('should render loading placeholder', () => {
      const { queryByTestId } = build({ memberships, isLoading });

      expect(queryByTestId('loading-placeholder')).toBeInTheDocument();
    });
  });

  describe('is not loading and has empty memberships', () => {
    beforeEach(() => {
      isLoading = false;
      memberships = [];
    });

    it('should render 0 rows', () => {
      const { queryAllByTestId } = build({ memberships, isLoading });

      const rows = queryAllByTestId('membership-row');
      expect(rows).toHaveLength(0);
    });
  });

  describe('is not loading and has memberships', () => {
    beforeEach(() => {
      isLoading = false;
      memberships = [
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
      const { getAllByTestId } = build({ memberships, isLoading });

      const rows = getAllByTestId('membership-row');
      expect(rows).toHaveLength(2);
      expect(getAllByTestId('action-button')).toHaveLength(2);
    });

    it('should render cells with team details', () => {
      const { getAllByTestId } = build({ memberships, isLoading });

      const teamCells = getAllByTestId('team-cell');
      expect(teamCells[0]).toHaveTextContent('TestTeam1');
      expect(teamCells[0]).toHaveTextContent('This is the first test team');
      expect(teamCells[1]).toHaveTextContent('TestTeam2');
      expect(teamCells[1]).toHaveTextContent('This is the second test team');
    });

    it('should render cells with membership details', () => {
      const { getAllByTestId } = build({ memberships, isLoading });

      const roleCells = getAllByTestId('roles-cell');
      const membershipCells = getAllByTestId('member-count-cell');
      expect(roleCells[0]).toHaveTextContent('Admin');
      expect(roleCells[1]).toHaveTextContent('Role 1 and Role 2');
      expect(membershipCells[0]).toHaveTextContent('1 member');
      expect(membershipCells[1]).toHaveTextContent('99 members');
    });
  });
});
