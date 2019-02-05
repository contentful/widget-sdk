import React from 'react';
import { mount } from 'enzyme';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducer from 'redux/reducer/index.es6';
import ROUTES from 'redux/routes.es6';
import { ORG_MEMBERSHIPS, TEAM_MEMBERSHIPS, TEAMS, USERS } from 'redux/datasets.es6';
import { Button, Table, Tooltip } from '@contentful/forma-36-react-components';
import Placeholder from 'app/common/Placeholder.es6';
import TeamMembershipForm from './TeamMembershipForm.es6';
import TeamMemberships from './TeamMemberships.es6';
import TeamMembershipRow from './TeamMembershipRow.es6';
import TeamMembershipRowPlaceholder from './TeamMembershipRowPlaceholder.es6';

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
    describe('empty team was loaded', () => {
      beforeEach(() => {
        actions.push({
          type: 'DATASET_LOADING',
          meta: { fetched: 100 },
          payload: {
            datasets: {
              [TEAMS]: [
                {
                  name: 'Team 1',
                  sys: {
                    type: 'Team',
                    id: activeTeamId
                  }
                }
              ],
              [TEAM_MEMBERSHIPS]: [],
              [ORG_MEMBERSHIPS]: []
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
        });
      });

      describe('memberships were added', () => {
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
                    lastName: 'LastName 100',
                    avatarUrl: 'doesntMatter.com/blah',
                    email: 'userA@test.com',
                    sys: { id: 'testUserA' }
                  },
                  {
                    firstName: 'User not in team',
                    lastName: 'LastName',
                    avatarUrl: 'doesntMatter.com/blah',
                    email: 'userX@test.com',
                    sys: { id: 'testUserX' }
                  }
                ],
                [TEAM_MEMBERSHIPS]: [
                  {
                    admin: false,
                    sys: {
                      id: 'membershipB2',
                      user: {
                        sys: {
                          type: 'Link',
                          linkType: USERS,
                          id: 'testUserB2'
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
                  },
                  {
                    admin: false,
                    sys: {
                      id: 'membershipB1',
                      user: {
                        sys: {
                          type: 'Link',
                          linkType: USERS,
                          id: 'testUserB1'
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
                  },
                  {
                    admin: false,
                    sys: {
                      id: 'membershipA',
                      user: {
                        sys: {
                          type: 'Link',
                          linkType: USERS,
                          id: 'testUserA'
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
                ],
                [ORG_MEMBERSHIPS]: []
              }
            }
          });
        });

        it('should render team members as sorted rows', () => {
          const { wrapper } = renderComponent(actions);

          const rows = wrapper.find(TeamMembershipRow);
          expect(rows).toHaveLength(3);
          expect(rows.get(0).props.membership.sys.id).toEqual('membershipA');
          expect(rows.get(1).props.membership.sys.id).toEqual('membershipB1');
          expect(rows.get(2).props.membership.sys.id).toEqual('membershipB2');
        });

        describe('has 2 pending add member requests', () => {
          beforeEach(() => {
            actions.push(
              { type: 'SUBMIT_NEW_TEAM_MEMBERSHIP', payload: { orgMembership: 'newMembership1' } },
              { type: 'SUBMIT_NEW_TEAM_MEMBERSHIP', payload: { orgMembership: 'newMembership2' } }
            );
          });

          it('should render 2 optimistic placeholders', () => {
            const { wrapper } = renderComponent(actions);

            expect(wrapper.find(TeamMembershipRowPlaceholder)).toHaveLength(2);
          });

          describe('one request confirmed', () => {
            beforeEach(() => {
              actions.push({
                type: 'ADD_TO_DATASET',
                payload: { dataset: TEAM_MEMBERSHIPS, item: { sys: { id: 'newMembership1' } } }
              });
            });

            it('should render 1 optimistic placeholder', () => {
              const { wrapper } = renderComponent(actions);

              expect(wrapper.find(TeamMembershipRowPlaceholder)).toHaveLength(1);
            });

            describe('second request confirmed', () => {
              beforeEach(() => {
                actions.push({
                  type: 'ADD_TO_DATASET',
                  payload: { dataset: TEAM_MEMBERSHIPS, item: { sys: { id: 'newMembership2' } } }
                });
              });

              it('should render no optimistic placeholders', () => {
                const { wrapper } = renderComponent(actions);

                expect(wrapper.find(TeamMembershipRowPlaceholder)).toHaveLength(0);
              });
            });

            describe('second request failed', () => {
              beforeEach(() => {
                actions.push({
                  type: 'SUBMIT_NEW_TEAM_MEMBERSHIP_FAILED',
                  meta: { orgMembership: 'newMembership2' }
                });
              });

              it('should render no optimistic placeholders', () => {
                const { wrapper } = renderComponent(actions);

                expect(wrapper.find(TeamMembershipRowPlaceholder)).toHaveLength(0);
              });
            });
          });
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

          it('should render disabled add member button with tooltip', () => {
            const { wrapper } = renderComponent(actions);

            // there should not be another button
            expect(wrapper.find(Button).filter({ testId: 'add-member-button' })).toHaveLength(1);
            // the only button should have a tooltip
            const buttonWithTooltip = wrapper
              .find(Tooltip)
              .find(Button)
              .filter({ testId: 'add-member-button' });
            expect(buttonWithTooltip.props()).toHaveProperty('disabled', true);
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

          it('should render active add member button in header', () => {
            const { wrapper } = renderComponent(actions);

            const button = wrapper
              .find('header')
              .find(Button)
              .filter({ testId: 'add-member-button' });
            expect(button.props()).toHaveProperty('disabled', false);
          });

          describe('after clicking button', () => {
            let wrapperAfterClick;
            const getForm = wrapper => wrapper.find(TeamMembershipForm);

            beforeEach(() => {
              wrapperAfterClick = renderComponent(actions).wrapper;
              wrapperAfterClick
                .find(Button)
                .filter({ testId: 'add-member-button' })
                .simulate('click');
            });

            it('should show add member form', () => {
              expect(getForm(wrapperAfterClick)).toHaveLength(1);
            });

            it('clicking cancel in the form should close it', () => {
              getForm(wrapperAfterClick)
                .find(Button)
                .filter({ testId: 'cancel-button' })
                .simulate('click');

              expect(getForm(wrapperAfterClick)).toHaveLength(0);
            });
          });
        });
      });
    });
  });
});
