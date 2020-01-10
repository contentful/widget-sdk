import React from 'react';
import { mount } from 'enzyme';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { Button, Tab, Tooltip } from '@contentful/forma-36-react-components';

import reducer from 'redux/reducer';
import {
  TEAMS,
  TEAM_MEMBERSHIPS,
  USERS,
  ORG_MEMBERSHIPS,
  ORG_SPACES,
  TEAM_SPACE_MEMBERSHIPS
} from 'redux/datasets';
import ROUTES from 'redux/routes';
import Placeholder from 'app/common/Placeholder';
import TeamDetails from './TeamDetails';
import TeamDialog from './TeamDialog';
import TeamMembershipForm from './TeamMemberships/TeamMembershipForm';
import TeamSpaceMembershipForm from './TeamSpaceMemberships/TeamSpaceMembershipForm';
import TeamMemberships from './TeamMemberships/TeamMemberships';
import TeamSpaceMemberships from './TeamSpaceMemberships/TeamSpaceMemberships';

const renderComponent = (actions, props = { spaceMembershipsEnabled: true }) => {
  const store = createStore(reducer);
  store.dispatch = jest.fn(store.dispatch);
  actions.forEach(action => store.dispatch(action));
  const wrapper = mount(
    <Provider store={store}>
      <TeamDetails {...props} />
    </Provider>
  );
  return { store, wrapper };
};

const activeOrgId = 'testOrgId';
const activeTeamId = 'aTeam';

describe('TeamDetails', () => {
  let actions;
  beforeEach(() => {
    actions = [];
  });
  describe('teams loaded', () => {
    beforeEach(() => {
      actions.push({
        type: 'DATASET_LOADING',
        meta: { fetched: 100 },
        payload: {
          datasets: {
            [TEAMS]: [
              {
                name: 'A Team',
                description:
                  'a-team-description\nEditors and writers \n\nin our west coast office.',
                sys: {
                  type: 'Team',
                  id: 'aTeam',
                  createdAt: '2018-12-20T17:07:08Z',
                  createdBy: {
                    sys: {
                      type: 'Link',
                      linkType: 'User',
                      id: 'testUser1'
                    }
                  }
                }
              },
              {
                name: 'B Team',
                sys: {
                  type: 'Team',
                  id: 'bTeam',
                  createdAt: '2017-12-22T17:07:08Z',
                  createdBy: {
                    sys: {
                      type: 'Link',
                      linkType: 'User',
                      id: 'testUser2'
                    }
                  }
                }
              }
            ],
            [USERS]: [
              {
                firstName: 'User 1',
                lastName: 'LastName1',
                sys: { id: 'testUser1' }
              },
              {
                firstName: 'User 2',
                lastName: 'Lastname2',
                sys: { id: 'testUser2' }
              }
            ],
            [TEAM_MEMBERSHIPS]: []
          }
        }
      });
    });

    describe('is at route with non-existing team', () => {
      beforeEach(() => {
        // Location has to be set first as it defines the org scope
        actions.unshift({
          type: 'LOCATION_CHANGED',
          payload: {
            location: {
              pathname: ROUTES.organization.children.teams.children.team.build({
                orgId: activeOrgId,
                teamId: 'cTeam'
              })
            }
          }
        });
      });

      it('should show not-found placeholder with button back to list', () => {
        const { wrapper } = renderComponent(actions);

        const placeholder = wrapper.find(Placeholder).filter({ testId: 'not-found-placeholder' });
        expect(placeholder).toHaveLength(1);
        expect(placeholder.find(Button).props()).toHaveProperty(
          'href',
          ROUTES.organization.children.teams.build({ orgId: activeOrgId })
        );
        expect(wrapper.find('[data-test-id="team-details"]')).toHaveLength(0);
      });
    });

    describe('is at route with existing team', () => {
      beforeEach(() => {
        actions.unshift({
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

      it('should not show not-found placeholder', () => {
        const { wrapper } = renderComponent(actions);

        expect(wrapper.find(Placeholder).filter({ testId: 'not-found-placeholder' })).toHaveLength(
          0
        );
        expect(wrapper.find('[data-test-id="team-details"]')).toHaveLength(1);
      });

      it('should render team details', () => {
        const { wrapper } = renderComponent(actions);

        expect(wrapper.find('[data-test-id="team-card-name"]').text()).toEqual('A Team');

        const descriptionElement = wrapper.find('[data-test-id="team-card-description"]');
        expect(descriptionElement.text()).toContain('a-team-description');
        expect(descriptionElement.find('br')).toHaveLength(3);
        expect(wrapper.find('[data-test-id="creation-date"]').text()).toEqual('December 20, 2018');
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

          const placeholder = wrapper.find('EmptyStateContainer[data-test-id="empty-placeholder"]');
          expect(placeholder).toHaveLength(1);
          const addMemberButton = placeholder.find(Button).filter({ testId: 'add-button' });
          expect(addMemberButton).toHaveLength(0);
        });

        it('should render buttons disabled and with tooltips', () => {
          const { wrapper } = renderComponent(actions);

          const tooltips = wrapper.find(Tooltip).filter({ testId: 'read-only-tooltip' });
          expect(tooltips).toHaveLength(2);
          // ensures all buttons are wrapped in a tooltip
          expect(wrapper.find(Button)).toHaveLength(tooltips.find(Button).length);
          expect(
            tooltips
              .find(Button)
              .filter({ testId: 'delete-team-button' })
              .props()
          ).toHaveProperty('disabled', true);
          expect(
            tooltips
              .find(Button)
              .filter({ testId: 'edit-team-button' })
              .props()
          ).toHaveProperty('disabled', true);
        });

        it('should not render the creator name', () => {
          const { wrapper } = renderComponent(actions);

          expect(wrapper.find('[data-test-id="creator-name"]')).toHaveLength(0);
        });
      });

      describe('is admin of org and has required datasets', () => {
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
          actions.push({
            type: 'DATASET_LOADING',
            meta: { fetched: 100 },
            payload: {
              datasets: {
                [ORG_MEMBERSHIPS]: []
              }
            }
          });
        });

        it('should render the creator name', () => {
          const { wrapper } = renderComponent(actions);

          expect(wrapper.find('[data-test-id="creator-name"]').text()).toEqual('User 1 LastName1');
        });

        it('should render active delete button', () => {
          const { wrapper, store } = renderComponent(actions);

          const deleteButton = wrapper.find(Button).filter({ testId: 'delete-team-button' });
          expect(deleteButton.props()).toHaveProperty('disabled', false);
          deleteButton.simulate('click');
          expect(store.dispatch).toHaveBeenCalledWith({
            type: 'REMOVE_TEAM',
            payload: { teamId: 'aTeam' }
          });
        });

        it('should render active edit button', () => {
          const { wrapper } = renderComponent(actions);
          const editButton = wrapper.find(Button).filter({ testId: 'edit-team-button' });
          expect(editButton).toHaveLength(1);

          const getDialog = () => wrapper.find(TeamDialog).filter({ testId: 'edit-team-dialog' });
          expect(getDialog(wrapper).props()).toHaveProperty('isShown', false);
          editButton.simulate('click');
          expect(getDialog(wrapper).props()).toHaveProperty('isShown', true);
        });

        describe('team members tab is active and no team members', () => {
          const getWrapperWithTeamMemberTabActive = () => {
            const wrapper = renderComponent(actions).wrapper;
            wrapper
              .find(Tab)
              .filter({ testId: 'tab-teamMembers' })
              .props()
              .onSelect();
            // unfortunately necessary: https://airbnb.io/enzyme/docs/api/ShallowWrapper/update.html
            wrapper.update();
            return wrapper;
          };

          it('should show empty placeholder with add member button', () => {
            const placeholder = getWrapperWithTeamMemberTabActive().find(
              'EmptyStateContainer[data-test-id="empty-placeholder"]'
            );
            expect(placeholder).toHaveLength(1);
            const addMemberButton = placeholder.find(Button).filter({ testId: 'add-button' });
            expect(addMemberButton).toHaveLength(1);
          });

          it('should not render TeamMemberships', () => {
            expect(getWrapperWithTeamMemberTabActive().find(TeamMemberships)).toHaveLength(0);
          });

          describe('after clicking button', () => {
            let wrapperAfterClick;
            const getForm = wrapper => wrapper.find(TeamMembershipForm);

            beforeEach(() => {
              wrapperAfterClick = getWrapperWithTeamMemberTabActive();
              wrapperAfterClick
                .find(Button)
                .filter({ testId: 'add-button' })
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

          describe('with at least one team member', () => {
            beforeEach(() =>
              actions.push({
                type: 'DATASET_LOADING',
                meta: { fetched: 100 },
                payload: {
                  datasets: {
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
                      }
                    ],
                    [USERS]: [
                      {
                        firstName: 'B User',
                        lastName: 'Lastname 2',
                        avatarUrl: 'doesntMatter.com/blah',
                        email: 'userB2@test.com',
                        sys: { id: 'testUserB2' }
                      }
                    ]
                  }
                }
              })
            );

            it('should not render empty placeholder', () => {
              expect(
                getWrapperWithTeamMemberTabActive()
                  .find(Placeholder)
                  .filter({ testId: 'empty-placeholder' })
              ).toHaveLength(0);
            });

            it('should render TeamMemberships', () => {
              expect(getWrapperWithTeamMemberTabActive().find(TeamMemberships)).toHaveLength(1);
            });
          });
        });

        describe('organization members not added to the team remain', () => {
          beforeEach(() => {
            actions.push({
              type: 'DATASET_LOADING',
              meta: { fetched: 100 },
              payload: {
                datasets: {
                  [TEAM_MEMBERSHIPS]: [],
                  [USERS]: [
                    {
                      firstName: 'B User',
                      lastName: 'Lastname 2',
                      avatarUrl: 'doesntMatter.com/blah',
                      email: 'userB2@test.com',
                      sys: { id: 'testUserB2' }
                    }
                  ]
                }
              }
            });
          });

          it('should show add member button', () => {
            const { wrapper } = renderComponent(actions);
            const addMemberButton = wrapper.find(Button).filter({ testId: 'add-button' });
            expect(addMemberButton).toHaveLength(1);
            expect(addMemberButton.props()).toHaveProperty('disabled', false);
          });
        });

        describe('with all organization members added to the team', () => {
          beforeEach(() => {
            actions.push({
              type: 'DATASET_LOADING',
              meta: { fetched: 100 },
              payload: {
                datasets: {
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
                    }
                  ],
                  [USERS]: [
                    {
                      firstName: 'B User',
                      lastName: 'Lastname 2',
                      avatarUrl: 'doesntMatter.com/blah',
                      email: 'userB2@test.com',
                      sys: { id: 'testUserB2' }
                    }
                  ]
                }
              }
            });
          });

          it('should show add member button disabled and with tooltip', () => {
            const { wrapper } = renderComponent(actions);

            const tooltip = wrapper.find(Tooltip).filter({ testId: 'no-members-left-tooltip' });
            expect(tooltip).toHaveLength(1);
            expect(
              tooltip
                .find(Button)
                .filter({ testId: 'add-button' })
                .props()
            ).toHaveProperty('disabled', true);
          });
        });

        describe('team space memberships tab is active and no space team memberships', () => {
          const getWrapperWithSpaceMembershipTabActive = () => {
            const wrapper = renderComponent(actions).wrapper;

            wrapper
              .find(Tab)
              .filter({ testId: 'tab-spaceMemberships' })
              .props()
              .onSelect();
            // unfortunately necessary: https://airbnb.io/enzyme/docs/api/ShallowWrapper/update.html
            wrapper.update();
            return wrapper;
          };

          it('should show empty placeholder with add space membership button', () => {
            const placeholder = getWrapperWithSpaceMembershipTabActive().find(
              'EmptyStateContainer[data-test-id="empty-placeholder"]'
            );
            expect(placeholder).toHaveLength(1);
            const addSpaceMembershipButton = placeholder
              .find(Button)
              .filter({ testId: 'add-button' });
            expect(addSpaceMembershipButton).toHaveLength(1);
            expect(addSpaceMembershipButton).toHaveText('Add to space');
          });

          it('should not render TeamSpaceMemberships', () => {
            expect(
              getWrapperWithSpaceMembershipTabActive().find(TeamSpaceMemberships)
            ).toHaveLength(0);
          });

          describe('with at least one team space membership', () => {
            beforeEach(() =>
              actions.push({
                type: 'DATASET_LOADING',
                meta: { fetched: 100 },
                payload: {
                  datasets: {
                    [TEAM_SPACE_MEMBERSHIPS]: [
                      {
                        admin: false,
                        roles: [],
                        sys: {
                          id: 'membershipB2',
                          space: {
                            sys: {
                              type: 'Link',
                              linkType: ORG_SPACES,
                              id: 'testSpaceB2'
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
                    [ORG_SPACES]: [
                      {
                        name: 'Test Space B2',
                        sys: {
                          id: 'testSpaceB2'
                        }
                      }
                    ]
                  }
                }
              })
            );

            it('should not render empty placeholder', () => {
              expect(
                getWrapperWithSpaceMembershipTabActive()
                  .find(Placeholder)
                  .filter({ testId: 'empty-placeholder' })
              ).toHaveLength(0);
            });

            it('should render TeamSpaceMemberShips', () => {
              expect(
                getWrapperWithSpaceMembershipTabActive().find(TeamSpaceMemberships)
              ).toHaveLength(1);
            });
          });

          describe('after clicking button', () => {
            let wrapperAfterClick;
            const getForm = wrapper => wrapper.find(TeamSpaceMembershipForm);

            beforeEach(() => {
              wrapperAfterClick = getWrapperWithSpaceMembershipTabActive();
              wrapperAfterClick
                .find(Button)
                .filter({ testId: 'add-button' })
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

  describe('is at route with existing team without description', () => {
    beforeEach(() => {
      actions.unshift({
        type: 'LOCATION_CHANGED',
        payload: {
          location: {
            pathname: ROUTES.organization.children.teams.children.team.build({
              orgId: activeOrgId,
              teamId: 'bTeam'
            })
          }
        }
      });
    });

    it('should not render team details', () => {
      const { wrapper } = renderComponent(actions);

      expect(wrapper.find('[data-test-id="team-card-description"]')).toHaveLength(0);
    });
  });
});
