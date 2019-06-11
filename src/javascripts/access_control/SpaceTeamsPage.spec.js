import React from 'react';
import { noop } from 'lodash';
import SpaceTeamsPage from './SpaceTeamsPage.es6';
import { render, waitForElement, cleanup } from '@testing-library/react';
import 'jest-dom/extend-expect';

import { createSpaceEndpoint as createSpaceEndpointMock } from 'data/EndpointFactory.es6';
import { getTeamsSpaceMembershipsOfSpace as getTeamsSpaceMembershipsOfSpaceMock } from './TeamRepository.es6';
import { getSectionVisibility as getSectionVisibilityMock } from './AccessChecker/index.es6';

jest.mock('./TeamRepository.es6', () => ({
  getTeamsSpaceMembershipsOfSpace: jest.fn()
}));

jest.mock('services/TokenStore.es6', () => ({
  getSpace: jest.fn().mockReturnValue(Promise.resolve({ name: 'TestSpace' }))
}));

jest.mock('data/EndpointFactory.es6', () => ({
  createSpaceEndpoint: jest.fn()
}));

jest.mock('./AccessChecker/index.es6', () => ({
  getSectionVisibility: jest.fn()
}));

const build = () => {
  return render(<SpaceTeamsPage spaceId="mySpace" onReady={noop} />);
};

describe('SpaceTeamsPage', () => {
  beforeEach(() => {
    getTeamsSpaceMembershipsOfSpaceMock.mockReturnValue(Promise.resolve([]));
    createSpaceEndpointMock.mockReturnValue(Promise.resolve({}));
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

    it('header should contain space name and team count', async () => {
      const { getByTestId } = build();

      // ensure rendering finished
      const header = await waitForElement(() => getByTestId('header'));
      expect(header).toHaveTextContent('TestSpace');
      expect(header).toHaveTextContent('(0)');
    });

    it('should create space endpoint', () => {
      build();
      expect(createSpaceEndpointMock).toHaveBeenCalled();
    });
  });

  describe('api returns space memberships', () => {
    beforeEach(() => {
      getTeamsSpaceMembershipsOfSpaceMock.mockReturnValue(
        Promise.resolve([
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
        ])
      );
    });

    it('should render correct count', async () => {
      const { getByTestId } = build();

      // ensure rendering finished
      const header = await waitForElement(() => getByTestId('header'));
      expect(header).toHaveTextContent('(2)');
    });

    it('should render rows with action buttons', async () => {
      const { getByTestId } = build();

      // ensure rendering finished
      await waitForElement(() => getByTestId('membership-row-membership1'));
      getByTestId('action-button-membership1');
      getByTestId('membership-row-membership2');
      getByTestId('action-button-membership2');
    });

    it('should render cells with team details', async () => {
      const { getByTestId } = build();

      // ensure rendering finished
      const teamCell1 = await waitForElement(() => getByTestId('team-cell-membership1'));
      expect(teamCell1).toHaveTextContent('TestTeam1');
      expect(teamCell1).toHaveTextContent('This is the first test team');
      const teamCell2 = getByTestId('team-cell-membership2');
      expect(teamCell2).toHaveTextContent('TestTeam2');
      expect(teamCell2).toHaveTextContent('This is the second test team');
    });

    it('should render cells with membership details', async () => {
      const { getByTestId } = build();

      // ensure rendering finished
      const roleCell1 = await waitForElement(() => getByTestId('roles-cell-membership1'));
      expect(roleCell1).toHaveTextContent('Admin');
      const roleCell2 = getByTestId('roles-cell-membership2');
      expect(roleCell2).toHaveTextContent('Role 1 and Role 2');
      const countCell1 = getByTestId('member-count-cell-membership1');
      expect(countCell1).toHaveTextContent('1 member');
      const countCell2 = getByTestId('member-count-cell-membership2');
      expect(countCell2).toHaveTextContent('99 members');
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
