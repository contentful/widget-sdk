import { defaultRequestsMock } from '../../../util/factories';
import { singleUser, singleSpecificOrgUserResponse } from '../../../interactions/users';
import {
  successfulGetEntryTasksInteraction,
  tasksErrorResponse,
  taskCreatedResponse,
  taskNotCreatedErrorResponse
} from '../../../interactions/tasks';

import {
  singleContentTypeResponse,
  editorInterfaceWithoutSidebarResponse
} from '../../../interactions/content_types';
import { singleEntryResponse, noEntrySnapshotsResponse } from '../../../interactions/entries';
import { microbackendStreamToken } from '../../../interactions/microbackend';
import * as state from '../../../util/interactionState';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';
import { FeatureFlag } from '../../../util/featureFlag';

const empty = require('../../../fixtures/responses/empty.json');
const severalTasks = require('../../../fixtures/responses/tasks-several.json');

describe('Tasks entry editor sidebar', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'tasks',
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 3
    })
  );

  beforeEach(() => {
    cy.resetAllFakeServers();
    cy.enableFeatureFlags([FeatureFlag.CONTENT_WORKFLOW_TASKS, FeatureFlag.ENTRY_ACTIVITY]);
  });

  function visitEntry() {
    basicServerSetUpWithEntry();
    cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
    cy.wait([`@${state.Token.VALID}`]);
  }

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
      visitEntry();
      cy.wait([`@${state.Tasks.ERROR}`]);
    });

    it('renders "Tasks" sidebar section with an error', () => {
      getTaskListError().should('be.visible');
    });
  });

  context('no tasks on the entry', () => {
    beforeEach(() => {
      successfulGetEntryTasksInteraction('noTasks', empty).as(state.Tasks.NONE);
      visitEntry();
      cy.wait([`@${state.Tasks.NONE}`]);
    });

    it('renders "Tasks" sidebar section', () => {
      getTasksSidebarSection().should('be.visible');
      getTaskListError().should('have.length', 0);
    });
  });

  context('several tasks on the entry', () => {
    beforeEach(() => {
      successfulGetEntryTasksInteraction('someTasks', severalTasks).as(state.Tasks.SEVERAL);
      singleSpecificOrgUserResponse();
      visitEntry();
      cy.wait([`@${state.Tasks.SEVERAL}`, `@${state.Users.SINGLE}`]);
    });

    it('renders list of tasks', () => {
      getTasks().should('have.length', 3);
    });
  });

  describe('creating a new task', () => {
    const newTaskTitle = 'Great new task!';

    beforeEach(() => {
      successfulGetEntryTasksInteraction('noTasks', empty).as(state.Tasks.NONE);
    });

    context('task creation error', () => {
      beforeEach(() => {
        taskNotCreatedErrorResponse();
        visitEntry();
        cy.wait([`@${state.Tasks.NONE}`]);
      });

      it('creates task on API and adds it to task list', () => {
        createNewTaskAndSave(newTaskTitle);
        cy.wait([`@${state.Tasks.ERROR}`]);

        getTasks().should('have.length', 0);
        getDraftTask().should('have.length', 1);
        // Can't use 'be.visible' because of element partly covered in sidebar.
        getDraftTaskError().should('not.have.css', 'display', 'none');
      });
    });

    context('task creation successful', () => {
      beforeEach(() => {
        taskCreatedResponse(newTaskTitle);
        visitEntry();
        cy.wait([`@${state.Tasks.NONE}`]);
      });

      it('creates task on API and adds it to task list', () => {
        createNewTaskAndSave(newTaskTitle);

        cy.wait([`@${state.Tasks.CREATE}`]);

        getDraftTask().should('have.length', 0);
        getTasks().should('have.length', 1);
      });
    });

    function createNewTaskAndSave(taskTitle) {
      getCreateTaskAction()
        .should('be.enabled')
        .click();
      getDraftTask().should('be.visible');
      getDraftTaskInput()
        .type(taskTitle)
        .should('have.value', taskTitle);
      getDraftTaskSaveAction().click();
    }
  });

  // TODO: Test case for receiving a list of mixed tasks/comments after the backend
  //  has implemented `assignedTo` and we can distinguish the two.
});

const getTasksSidebarSection = () => cy.getByTestId('sidebar-tasks-widget');
const getCreateTaskAction = () => getTasksSidebarSection().getByTestId('create-task');
const getTaskListError = () => getTasksSidebarSection().get('[data-test-id="task-list-error"]');
const getTasks = () => getTasksSidebarSection().get('[data-test-id="task"]');
const getDraftTask = () => getTasksSidebarSection().get('[data-test-id="task-draft"]');
const getDraftTaskInput = () =>
  getDraftTask()
    .getByTestId('task-title-input')
    .find('textarea');
const getDraftTaskSaveAction = () => getDraftTask().getByTestId('save-task');
const getDraftTaskError = () => getDraftTask().queryByTestId('cf-ui-validation-message');
