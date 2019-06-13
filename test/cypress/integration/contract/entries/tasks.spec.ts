import {defaultRequestsMock} from '../../../util/factories';
import {singleUser, singleSpecificOrgUserResponse} from '../../../interactions/users';
import {successfulGetEntryTasksInteraction, tasksErrorResponse, taskCreatedResponse} from '../../../interactions/tasks';

import {
  singleContentTypeResponse,
  editorInterfaceWithoutSidebarResponse
} from '../../../interactions/content_types';
import {singleEntryResponse, noEntrySnapshotsResponse} from '../../../interactions/entries';
import {microbackendStreamToken} from '../../../interactions/microbackend';
import * as state from '../../../util/interactionState';
import {defaultEntryId, defaultSpaceId} from '../../../util/requests';

const empty = require('../../../fixtures/responses/empty.json');
const severalTasks = require('../../../fixtures/responses/tasks-several.json');
const featureFlag = 'feature-05-2019-content-workflows-tasks';

describe('Tasks entry editor sidebar', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'tasks',
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 3
    });

    cy.setAuthTokenToLocalStorage();
    window.localStorage.setItem('ui_enable_flags', JSON.stringify([featureFlag]));
    basicServerSetUpWithEntry();
    cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
  });

  function basicServerSetUpWithEntry() {
    defaultRequestsMock({
      publicContentTypesResponse: singleContentTypeResponse
    });
    singleUser();
    singleEntryResponse();
    noEntrySnapshotsResponse();
    editorInterfaceWithoutSidebarResponse();
    microbackendStreamToken();

    cy.route('**/channel/**', []).as('shareJS');
  }

  context('tasks service error', () => {
    beforeEach(() => {
      tasksErrorResponse();

      cy.wait([`@${state.Token.VALID}`, `@${state.Tasks.ERROR}`]);
    });

    it('renders "Tasks" sidebar section with an error', () => {
      getTaskListErrors().should('be.visible');
    });
  });

  context('no tasks on the entry', () => {
    beforeEach(() => {
      successfulGetEntryTasksInteraction('noTasks', empty).as(state.Tasks.NONE);

      cy.wait([`@${state.Token.VALID}`, `@${state.Tasks.NONE}`]);
    });

    it('renders "Tasks" sidebar section', () => {
      getTasksSidebarSection().should('be.visible');
      getTaskListErrors().should('have.length', 0)
    });

    describe('creating a new task', () => {
      const newTaskTitle = 'Great new task!';

      beforeEach(() => {
        taskCreatedResponse(newTaskTitle);
      });

      it('creates task on API and adds it to task list', () => {
        getCreateTaskAction()
          .should('be.enabled')
          .click();
        getDraftTask().should('be.visible');
        getDraftTaskInput()
          .type(newTaskTitle)
          .should('have.value', newTaskTitle);
        getDraftTaskSaveAction()
          .click();

        cy.wait([`@${state.Tasks.CREATE}`]);

        getDraftTask().should('have.length', 0);
        getTasks().should('have.length', 1);
      })
    });
  });

  context('several tasks on the entry', () => {
    beforeEach(() => {
      successfulGetEntryTasksInteraction('someTasks', severalTasks).as(state.Tasks.SEVERAL);
      singleSpecificOrgUserResponse();

      cy.wait([`@${state.Token.VALID}`, `@${state.Tasks.SEVERAL}`, `@${state.Users.SINGLE}`]);
    });

    it('renders list of tasks', () => {
      getTasks().should('have.length', 3);
    });
  });

  // TODO: Test case for receiving a list of mixed tasks/comments after the backend
  //  has implemented `assignedTo` and we can distinguish the two.
});

const getTasksSidebarSection = () => cy.getByTestId('sidebar-tasks-widget');
const getCreateTaskAction = () => getTasksSidebarSection().getByTestId('create-task');
const getTaskListErrors = () => getTasksSidebarSection()
  .get('[data-test-id="task-list-error"]');
const getTasks = () => getTasksSidebarSection().getAllByTestId('task');
const getDraftTask = () => getTasksSidebarSection().get('[data-test-id="task-draft"]');
const getDraftTaskInput = () => getDraftTask()
  .getByTestId('task-title-input').find('textarea');
const getDraftTaskSaveAction = () => getDraftTask().getByTestId('save-task');
