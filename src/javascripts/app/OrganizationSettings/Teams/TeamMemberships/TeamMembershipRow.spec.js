import React from 'react';
import { createStore } from 'redux';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { Button, TableCell } from '@contentful/forma-36-react-components';
import reducer from 'redux/reducer/index.es6';
import UserCard from '../../Users/UserCard.es6';
import UnknownUser from '../../Users/UserDetail/UnknownUser.es6';

import TeamMembershipRow from './TeamMembershipRow.es6';
import ROUTES from '../../../../redux/routes.es6';

const renderComponent = (actions, membership) => {
  const store = createStore(reducer);
  store.dispatch = jest.fn(store.dispatch);
  actions.forEach(action => store.dispatch(action));
  const wrapper = mount(
    <Provider store={store}>
      <TeamMembershipRow membership={membership} />
    </Provider>
  );
  return { store, wrapper };
};

const activeOrgId = 'testOrg';
const activeTeamId = 'testTeam';

describe('TeamMembershipRow', () => {
  let membership;
  const actions = [];

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

    describe('is member of org; membership with known creator', () => {
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
        membership = {
          admin: false,
          sys: {
            id: 'membership1',
            user: {
              avatarUrl: 'test.com/avatar2',
              email: 'user1@test.com',
              sys: { id: 'testUser1' }
            },
            createdAt: '2019-01-25T10:33:15Z',
            createdBy: { firstName: 'test', lastName: 'User2', sys: { id: 'testUser2' } }
          }
        };
      });

      it('should have no remove button', () => {
        const { wrapper } = renderComponent(actions, membership);

        expect(wrapper.find(Button).filter({ testId: 'remove-button' })).toHaveLength(0);
      });

      it('should render membership details without creator', () => {
        const { wrapper } = renderComponent(actions, membership);

        expect(
          wrapper
            .find(TableCell)
            .filter({ 'data-test-id': 'created-at-cell' })
            .text()
        ).toEqual('January 25, 2019');
        expect(
          wrapper
            .find(UserCard)
            .filter({ testId: 'user-card' })
            .props()
        ).toHaveProperty('user', membership.sys.user);
        expect(wrapper.find(TableCell).filter({ 'data-test-id': 'created-by-cell' })).toHaveLength(
          0
        );
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

      describe('membership with known creator', () => {
        beforeEach(() => {
          membership = {
            admin: false,
            sys: {
              id: 'membership1',
              user: {
                avatarUrl: 'test.com/avatar2',
                email: 'user1@test.com',
                sys: { id: 'testUser1' }
              },
              createdAt: '2019-01-25T10:33:15Z',
              createdBy: { firstName: 'test', lastName: 'User2', sys: { id: 'testUser2' } }
            }
          };
        });

        it('should render membership details', () => {
          const { wrapper } = renderComponent(actions, membership);

          expect(
            wrapper
              .find(TableCell)
              .filter({ 'data-test-id': 'created-at-cell' })
              .text()
          ).toEqual('January 25, 2019');
          expect(
            wrapper
              .find(UserCard)
              .filter({ testId: 'user-card' })
              .props()
          ).toHaveProperty('user', membership.sys.user);
          expect(
            wrapper
              .find(TableCell)
              .filter({ 'data-test-id': 'created-by-cell' })
              .text()
          ).toEqual('test User2');
        });
      });

      describe('membership with unknown creator', () => {
        beforeEach(() => {
          membership = {
            admin: false,
            sys: {
              id: 'membership1',
              user: {
                avatarUrl: 'test.com/avatar2',
                email: 'user1@test.com',
                sys: { id: 'testUser1' }
              },
              createdAt: '2019-01-25T10:33:15Z',
              createdBy: { sys: { id: 'testUser2' } }
            }
          };
        });

        it('should render hint with user id', () => {
          const { wrapper } = renderComponent(actions, membership);

          expect(wrapper.find(UnknownUser).props()).toHaveProperty(
            'id',
            membership.sys.createdBy.sys.id
          );
        });
      });

      it('should have working remove button', () => {
        const { wrapper, store } = renderComponent(actions, membership);

        wrapper
          .find(Button)
          .filter({ testId: 'remove-button' })
          .simulate('click');
        expect(store.dispatch).toHaveBeenCalledWith({
          type: 'REMOVE_TEAM_MEMBERSHIP',
          payload: { teamMembershipId: membership.sys.id }
        });
      });
    });
  });
});
