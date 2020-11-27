import { defaultRequestsMock } from '../../../util/factories';
import { queryFirst100UsersInDefaultSpace } from '../../../interactions/users';
import {
  NewTask,
  TaskUpdate,
  TaskStates,
  getAllTasksForDefaultEntry,
  createTask,
  updateTaskBodyAndAssignee,
  resolveTask,
  reopenTask,
  deleteTask,
} from '../../../interactions/tasks';

import {
  getEditorInterfaceForDefaultContentType,
  getAllPublicContentTypesInDefaultSpace,
} from '../../../interactions/content_types';
import { getDefaultEntry, getFirst7SnapshotsOfDefaultEntry } from '../../../interactions/entries';
import {
  PROVIDER as PRODUCT_CATALOG_PROVIDER,
  queryForScheduledPublishingOnEntryPage,
  queryForTasksInDefaultSpace,
  queryForBasicAppsInDefaultSpace,
  queryForContentTagsInDefaultSpace,
  queryForReleasesInDefaultSpace,
  getLaunchAppFeatureInDefaultSpace,
} from '../../../interactions/product_catalog_features';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';

const users = require('../../../fixtures/responses/users.json');
import { severalTasksDefinition } from '../../../fixtures/responses/tasks-several.js';

describe('Tasks entry editor sidebar', () => {
  before(() =>
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['tasks-v2', 'entries', 'users', 'microbackend', PRODUCT_CATALOG_PROVIDER],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    })
  );

  beforeEach(() => {
    cy.resetAllFakeServers();
  });

  function visitEntry() {
    const interactions = basicServerSetUpWithEntry();

    cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);

    cy.wait(interactions);
  }

  function basicServerSetUpWithEntry(): string[] {
    cy.server();
    cy.route('**/channel/**', []).as('shareJS');

    return [
      queryForScheduledPublishingOnEntryPage.willFindFeatureEnabled(),
      ...defaultRequestsMock({
        publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne,
      }),
      queryFirst100UsersInDefaultSpace.willFindSeveral(),
      getDefaultEntry.willReturnIt(),
      getFirst7SnapshotsOfDefaultEntry.willReturnNone(),
      getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
    ];
  }

  context('tasks service error', () => {
    beforeEach(() => {
      const interactions = [
        queryForTasksInDefaultSpace.willFindFeatureEnabled(),
        queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
        queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),
        getAllTasksForDefaultEntry.willFailWithAnInternalServerError(),
        queryForReleasesInDefaultSpace.willFindFeatureEnabled(),
        getLaunchAppFeatureInDefaultSpace.willFindFeatureEnabled(),
      ];

      visitEntry();

      cy.wait(interactions);
    });

    it('renders "Tasks" sidebar section with an error', () => {
      getTaskListError().should('be.visible');
    });
  });

  context('no tasks on the entry', () => {
    beforeEach(() => {
      const interactions = [
        queryForTasksInDefaultSpace.willFindFeatureEnabled(),
        queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
        queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),
        getAllTasksForDefaultEntry.willReturnNone(),
        queryForReleasesInDefaultSpace.willFindFeatureEnabled(),
        getLaunchAppFeatureInDefaultSpace.willFindFeatureEnabled(),
      ];

      visitEntry();

      cy.wait(interactions);
    });

    it('renders "Tasks" sidebar section', () => {
      getTasksSidebarSection().should('be.visible');
      getTaskListError().should('have.length', 0);
    });
  });

  context('several tasks on the entry', () => {
    beforeEach(() => {
      const interactions = [
        queryForTasksInDefaultSpace.willFindFeatureEnabled(),
        queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
        queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),
        getAllTasksForDefaultEntry.willReturnSeveral(),
        queryForReleasesInDefaultSpace.willFindFeatureEnabled(),
        getLaunchAppFeatureInDefaultSpace.willFindFeatureEnabled(),
      ];

      visitEntry();

      cy.wait(interactions);
    });

    it('renders list of tasks', () => {
      getTasks().should('have.length', 3);

      severalTasksDefinition.items.forEach(({ status }, i: number) => {
        expectTask(getTasks().eq(i), { isResolved: status === TaskStates.RESOLVED });
      });
    });

    describe('deleting a task', () => {
      it('deletes without error', () => {
        const interaction = deleteTask().willSucceed();

        deleteTaskUsingKebabMenu(getTasks().first());

        cy.wait(interaction);
      });

      function getDeleteTaskKebabMenuItem(task: Cypress.Chainable): Cypress.Chainable {
        task.click();

        getTaskKebabMenu(task).should('be.enabled').click();

        return getTaskKebabMenuItems().get('[data-test-id="delete-task"]').debug();
      }

      function deleteTaskUsingKebabMenu(task) {
        getDeleteTaskKebabMenuItem(task).click();
        cy.findByTestId('cf-ui-modal-confirm-confirm-button').click();
      }
    });

    describe('updating a task', () => {
      it('changes task body and assignee without error', () => {
        const taskUpdate: TaskUpdate = {
          body: 'Updated task body!',
          assigneeId: users.items[1].sys.id,
        };
        const interaction = updateTaskBodyAndAssignee(taskUpdate).willSucceed();

        updateTaskAndSave(getTasks().first(), taskUpdate);

        cy.wait(interaction);
      });

      it('resolves tasks without error', () => {
        const taskUpdate: TaskUpdate = {
          status: TaskStates.RESOLVED,
        };
        const interaction = resolveTask(taskUpdate).willSucceed();

        const task = () => getTasks().first();
        expectTask(task(), { isResolved: false });
        getTaskCheckbox(task()).check();

        cy.wait(interaction);

        expectTask(task(), { isResolved: true });
      });

      it('restricts editing resolved tasks', () => {
        const taskUpdate: TaskUpdate = {
          status: TaskStates.RESOLVED,
        };
        const interaction = resolveTask(taskUpdate).willSucceed();

        const task = () => getTasks().first();
        expectTask(task(), { isResolved: false });
        getTaskCheckbox(task()).check();

        cy.wait(interaction);

        getEditTaskKebabMenuItem(task()).should('have.length', 0);
      });

      it('reopens tasks without error', () => {
        const taskUpdate: TaskUpdate = {
          status: TaskStates.ACTIVE,
        };
        const interaction = reopenTask(taskUpdate).willSucceed();

        const task = () => getTasks().eq(1);
        expectTask(task(), { isResolved: true });
        getTaskCheckbox(task()).uncheck();

        cy.wait(interaction);

        expectTask(task(), { isResolved: false });
      });

      function getEditTaskKebabMenuItem(task: Cypress.Chainable): Cypress.Chainable {
        task.click();

        getTaskKebabMenu(task).should('be.enabled').click();

        return getTaskKebabMenuItems().get('[data-test-id="edit-task"]');
      }

      function updateTaskAndSave(task: Cypress.Chainable, { body, assigneeId }: TaskUpdate) {
        getEditTaskKebabMenuItem(task).click();
        if (body) {
          getTaskBodyTextarea()
            .should('have.text', severalTasksDefinition.items[0].body)
            .clear()
            .type(body);
        }
        if (assigneeId) {
          selectTaskAssignee(assigneeId);
        }
        saveUpdatedTask();
      }
    });
  });

  describe('creating a new task', () => {
    const newTaskData: NewTask = {
      body: 'Great new task!',
      assigneeId: '1AMbGlddLG0ISEoa1I423p',
    };

    let interactions: string[];
    beforeEach(() => {
      interactions = [
        queryForTasksInDefaultSpace.willFindFeatureEnabled(),
        queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
        queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),
        getAllTasksForDefaultEntry.willReturnNone(),
        queryForReleasesInDefaultSpace.willFindFeatureEnabled(),
        getLaunchAppFeatureInDefaultSpace.willFindFeatureEnabled(),
      ];
    });

    context('task creation error', () => {
      beforeEach(() => {
        visitEntry();

        cy.wait(interactions);
      });

      it('creates task on API and adds it to task list', () => {
        const interaction = createTask(newTaskData).willFailWithAnInternalServerError();

        createNewTaskAndSave(newTaskData);

        cy.wait(interaction);

        getTasks().should('have.length', 0);
        getDraftTask().should('have.length', 1);
        // Can't use 'be.visible' because of element partly covered in sidebar.
        getDraftTaskError().should('not.have.css', 'display', 'none');
      });
    });

    context('task creation successful', () => {
      beforeEach(() => {
        visitEntry();

        cy.wait(interactions);
      });

      it('creates task on API and adds it to task list', () => {
        const interaction = createTask(newTaskData).willSucceed();

        createNewTaskAndSave(newTaskData);

        cy.wait(interaction);

        getDraftTask().should('have.length', 0);
        getTasks().should('have.length', 1);
      });
    });

    function createNewTaskAndSave({ body, assigneeId }) {
      getCreateTaskAction().should('be.enabled').click();
      getDraftTask().should('have.length', 1).should('be.visible');
      getDraftTaskInput().type(body).should('have.value', body);
      getDraftAssigneeSelector().select(assigneeId);
      getDraftTaskSaveAction().click();
    }
  });
});

const getTasksSidebarSection = () => cy.findByTestId('sidebar-tasks-widget');
const getCreateTaskAction = () => getTasksSidebarSection().findByTestId('create-task');
const getTaskListError = () => getTasksSidebarSection().get('[data-test-id="task-list-error"]');
const getTasks = () => getTasksSidebarSection().get('[data-test-id="task"]');
const getDraftTask = () => getTasksSidebarSection().get('[data-test-id="task-draft"]');
const getDraftTaskInput = () => getDraftTask().findByTestId('task-title-input').find('textarea');
const getDraftAssigneeSelector = () => getSelectElement(getDraftTask());
const expectTask = (task: Cypress.Chainable, { isResolved }) =>
  getTaskCheckbox(task)
    .should('be.enabled')
    .should(isResolved ? 'have.attr' : 'not.have.attr', 'checked');
const getSelectElement = (chainable: Cypress.Chainable) =>
  chainable.findByTestId('task-assignee-select').findByTestId('cf-ui-select');
const getDraftTaskSaveAction = () => getDraftTask().findByTestId('save-task');
const getDraftTaskError = () => getDraftTask().findByTestId('cf-ui-validation-message');
const getTaskKebabMenu = (task: Cypress.Chainable) => task.findByTestId('cf-ui-icon-button');
const getTaskKebabMenuItems = () => cy.findByTestId('cf-ui-dropdown-list');
const getTaskBodyTextarea = () => cy.findByTestId('cf-ui-textarea');
const selectTaskAssignee = (assigneeId: string) => getSelectElement(cy).select(assigneeId);
const saveUpdatedTask = () => cy.findByTestId('save-task').click();
const getTaskCheckbox = (task: Cypress.Chainable) => task.find('[data-test-id="status-checkbox"]');
