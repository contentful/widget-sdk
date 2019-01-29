import React from 'react';
import { createStore } from 'redux';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { noop } from 'lodash';
import { Option } from '@contentful/forma-36-react-components';
import reducer from 'redux/reducer/index.es6';
import ROUTES from 'redux/routes.es6';
import { ORG_MEMBERSHIPS, TEAM_MEMBERSHIPS, TEAMS, USERS } from 'redux/datasets.es6';
import TeamMembershipForm from './TeamMembershipForm.es6';

const renderComponent = (actions, onClose = noop) => {
  const store = createStore(reducer);
  store.dispatch = jest.fn(store.dispatch);
  actions.forEach(action => store.dispatch(action));
  const wrapper = mount(
    <Provider store={store}>
      <TeamMembershipForm onClose={onClose} />
    </Provider>
  );
  return { store, wrapper };
};

const activeOrgId = 'testOrg';
const activeTeamId = 'testTeam';

describe('TeamMembershipForm', () => {
  let actions;
  beforeEach(() => {
    actions = [];
  });

  describe('is at team location', () => {
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

    describe('all required data loaded', () => {
      beforeEach(() => {
        actions.push({
          type: 'DATASET_LOADING',
          payload: {
            datasets: {
              [TEAMS]: [
                {
                  sys: {
                    id: 'aTeam'
                  }
                },
                {
                  sys: {
                    id: 'bTeam'
                  }
                }
              ],
              [USERS]: [
                {
                  firstName: 'B User',
                  lastName: 'Lastname 2',
                  avatarUrl: 'doesntMatter.com/blah',
                  email: 'userB2@test.com',
                  sys: { id: 'testUserB2' }
                },
                {
                  firstName: 'B User',
                  lastName: 'Lastname 1',
                  avatarUrl: 'doesntMatter.com/blah',
                  email: 'B1@test.com',
                  sys: { id: 'testUserB1' }
                },
                {
                  firstName: 'A User',
                  lastName: 'LastName',
                  avatarUrl: 'doesntMatter.com/blah',
                  email: 'userA@test.com',
                  sys: { id: 'testUserA' }
                },
                {
                  firstName: 'User already in team',
                  lastName: 'LastName',
                  avatarUrl: 'doesntMatter.com/blah',
                  email: 'userX@test.com',
                  sys: { id: 'testUserX' }
                }
              ],
              [ORG_MEMBERSHIPS]: [
                {
                  role: 'member',
                  sys: {
                    id: 'orgMembershipB2',
                    user: {
                      sys: {
                        type: 'Link',
                        linkType: USERS,
                        id: 'testUserB2'
                      }
                    }
                  }
                },
                {
                  role: 'member',
                  sys: {
                    id: 'orgMembershipB1',
                    user: {
                      sys: {
                        type: 'Link',
                        linkType: USERS,
                        id: 'testUserB1'
                      }
                    }
                  }
                },
                {
                  role: 'member',
                  sys: {
                    id: 'orgMembershipA',
                    user: {
                      sys: {
                        type: 'Link',
                        linkType: USERS,
                        id: 'testUserA'
                      }
                    }
                  }
                },
                {
                  role: 'member',
                  sys: {
                    id: 'orgMembershipX',
                    user: {
                      sys: {
                        type: 'Link',
                        linkType: USERS,
                        id: 'testUserX'
                      }
                    }
                  }
                }
              ],
              [TEAM_MEMBERSHIPS]: [
                {
                  sys: {
                    id: 'membershipX',
                    user: {
                      sys: {
                        type: 'Link',
                        linkType: USERS,
                        id: 'testUserX'
                      }
                    },
                    organizationMembership: {
                      sys: {
                        type: 'Link',
                        linkType: ORG_MEMBERSHIPS,
                        id: 'orgMembershipX'
                      }
                    },
                    team: {
                      sys: {
                        type: 'Link',
                        linkType: TEAMS,
                        id: activeTeamId
                      }
                    }
                  }
                }
              ]
            }
          }
        });
      });

      it('should only have non-team members as sorted options', () => {
        const { wrapper } = renderComponent(actions);

        const options = wrapper.find(Option).filter('[data-test-id="user-select-option"]');
        expect(options).toHaveLength(3);
        expect(options.get(0).props.children).toEqual('A User LastName <userA@test.com>');
        expect(options.get(0).props).toHaveProperty('value', 'orgMembershipA');
        expect(options.get(1).props).toHaveProperty('value', 'orgMembershipB1');
        expect(options.get(2).props).toHaveProperty('value', 'orgMembershipB2');
      });
    });
  });
});
