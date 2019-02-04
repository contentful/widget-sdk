import React from 'react';
import { mount } from 'enzyme';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { Button, TableCell } from '@contentful/forma-36-react-components';

import reducer from 'redux/reducer/index.es6';
import ROUTES from 'redux/routes.es6';
import { TEAM_MEMBERSHIPS, TEAMS } from 'redux/datasets.es6';
import TeamListRow from './TeamListRow.es6';
import TeamDialog from './TeamDialog.es6';

const renderComponent = (actions, team) => {
  const store = createStore(reducer);
  actions.forEach(action => store.dispatch(action));
  // this is only needed when we want to test for actions that are handled in middleware
  store.dispatch = jest.fn(store.dispatch);
  const wrapper = mount(
    <Provider store={store}>
      <TeamListRow team={team} />
    </Provider>
  );
  return { store, wrapper };
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

      it('should render details of given team with member count', () => {
        let { wrapper } = renderComponent(actions, teams[0]);

        expect(wrapper.find('[data-test-id="team-name"]').text()).toEqual('A Team');
        expect(wrapper.find('[data-test-id="team-description"]').text()).toEqual('A description');
        expect(
          wrapper
            .find(TableCell)
            .filter({ 'data-test-id': 'team-member-count' })
            .text()
            .split(' ')
        ).toContain('3');

        wrapper = renderComponent(actions, teams[1]).wrapper;

        const teamNameElement = wrapper.find('[data-test-id="team-name"]');
        expect(teamNameElement.props().href).toEqual(
          `/account/organizations/${activeOrgId}/teams/bTeam`
        );
        expect(teamNameElement.text()).toEqual('B Team');
        expect(wrapper.find('[data-test-id="team-description"]').text()).toEqual('');
        expect(
          wrapper
            .find(TableCell)
            .filter({ 'data-test-id': 'team-member-count' })
            .text()
            .split(' ')
        ).toContain('0');
      });

      describe('is member of org', () => {
        beforeEach(() => {
          actions.push({
            type: 'USER_UPDATE_FROM_TOKEN',
            payload: {
              user: {
                organizationMemberships: [
                  {
                    role: 'member',
                    organization: {
                      sys: {
                        id: activeOrgId
                      }
                    }
                  },
                  {
                    role: 'owner',
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

        it('should not have an edit or remove button', () => {
          const { wrapper } = renderComponent(actions, teams[0]);

          expect(wrapper.find(Button).filter({ testId: 'remove-team-button' })).toHaveLength(0);
          expect(wrapper.find(Button).filter({ testId: 'edit-team-button' })).toHaveLength(0);
        });
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
          const { wrapper } = renderComponent(actions, teams[0]);

          expect(wrapper.find(Button).filter({ testId: 'remove-team-button' })).toHaveLength(1);
          expect(wrapper.find(Button).filter({ testId: 'edit-team-button' })).toHaveLength(1);
        });

        it('clicking remove team should dispatch action for middleware', () => {
          const { wrapper, store } = renderComponent(actions, teams[0]);
          wrapper
            .find(Button)
            .filter({ testId: 'remove-team-button' })
            .simulate('click');

          expect(store.dispatch).toHaveBeenCalledWith({
            type: 'REMOVE_TEAM',
            payload: { teamId: 'aTeam' }
          });
        });

        it('clicking the edit button should open team edit dialog for the correct team', () => {
          const { wrapper } = renderComponent(actions, teams[0]);
          const getDialog = () => wrapper.find(TeamDialog).filter({ testId: 'team-edit-dialog' });

          expect(getDialog().props()).toHaveProperty('isShown', false);
          wrapper
            .find(Button)
            .filter({ testId: 'edit-team-button' })
            .simulate('click');
          expect(getDialog().props()).toHaveProperty('isShown', true);
          expect(getDialog().props()).toHaveProperty('initialTeam', teams[0]);
        });
      });
    });
  });
});
