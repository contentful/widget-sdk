import React from 'react';
import { mount } from 'enzyme';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { Button, Tab, Tooltip } from '@contentful/forma-36-react-components';

import reducer from 'redux/reducer/index.es6';
import { TEAMS, TEAM_MEMBERSHIPS, USERS, ORG_MEMBERSHIPS } from 'redux/datasets.es6';
import ROUTES from 'redux/routes.es6';
import Placeholder from 'app/common/Placeholder.es6';
import TeamDetails from './TeamDetails.es6';
import TeamDialog from './TeamDialog.es6';
import TeamMembershipForm from './TeamMemberships/TeamMembershipForm.es6';
import TeamSpaceMembershipForm from './TeamSpaceMemberships/TeamSpaceMembershipForm.es6';

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

      it('should render link to team list', () => {
        const { wrapper } = renderComponent(actions);

        expect(wrapper.find('a[data-test-id="link-to-list"]').props()).toHaveProperty(
          'href',
          ROUTES.organization.children.teams.build({ orgId: activeOrgId })
        );
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

      it('should render link to team list', () => {
        const { wrapper } = renderComponent(actions);

        expect(wrapper.find('a[data-test-id="link-to-list"]').props()).toHaveProperty(
          'href',
          ROUTES.organization.children.teams.build({ orgId: activeOrgId })
        );
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

          const placeholder = wrapper.find(Placeholder).filter({ testId: 'empty-placeholder' });
          expect(placeholder).toHaveLength(1);
          expect(placeholder.props().title).toContain('Team A');
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

        describe('team members tab is active', () => {
          let wrapperWithTeamMemberTabActive;
          beforeEach(() => {
            wrapperWithTeamMemberTabActive = renderComponent(actions).wrapper;
            wrapperWithTeamMemberTabActive
              .find(Tab)
              .filter({ testId: 'tab-teamMembers' })
              .props()
              .onSelect();
          });

          it('should show empty placeholder with add member button', () => {
            const placeholder = wrapperWithTeamMemberTabActive
              .find(Placeholder)
              .filter({ testId: 'empty-placeholder' });
            expect(placeholder).toHaveLength(1);
            expect(placeholder.props().title).toContain('Team A Team has no members');
            const addMemberButton = placeholder.find(Button).filter({ testId: 'add-button' });
            expect(addMemberButton).toHaveLength(1);
            expect(addMemberButton).toHaveText('Add a team member');
          });

          describe('after clicking button', () => {
            let wrapperAfterClick;
            const getForm = wrapper => wrapper.find(TeamMembershipForm);

            beforeEach(() => {
              wrapperAfterClick = wrapperWithTeamMemberTabActive;
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

        describe('team space memberships tab is active', () => {
          let wrapperWithSpaceMembershipTabActive;
          beforeEach(() => {
            wrapperWithSpaceMembershipTabActive = renderComponent(actions).wrapper;

            wrapperWithSpaceMembershipTabActive
              .find(Tab)
              .filter({ testId: 'tab-spaceMemberships' })
              .props()
              .onSelect();
            // unfortunately necessary: https://airbnb.io/enzyme/docs/api/ShallowWrapper/update.html
            wrapperWithSpaceMembershipTabActive.update();
          });

          it('should show empty placeholder with add space membership button', () => {
            const placeholder = wrapperWithSpaceMembershipTabActive
              .find(Placeholder)
              .filter({ testId: 'empty-placeholder' });
            expect(placeholder).toHaveLength(1);
            expect(placeholder.props().title).toContain('Team A Team is not in any space yet');
            const addSpaceMembershipButton = placeholder
              .find(Button)
              .filter({ testId: 'add-button' });
            expect(addSpaceMembershipButton).toHaveLength(1);
            expect(addSpaceMembershipButton).toHaveText('Add to space');
          });

          describe('after clicking button', () => {
            let wrapperAfterClick;
            const getForm = wrapper => wrapper.find(TeamSpaceMembershipForm);

            beforeEach(() => {
              wrapperAfterClick = wrapperWithSpaceMembershipTabActive;
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
