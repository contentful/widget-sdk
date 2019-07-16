import { defaultRequestsMock } from '../../../util/factories';
import { singleUser } from '../../../interactions/users';
import {
  successfulGetEntryTasksInteraction,
  tasksErrorResponse,
  taskCreateRequest,
  taskUpdateOpenRequest,
  taskUpdateResolvedRequest
} from '../../../interactions/tasks';

import {
  getEditorInterfaceForDefaultContentType,
  getAllPublicContentTypesInDefaultSpace
} from '../../../interactions/content_types';
import { getDefaultEntry, getFirst7SnapshotsOfDefaultEntry } from '../../../interactions/entries';
import { generateMicrobackendStreamToken } from '../../../interactions/microbackend';
import * as state from '../../../util/interactionState';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';
import { FeatureFlag } from '../../../util/featureFlag';

const empty = require('../../../fixtures/responses/empty.json');
const users = require('../../../fixtures/responses/users.json');
const severalTasks = require('../../../fixtures/responses/tasks-several.json');

describe('Tasks entry editor sidebar', () => {
  before(() =>
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['tasks', 'entries', 'users', 'microbackend'],
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 2
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
      publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne
    });
    singleUser();
    getDefaultEntry.willReturnIt();
    getFirst7SnapshotsOfDefaultEntry.willReturnNone();
    getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar();
    generateMicrobackendStreamToken.willSucceed();

    cy.route('**/channel/**', []).as('shareJS');
  }

  context('tasks service error', () => {
    beforeEach(() => {
      tasksErrorResponse();
      visitEntry();
      cy.wait([`@${state.Tasks.INTERNAL_SERVER_ERROR}`]);
    });

    it('renders "Tasks" sidebar section with an error', () => {
      getTaskListError().should('be.visible');
    });
  });

  context('no tasks on the entry', () => {
    beforeEach(() => {
      const stateName = state.Tasks.NONE;
      successfulGetEntryTasksInteraction(stateName, severalTasks).as(stateName);
      visitEntry();
      cy.wait([`@${stateName}`]);
    });

    it('renders "Tasks" sidebar section', () => {
      getTasksSidebarSection().should('be.visible');
      getTaskListError().should('have.length', 0);
    });
  });

  context('several tasks on the entry', () => {
    beforeEach(() => {
      const stateName = state.Tasks.SEVERAL;
      successfulGetEntryTasksInteraction(stateName, severalTasks).as(stateName);
      visitEntry();
      cy.wait([`@${stateName}`]);
    });

    it('renders list of tasks', () => {
      getTasks().should('have.length', 3);
      severalTasks.items.forEach(({ assignment: { status } }, i: number) => {
        expectTask(getTasks().eq(i), { isResolved: status === 'resolved' });
      })
    });

    describe('updating a task', () => {
      it('updates tasks without error', () => {
        const updatedTaskData = {
          title: 'Updated task body!',
          assigneeId: users.items[1].sys.id
        }
        const stateName = state.Tasks.SEVERAL_ONE_OPEN;
        taskUpdateOpenRequest(updatedTaskData, stateName).successResponse().as(stateName);
        updateTaskAndSave(getTasks().first(), updatedTaskData);
        cy.wait([`@${stateName}`]);
      });

      it('resolves tasks without error', () => {
        const [openTask] = severalTasks.items;
        const updatedTaskData = {
          title: openTask.body,
          assigneeId: openTask.assignment.assignedTo.sys.id,
          taskId: openTask.sys.id
        }
        const stateName = state.Tasks.SEVERAL_ONE_RESOLVED;
        taskUpdateResolvedRequest(updatedTaskData, stateName).successResponse().as(stateName);
        const task = () => getTasks().first();
        expectTask(task(), { isResolved: false });
        getTaskCheckbox(task()).check();
        cy.wait([`@${stateName}`]);
        expectTask(task(), { isResolved: true });
      });

      it('reopens tasks without error', () => {
        const [, resolvedTask] = severalTasks.items;
        const updatedTaskData = {
          title: resolvedTask.body,
          assigneeId: resolvedTask.assignment.assignedTo.sys.id,
          taskId: resolvedTask.sys.id
        }
        const stateName = state.Tasks.SEVERAL_ONE_REOPENED;
        taskUpdateOpenRequest(updatedTaskData, stateName).successResponse().as(stateName);
        const task = () => getTasks().eq(1);
        getTaskCheckbox(task()).uncheck();
        cy.wait([`@${stateName}`]);
        expectTask(task(), { isResolved: false });
      });

      function updateTaskAndSave(task: Cypress.Chainable, { title, assigneeId }) {
        task.click();
        getTaskKebabMenu(task)
          .should('be.enabled')
          .click();
        getTaskKebabMenuItems(task)
          .getByTestId('edit-task')
          .click();
        getTaskBodyTextarea(task)
          .should('have.text', severalTasks.items[0].body)
          .clear()
          .type(title);
        selectTaskAssignee(assigneeId);
        saveUpdatedTask();
      }
    });
  });

  describe('creating a new task', () => {
    const newTaskData = { title: 'Great new task!', assigneeId: 'userID' };

    beforeEach(() => {
      successfulGetEntryTasksInteraction('noTasks', empty).as(state.Tasks.NONE);
    });

    context('task creation error', () => {
      beforeEach(() => {
        visitEntry();

        cy.wait([`@${state.Tasks.NONE}`]);
      });

      it('creates task on API and adds it to task list', () => {
        taskCreateRequest(newTaskData).errorResponse().as('task-creation-failed');

        createNewTaskAndSave(newTaskData);

        cy.wait(['@task-creation-failed']);

        getTasks().should('have.length', 0);
        getDraftTask().should('have.length', 1);
        // Can't use 'be.visible' because of element partly covered in sidebar.
        getDraftTaskError().should('not.have.css', 'display', 'none');
      });
    });

    context('task creation successful', () => {
      beforeEach(() => {
        visitEntry();

        cy.wait([`@${state.Tasks.NONE}`]);
      });

      it('creates task on API and adds it to task list', () => {
        taskCreateRequest(newTaskData).successResponse().as('task-creation-successful');

        createNewTaskAndSave(newTaskData);

        cy.wait(['@task-creation-successful']);

        getDraftTask().should('have.length', 0);
        getTasks().should('have.length', 1);
      });
    });

    function createNewTaskAndSave({ title, assigneeId }) {
      getCreateTaskAction()
        .should('be.enabled')
        .click();
      getDraftTask()
        .should('have.length', 1)
        .should('be.visible');
      getDraftTaskInput()
        .type(title)
        .should('have.value', title);
      getDraftAssigneeSelector().select(assigneeId);
      getDraftTaskSaveAction().click();
    }
  });
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
const getDraftAssigneeSelector = () => getSelectElement(getDraftTask());
const expectTask = (task: Cypress.Chainable, { isResolved }) =>
  getTaskCheckbox(task)
    .should('be.enabled')
    .should(isResolved ? 'have.attr' : 'not.have.attr', 'checked');
const getSelectElement = (chainable: Cypress.Chainable) =>
  chainable
    .getByTestId('task-assignee-select')
    .getByTestId('cf-ui-select');
const getDraftTaskSaveAction = () => getDraftTask().getByTestId('save-task');
const getDraftTaskError = () => getDraftTask().queryByTestId('cf-ui-validation-message');
const getTaskKebabMenu = (task: Cypress.Chainable) => task.getByTestId('cf-ui-icon-button');
const getTaskKebabMenuItems = (task: Cypress.Chainable) => task.getByTestId('cf-ui-dropdown-list-item')
const getTaskBodyTextarea = (task: Cypress.Chainable) => task.getByTestId('cf-ui-textarea')
const selectTaskAssignee = (assigneeId: string) => getSelectElement(cy).select(assigneeId);
const saveUpdatedTask = () => cy.getByTestId('save-task').click();
const getTaskCheckbox = (task: Cypress.Chainable) => task.find('[data-test-id="status-checkbox"]');
