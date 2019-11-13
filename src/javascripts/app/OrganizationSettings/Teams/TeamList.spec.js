import React from 'react';
import { mount } from 'enzyme';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { Button, IconButton } from '@contentful/forma-36-react-components';

import reducer from 'redux/reducer/index';
import { TEAMS, TEAM_MEMBERSHIPS } from 'redux/datasets';
import ROUTES from 'redux/routes';
import Placeholder from 'app/common/Placeholder';
import TeamsEmptyState from './TeamsEmptyState';
import TeamList from './TeamList';
import TeamListRow from './TeamListRow';
import TeamDialog from './TeamDialog';
import ExperimentalFeatureNote from './ExperimentalFeatureNote';

const renderComponent = actions => {
  const store = createStore(reducer);
  actions.forEach(action => store.dispatch(action));
  const wrapper = mount(
    <Provider store={store}>
      <TeamList />
    </Provider>
  );
  return { store, wrapper };
};

const activeOrgId = 'testOrgId';
const currentUserId = 'testUserId';

describe('TeamList', () => {
  let actions;
  beforeEach(() => {
    actions = [];
  });

  describe('is at teams route', () => {
    beforeEach(() => {
      actions.push({
        type: 'LOCATION_CHANGED',
        payload: {
          location: { pathname: ROUTES.organization.children.teams.build({ orgId: activeOrgId }) }
        }
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
                }
              ]
            }
          }
        });
      });

      // this component expects to only be rendered when data is already loaded
      // which is currently ensured in the TeamPage component
      describe('3 teams were loaded and user is not member', () => {
        beforeEach(() => {
          actions.push({
            type: 'DATASET_LOADING',
            meta: { fetched: 100 },
            payload: {
              datasets: {
                [TEAMS]: [
                  {
                    name: 'B Team',
                    description: 'Editors and writers in our west coast office.',
                    sys: {
                      type: 'Team',
                      id: 'bTeam'
                    }
                  },
                  {
                    name: 'D Team',
                    description: 'Editors and writers in our west coast office.',
                    sys: {
                      type: 'Team',
                      id: 'dTeam'
                    }
                  },
                  {
                    name: 'A Team',
                    sys: {
                      type: 'Team',
                      id: 'aTeam'
                    }
                  }
                ],
                [TEAM_MEMBERSHIPS]: []
              }
            }
          });
        });

        it('should render experimental feature note', () => {
          const { wrapper } = renderComponent(actions);
          expect(wrapper.find(ExperimentalFeatureNote)).toHaveLength(1);
        });

        it('should render teams as rows, sorted by name', () => {
          const { wrapper } = renderComponent(actions);
          const rows = wrapper.find(TeamListRow);

          expect(rows).toHaveLength(3);
          expect(rows.get(0).props).toHaveProperty('team.name', 'A Team');
          expect(rows.get(1).props).toHaveProperty('team.name', 'B Team');
          expect(rows.get(2).props).toHaveProperty('team.name', 'D Team');
        });

        it('should show number of teams', () => {
          const { wrapper } = renderComponent(actions);
          expect(
            wrapper
              .find('[data-test-id="team-count"]')
              .text()
              .split(' ')
          ).toContain('3');
        });

        it('it should not render empty placeholder', () => {
          const { wrapper } = renderComponent(actions);

          expect(wrapper.find(Placeholder).filter({ testId: 'no-teams-placeholder' })).toHaveLength(
            0
          );
        });

        describe('team creation was started', () => {
          beforeEach(() => {
            actions.push({
              type: 'CREATE_NEW_TEAM',
              payload: {
                team: {
                  name: 'C Team',
                  description: 'Simple description'
                }
              }
            });
          });

          it('should show sorted pending placeholder', () => {
            const { wrapper } = renderComponent(actions);
            const rows = wrapper.find(TeamListRow);
            const placeholderProps = wrapper.find(TeamListRow).get(2).props;

            expect(rows).toHaveLength(4);
            expect(placeholderProps.team).toHaveProperty('name', 'C Team');
            expect(placeholderProps.team).toHaveProperty('sys.id', 'placeholder');
          });

          describe('team creation is successful on API', () => {
            beforeEach(() => {
              actions.push({
                type: 'ADD_TO_DATASET',
                payload: {
                  item: {
                    name: 'C Team',
                    description: 'Simple description',
                    sys: {
                      type: 'Team',
                      id: 'cTeam'
                    }
                  },
                  dataset: 'Team'
                }
              });
            });

            it('should replace placeholder', () => {
              const { wrapper } = renderComponent(actions);
              const rows = wrapper.find(TeamListRow);
              const newTeamRowProps = rows.get(2).props;

              expect(rows).toHaveLength(4);
              expect(newTeamRowProps.team).toHaveProperty('name', 'C Team');
              expect(newTeamRowProps.team).toHaveProperty('sys.id', 'cTeam');
            });
          });

          describe('team creation failed', () => {
            beforeEach(() => {
              actions.push({
                type: 'SUBMIT_NEW_TEAM_FAILED'
              });
            });

            it('should remove placeholder', () => {
              const { wrapper } = renderComponent(actions);
              const rows = wrapper.find(TeamListRow);

              expect(rows).toHaveLength(3);
              expect(rows.filter({ team: { sys: { id: 'placeholder' } } })).toHaveLength(0);
            });
          });

          describe('second team created before the first returned', () => {
            beforeEach(() => {
              actions.push({
                type: 'CREATE_NEW_TEAM',
                payload: {
                  team: {
                    name: 'C2 Team',
                    description: 'Simple description'
                  }
                }
              });
            });

            it('should show sorted pending placeholders', () => {
              const { wrapper } = renderComponent(actions);
              const rows = wrapper.find(TeamListRow);
              const placeholder1Props = wrapper.find(TeamListRow).get(2).props;
              const placeholder2Props = wrapper.find(TeamListRow).get(3).props;

              expect(rows).toHaveLength(5);
              expect(placeholder1Props.team).toHaveProperty('name', 'C Team');
              expect(placeholder1Props.team).toHaveProperty('sys.id', 'placeholder');
              expect(placeholder2Props.team).toHaveProperty('name', 'C2 Team');
              expect(placeholder2Props.team).toHaveProperty('sys.id', 'placeholder');
            });

            describe('team creations returned from server', () => {
              beforeEach(() => {
                actions.push({
                  type: 'ADD_TO_DATASET',
                  payload: {
                    item: {
                      name: 'C Team',
                      description: 'Simple description',
                      sys: {
                        type: 'Team',
                        id: 'cTeam'
                      }
                    },
                    dataset: 'Team'
                  }
                });
                actions.push({
                  type: 'ADD_TO_DATASET',
                  payload: {
                    item: {
                      name: 'C2 Team',
                      description: 'Simple description',
                      sys: {
                        type: 'Team',
                        id: 'c2Team'
                      }
                    },
                    dataset: 'Team'
                  }
                });
              });

              it('should replace placeholders', () => {
                const { wrapper } = renderComponent(actions);
                const rows = wrapper.find(TeamListRow);
                const newTeam1RowProps = rows.get(2).props;
                const newTeam2RowProps = rows.get(3).props;

                expect(rows).toHaveLength(5);
                expect(newTeam1RowProps.team).toHaveProperty('name', 'C Team');
                expect(newTeam1RowProps.team).toHaveProperty('sys.id', 'cTeam');
                expect(newTeam2RowProps.team).toHaveProperty('name', 'C2 Team');
                expect(newTeam2RowProps.team).toHaveProperty('sys.id', 'c2Team');
              });
            });

            // note that placeholders are removed in order of their creation
            // not dependent on which request failed
            // for simplicity sake rare edge cases where that would matter are not handled
            describe('one team creation failed', () => {
              beforeEach(() => {
                actions.push({
                  type: 'SUBMIT_NEW_TEAM_FAILED'
                });
              });

              it('should remove one placeholder', () => {
                const { wrapper } = renderComponent(actions);
                const rows = wrapper.find(TeamListRow);

                expect(rows).toHaveLength(4);
                expect(rows.filter({ team: { sys: { id: 'placeholder' } } })).toHaveLength(1);
              });

              describe('second team creation failed', () => {
                beforeEach(() => {
                  actions.push({
                    type: 'SUBMIT_NEW_TEAM_FAILED'
                  });
                });

                it('should remove other placeholder', () => {
                  const { wrapper } = renderComponent(actions);
                  const rows = wrapper.find(TeamListRow);

                  expect(rows).toHaveLength(3);
                  expect(rows.filter({ team: { sys: { id: 'placeholder' } } })).toHaveLength(0);
                });
              });
            });
          });
        });

        it('should be not be read only', () => {
          const { wrapper } = renderComponent(actions);
          expect(wrapper.find('[data-test-id="new-team-button"]').props()).toHaveProperty(
            'disabled',
            false
          );
          expect(wrapper.find('[data-test-id="read-only-tooltip"]')).toHaveLength(0);
        });

        const getDialog = wrapper =>
          wrapper.find(TeamDialog).filter({ testId: 'create-team-dialog' });

        it('should show dialog when clicking add team button', () => {
          const { wrapper } = renderComponent(actions);

          expect(getDialog(wrapper).props()).toHaveProperty('isShown', false);
          wrapper
            .find(Button)
            .filter({ testId: 'new-team-button' })
            .simulate('click');
          expect(getDialog(wrapper).props()).toHaveProperty('isShown', true);
        });

        it('should hide dialog when closing', () => {
          const { wrapper } = renderComponent(actions);

          wrapper
            .find(Button)
            .filter({ testId: 'new-team-button' })
            .simulate('click');

          wrapper
            .find(TeamDialog)
            .filter({ testId: 'create-team-dialog' })
            .find(IconButton)
            .filter({ label: 'Close' })
            .simulate('click');

          expect(getDialog(wrapper).props()).toHaveProperty('isShown', false);
        });
      });

      describe('empty team list was loaded', () => {
        beforeEach(() => {
          actions.push({
            type: 'DATASET_LOADING',
            meta: { fetched: 100 },
            payload: {
              datasets: {
                [TEAMS]: [],
                [TEAM_MEMBERSHIPS]: []
              }
            }
          });
        });

        it('should render the empty state', () => {
          const { wrapper } = renderComponent(actions);

          const emptyState = wrapper.find(TeamsEmptyState);
          expect(emptyState).toHaveLength(1);
          expect(emptyState.props().isAdmin).toBe(true);
        });
      });
    });

    describe('is member of org', () => {
      beforeEach(() => {
        actions.push({
          type: 'USER_UPDATE_FROM_TOKEN',
          payload: {
            user: {
              sys: { id: currentUserId },
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

      describe('3 teams were loaded and user is not member', () => {
        beforeEach(() => {
          actions.push({
            type: 'DATASET_LOADING',
            meta: { fetched: 100 },
            payload: {
              datasets: {
                [TEAMS]: [
                  {
                    name: 'B Team',
                    description: 'Editors and writers in our west coast office.',
                    sys: {
                      type: 'Team',
                      id: 'bTeam'
                    }
                  },
                  {
                    name: 'D Team',
                    description: 'Editors and writers in our west coast office.',
                    sys: {
                      type: 'Team',
                      id: 'dTeam'
                    }
                  },
                  {
                    name: 'A Team',
                    sys: {
                      type: 'Team',
                      id: 'aTeam'
                    }
                  }
                ],
                [TEAM_MEMBERSHIPS]: []
              }
            }
          });
        });

        it('should render the empty state', () => {
          const { wrapper } = renderComponent(actions);

          const emptyState = wrapper.find(TeamsEmptyState);
          expect(emptyState).toHaveLength(1);
          expect(emptyState.props().isAdmin).toBe(false);
        });
      });

      describe('empty team list was loaded', () => {
        beforeEach(() => {
          actions.push({
            type: 'DATASET_LOADING',
            meta: { fetched: 100 },
            payload: {
              datasets: {
                [TEAMS]: [],
                [TEAM_MEMBERSHIPS]: []
              }
            }
          });
        });

        it('it should not render table', () => {
          const { wrapper } = renderComponent(actions);

          expect(wrapper.find('[data-test-id="teams-table"]')).toHaveLength(0);
        });

        it('should render the empty state', () => {
          const { wrapper } = renderComponent(actions);

          const emptyState = wrapper.find(TeamsEmptyState);
          expect(emptyState).toHaveLength(1);
          expect(emptyState.props().isAdmin).toBe(false);
        });
      });

      describe('3 teams were loaded and user is member of 2', () => {
        beforeEach(() => {
          actions.push({
            type: 'DATASET_LOADING',
            meta: { fetched: 100 },
            payload: {
              datasets: {
                [TEAMS]: [
                  {
                    name: 'B Team',
                    description: 'Editors and writers in our west coast office.',
                    sys: {
                      type: 'Team',
                      id: 'bTeam'
                    }
                  },
                  {
                    name: 'D Team',
                    description: 'Editors and writers in our west coast office.',
                    sys: {
                      type: 'Team',
                      id: 'dTeam'
                    }
                  },
                  {
                    name: 'A Team',
                    sys: {
                      type: 'Team',
                      id: 'aTeam'
                    }
                  }
                ],
                [TEAM_MEMBERSHIPS]: [
                  {
                    admin: false,
                    sys: {
                      id: 'membership1',
                      user: { sys: { id: currentUserId } },
                      team: { sys: { id: 'dTeam' } }
                    }
                  },
                  {
                    admin: false,
                    sys: {
                      id: 'membership2',
                      user: { sys: { id: currentUserId } },
                      team: { sys: { id: 'aTeam' } }
                    }
                  }
                ]
              }
            }
          });
        });

        it('should render two rows', () => {
          const { wrapper } = renderComponent(actions);
          const rows = wrapper.find(TeamListRow);

          expect(rows).toHaveLength(2);
        });

        it('should be read only', () => {
          const { wrapper } = renderComponent(actions);

          expect(wrapper.find('[data-test-id="new-team-button"]').props()).toHaveProperty(
            'disabled',
            true
          );
          expect(wrapper.find('[data-test-id="read-only-tooltip"]')).toHaveLength(1);
        });
      });
    });
  });
});
