import React from 'react';
import { createStore } from 'redux';
import { mount } from 'enzyme';
import 'jest-enzyme';
import { Provider } from 'react-redux';
import { noop } from 'lodash';
import { Button, Option, Select, Table, TableBody } from '@contentful/forma-36-react-components';
import reducer from 'redux/reducer';
import ROUTES from 'redux/routes';
import { ORG_MEMBERSHIPS, TEAM_MEMBERSHIPS, TEAMS, USERS } from 'redux/datasets';
import TeamMembershipForm from './TeamMembershipForm';

const renderComponent = (actions, onClose = noop) => {
  const store = createStore(reducer);
  store.dispatch = jest.fn(store.dispatch);
  actions.forEach(action => store.dispatch(action));
  const wrapper = mount(
    <Provider store={store}>
      <Table>
        <TableBody>
          <TeamMembershipForm onClose={onClose} />
        </TableBody>
      </Table>
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
          meta: { fetched: 100 },
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
                },
                {
                  firstName: null,
                  lastName: null,
                  avatarUrl: 'doesntMatter.com/blah',
                  email: 'userWithoutName@test.com',
                  sys: { id: 'testUserW' }
                },
                {
                  firstName: null,
                  lastName: null,
                  avatarUrl: 'doesntMatter.com/blah',
                  email: 'testSortingWithoutName@test.com',
                  sys: { id: 'testUserS' }
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
                },
                {
                  role: 'member',
                  sys: {
                    id: 'orgMembershipW',
                    user: {
                      sys: {
                        type: 'Link',
                        linkType: USERS,
                        id: 'testUserW'
                      }
                    }
                  }
                },
                {
                  role: 'member',
                  sys: {
                    id: 'orgMembershipS',
                    user: {
                      sys: {
                        type: 'Link',
                        linkType: USERS,
                        id: 'testUserS'
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

        const options = wrapper.find(Option).filter({ testId: 'user-select-option' });
        expect(options).toHaveLength(5);
        expect(options.get(0).props.children).toEqual(['A User LastName ', '<userA@test.com>']);
        expect(options.get(0).props).toHaveProperty('value', 'orgMembershipA');
        expect(options.get(1).props).toHaveProperty('value', 'orgMembershipB1');
        expect(options.get(2).props).toHaveProperty('value', 'orgMembershipB2');
        expect(options.get(3).props.children).toEqual([null, '<testSortingWithoutName@test.com>']);
        expect(options.get(4).props.children).toEqual([null, '<userWithoutName@test.com>']);
      });

      it('the close button should close the form', () => {
        const onClose = jest.fn(noop);
        const { wrapper } = renderComponent(actions, onClose);

        wrapper
          .find(Button)
          .filter({ testId: 'cancel-button' })
          .simulate('click');
        expect(onClose).toHaveBeenCalled();
      });

      it('add member button should be disabled', () => {
        const { wrapper } = renderComponent(actions);

        expect(
          wrapper
            .find(Button)
            .filter({ testId: 'add-member-button' })
            .props()
        ).toHaveProperty('disabled', true);
      });

      it('after membership was selected, button should be active and working', () => {
        const onClose = jest.fn(noop);
        const { wrapper, store } = renderComponent(actions, onClose);

        wrapper
          .find(Select)
          .filter({ testId: 'user-select' })
          .find('select')
          .simulate('change', { target: { value: 'orgMembershipB1' } });
        const button = wrapper.find(Button).filter({ testId: 'add-member-button' });

        expect(button.props()).toHaveProperty('disabled', false);
        button.simulate('click');
        expect(store.dispatch).toHaveBeenCalledWith({
          type: 'SUBMIT_NEW_TEAM_MEMBERSHIP',
          payload: { orgMembership: 'orgMembershipB1' }
        });
        expect(onClose).toHaveBeenCalled();
      });
    });
  });
});
