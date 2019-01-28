import React from 'react';
import { mount } from 'enzyme';
import { createStore } from 'redux';
import reducer from 'redux/reducer/index.es6';
import ROUTES from 'redux/routes.es6';
import { Provider } from 'react-redux';
import { Button, Table } from '@contentful/forma-36-react-components';
import Placeholder from 'app/common/Placeholder.es6';
import TeamMembershipForm from './TeamMembershipForm.es6';
import TeamMemberships from './TeamMemberships.es6';

const renderComponent = actions => {
  const store = createStore(reducer);
  actions.forEach(action => store.dispatch(action));
  const wrapper = mount(
    <Provider store={store}>
      <TeamMemberships />
    </Provider>
  );
  return { store, wrapper };
};

const activeOrgId = 'testOrgId';
const activeTeamId = 'team1';

describe('TeamDetails', () => {
  let actions;
  beforeEach(() => {
    actions = [];
  });

  describe('is at team details route', () => {
    beforeEach(() => {
      actions.push({
        type: 'LOCATION_CHANGED',
        payload: {
          location: {
            pathname: ROUTES.organization.children.teams.children.team.build({
              orgId: activeOrgId,
              teamId: activeTeamId
            })
          }
        }
      });
    });

    // this component expects to only be rendered when data is already loaded
    // which is currently ensured in the TeamPage component
    describe('team was loaded', () => {
      beforeEach(() => {
        actions.push({
          type: 'DATASET_LOADING',
          payload: {
            datasets: {
              Team: [
                {
                  name: 'Team 1',
                  sys: {
                    type: 'Team',
                    id: activeTeamId
                  }
                }
              ],
              TeamMemberships: [],
              OrganizationMemberships: []
            }
          }
        });
      });

      it('should not render member table', () => {
        const { wrapper } = renderComponent(actions);

        expect(wrapper.find(Table).filter({ 'data-test-id': 'member-table' })).toHaveLength(0);
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

        it('should show empty placeholder without add member button', () => {
          const { wrapper } = renderComponent(actions);

          const placeholder = wrapper
            .find(Placeholder)
            .filter({ testId: 'no-members-placeholder' });
          expect(placeholder).toHaveLength(1);
          expect(placeholder.props().title).toContain('Team 1');
          const addMemberButton = placeholder.find(Button).filter({ testId: 'add-member-button' });
          expect(addMemberButton).toHaveLength(0);
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

        it('should show empty placeholder with add member button', () => {
          const { wrapper } = renderComponent(actions);

          const placeholder = wrapper
            .find(Placeholder)
            .filter({ testId: 'no-members-placeholder' });
          expect(placeholder).toHaveLength(1);
          expect(placeholder.props().title).toContain('Team 1');
          const addMemberButton = placeholder.find(Button).filter({ testId: 'add-member-button' });
          expect(addMemberButton).toHaveLength(1);
          expect(wrapper.find(TeamMembershipForm)).toHaveLength(0);
          addMemberButton.simulate('click');
          expect(wrapper.find(TeamMembershipForm)).toHaveLength(1);
        });
      });

      describe('memberships were added', () => {
        beforeEach(() => {
          actions.push({
            type: 'DATASET_LOADING',
            payload: {
              datasets: {
                TeamMemberships: [
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
                  }
                ]
              }
            }
          });
        });
      });
    });
  });
});
