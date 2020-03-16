import React from 'react';
import 'jest-enzyme';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { Table, TableBody } from '@contentful/forma-36-react-components';
import { render, screen, fireEvent } from '@testing-library/react';

import reducer from 'redux/reducer';
import ROUTES from 'redux/routes';
import { TEAM_MEMBERSHIPS, TEAMS } from 'redux/datasets';
import TeamListRow from './TeamListRow';

const renderComponent = (actions, team) => {
  const store = createStore(reducer);
  actions.forEach(action => store.dispatch(action));
  // this is only needed when we want to test for actions that are handled in middleware
  store.dispatch = jest.fn(store.dispatch);
  return render(
    <Provider store={store}>
      <Table>
        <TableBody>
          <TeamListRow team={team} showTeamLinks />
        </TableBody>
      </Table>
    </Provider>
  );
};

const activeOrgId = 'testOrg';

describe('TeamListRow', () => {
  let actions;
  beforeEach(() => {
    actions = [];
  });
  describe('an org is selected', () => {
    beforeEach(() => {
      actions.push({
        type: 'LOCATION_CHANGED',
        payload: {
          location: { pathname: ROUTES.organization.build({ orgId: activeOrgId }) }
        }
      });
    });

    describe('teams and memberships were loaded', () => {
      const teams = [
        {
          name: 'A Team',
          description: 'A description',
          sys: {
            type: 'Team',
            id: 'aTeam'
          }
        },
        {
          name: 'B Team',
          sys: {
            type: 'Team',
            id: 'bTeam'
          }
        },
        {
          name: 'C Team',
          description: 'Editors and writers in our west east office.',
          sys: {
            type: 'Team',
            id: 'cTeam'
          }
        }
      ];
      beforeEach(() => {
        actions.push({
          type: 'DATASET_LOADING',
          meta: { fetched: 100 },
          payload: {
            datasets: {
              [TEAMS]: teams,
              [TEAM_MEMBERSHIPS]: [
                {
                  sys: {
                    type: 'TeamMembership',
                    id: 'membership1',
                    team: {
                      sys: {
                        type: 'Link',
                        linkType: 'Team',
                        id: 'aTeam'
                      }
                    }
                  }
                },
                {
                  sys: {
                    type: 'TeamMembership',
                    id: 'membership2',
                    team: {
                      sys: {
                        type: 'Link',
                        linkType: 'Team',
                        id: 'aTeam'
                      }
                    }
                  }
                },
                {
                  sys: {
                    type: 'TeamMembership',
                    id: 'membership3',
                    team: {
                      sys: {
                        type: 'Link',
                        linkType: 'Team',
                        id: 'aTeam'
                      }
                    }
                  }
                },
                {
                  sys: {
                    type: 'TeamMembership',
                    id: 'membership4',
                    team: {
                      sys: {
                        type: 'Link',
                        linkType: 'Team',
                        id: 'cTeam'
                      }
                    }
                  }
                }
              ]
            }
          }
        });
      });

      it('should render details of given team with member count with link', () => {
        const { getByTestId } = renderComponent(actions, teams[1]);
        const teamNameElement = getByTestId('team-name');

        expect(teamNameElement.href).toEqual(
          expect.stringContaining(`account/organizations/${activeOrgId}/teams/bTeam`)
        );
        expect(getByTestId('team-description')).toHaveTextContent('');
        expect(getByTestId('team-member-count')).toHaveTextContent('0 members');
      });

      describe('is admin of org', () => {
        beforeEach(() => {
          actions.push({
            type: 'USER_UPDATE_FROM_TOKEN',
            payload: {
              user: {
                organizationMemberships: [
                  {
                    role: 'admin',
                    organization: {
                      sys: {
                        id: activeOrgId
                      }
                    }
                  },
                  {
                    role: 'member',
                    organization: {
                      sys: {
                        id: 'otherOrg'
                      }
                    }
                  }
                ]
              }
            }
          });
        });

        it('should have an edit and remove button', () => {
          const { getByTestId } = renderComponent(actions, teams[0]);

          fireEvent.click(getByTestId('user-space-list.menu.trigger'));

          expect(screen.getByTestId('remove-team-button')).toBeInTheDocument();
          expect(screen.getByTestId('edit-team-button')).toBeInTheDocument();
        });

        it('clicking the edit button should open team edit dialog for the correct team', () => {
          const { getByTestId } = renderComponent(actions, teams[0]);

          fireEvent.click(getByTestId('user-space-list.menu.trigger'));

          const button = screen.getByTestId('edit-team-button');

          fireEvent.click(button.children[0]);
          expect(screen.getByTestId('team-form')).toBeInTheDocument();

          const teamInput = getByTestId('team-name-input').querySelector('input');
          expect(teamInput.value).toBe(`${teams[0].name}`);
        });
      });
    });
  });
});
