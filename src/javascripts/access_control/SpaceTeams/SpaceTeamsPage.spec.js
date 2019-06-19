import React from 'react';
import { noop } from 'lodash';
import SpaceTeamsPage from './SpaceTeamsPage.es6';
import { render, waitForElement, cleanup } from '@testing-library/react';
import 'jest-dom/extend-expect';

import { createSpaceEndpoint as createSpaceEndpointMock } from 'data/EndpointFactory.es6';
import { getTeamsSpaceMembershipsOfSpace as getTeamsSpaceMembershipsOfSpaceMock } from '../TeamRepository.es6';
import { getSectionVisibility as getSectionVisibilityMock } from '../AccessChecker/index.es6';

jest.mock('services/TokenStore.es6', () => ({
  getSpace: jest.fn().mockResolvedValue({ name: 'TestSpace' })
}));

jest.mock('data/EndpointFactory.es6', () => ({
  createSpaceEndpoint: jest.fn()
}));

jest.mock('../TeamRepository.es6', () => ({
  getTeamsSpaceMembershipsOfSpace: jest.fn()
}));

jest.mock('../AccessChecker/index.es6', () => ({
  getSectionVisibility: jest.fn()
}));

const build = () => {
  return render(<SpaceTeamsPage spaceId="mySpace" onReady={noop} />);
};

describe('SpaceTeamsPage', () => {
  beforeEach(() => {
    getTeamsSpaceMembershipsOfSpaceMock.mockResolvedValue([]);
    createSpaceEndpointMock.mockResolvedValue({});
    getSectionVisibilityMock.mockReturnValue({ teams: true });
  });

  afterEach(() => {
    cleanup();
    getTeamsSpaceMembershipsOfSpaceMock.mockReset();
    createSpaceEndpointMock.mockReset();
  });

  describe('being rendered', () => {
    it('should not break', () => {
      expect(build).not.toThrow();
    });

    it('should create space endpoint', () => {
      build();
      expect(createSpaceEndpointMock).toHaveBeenCalled();
    });
  });

  describe('api returns space memberships', () => {
    beforeEach(() => {
      getTeamsSpaceMembershipsOfSpaceMock.mockResolvedValue([
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
      ]);
    });

    it('should render 2 rows and action buttons', async () => {
      const { getAllByTestId } = build();

      // ensure rendering finished
      const rows = await waitForElement(() => getAllByTestId('membership-row'));
      expect(rows).toHaveLength(2);
      expect(getAllByTestId('action-button')).toHaveLength(2);
    });

    it('should render cells with team details', async () => {
      const { getAllByTestId } = build();

      // ensure rendering finished
      const teamCells = await waitForElement(() => getAllByTestId('team-cell'));
      expect(teamCells[0]).toHaveTextContent('TestTeam1');
      expect(teamCells[0]).toHaveTextContent('This is the first test team');
      expect(teamCells[1]).toHaveTextContent('TestTeam2');
      expect(teamCells[1]).toHaveTextContent('This is the second test team');
    });

    it('should render cells with membership details', async () => {
      const { getAllByTestId } = build();

      // ensure rendering finished
      const roleCells = await waitForElement(() => getAllByTestId('roles-cell'));
      const membershipCells = getAllByTestId('member-count-cell');
      expect(roleCells[0]).toHaveTextContent('Admin');
      expect(roleCells[1]).toHaveTextContent('Role 1 and Role 2');
      expect(membershipCells[0]).toHaveTextContent('1 member');
      expect(membershipCells[1]).toHaveTextContent('99 members');
    });
  });

  describe('missing authorization', () => {
    beforeEach(() => {
      getSectionVisibilityMock.mockReturnValue({ teams: false });
    });

    it('should show placeholder instead of table', () => {
      const { baseElement, queryByTestId } = build();
      expect(queryByTestId('membership-table')).not.toBeInTheDocument();
      expect(baseElement).toHaveTextContent('Access forbidden');
    });
  });
});
