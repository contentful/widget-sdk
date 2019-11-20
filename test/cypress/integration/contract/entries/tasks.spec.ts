import { defaultRequestsMock } from '../../../util/factories';
import { queryFirst100UsersInDefaultSpace } from '../../../interactions/users';
import {
  NewTask,
  TaskUpdate,
  TaskStates,
  PROVIDER as TASKS_PROVIDER,
  getAllTasksForDefaultEntry,
  createTask,
  updateTaskBodyAndAssignee,
  resolveTask,
  reopenTask
} from '../../../interactions/tasks';

import {
  getEditorInterfaceForDefaultContentType,
  getAllPublicContentTypesInDefaultSpace
} from '../../../interactions/content_types';
import { getDefaultEntry, getFirst7SnapshotsOfDefaultEntry } from '../../../interactions/entries';
import {
  PROVIDER as PRODUCT_CATALOG_PROVIDER,
  queryForTasksAndAppsInDefaultSpace,
} from '../../../interactions/product_catalog_features'
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';

const users = require('../../../fixtures/responses/users.json');
import { severalTasksDefinition } from '../../../fixtures/responses/tasks-several.js';

describe('Tasks entry editor sidebar', () => {
  before(() =>
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: [
        TASKS_PROVIDER,
        'entries',
        'users',
        'microbackend',
        PRODUCT_CATALOG_PROVIDER
      ],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2
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
      queryForTasksAndAppsInDefaultSpace.willFindBothOfThem(),
      ...defaultRequestsMock({
        publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne
      }),
      queryFirst100UsersInDefaultSpace.willFindSeveral(),
      getDefaultEntry.willReturnIt(),
      getFirst7SnapshotsOfDefaultEntry.willReturnNone(),
      getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
    ];
  }

  context('tasks service error', () => {
    beforeEach(() => {
      const interaction = getAllTasksForDefaultEntry.willFailWithAnInternalServerError();

      visitEntry();

      cy.wait(interaction);
    });

    it('renders "Tasks" sidebar section with an error', () => {
      getTaskListError().should('be.visible');
    });
  });

  context('no tasks on the entry', () => {
    beforeEach(() => {
      const interaction = getAllTasksForDefaultEntry.willReturnNone();

      visitEntry();

      cy.wait(interaction);
    });

    it('renders "Tasks" sidebar section', () => {
      getTasksSidebarSection().should('be.visible');
      getTaskListError().should('have.length', 0);
    });
  });

  for (const deprecated of [true, false]) {
    context(`${deprecated ? '[against deprecated api] ' : ''}several tasks on the entry`, () => {
      beforeEach(() => {
        const interaction = getAllTasksForDefaultEntry.willReturnSeveral(deprecated);

        visitEntry();

        cy.wait(interaction);
      });

      it('renders list of tasks', () => {
        getTasks().should('have.length', 3);

        severalTasksDefinition(deprecated).items.forEach(({ status, assignment }, i: number) => {
          const st = deprecated ? assignment.status : status
          expectTask(getTasks().eq(i), { isResolved: st === TaskStates.RESOLVED });
        })
      });

      describe('updating a task', () => {
        it('changes task body and assignee without error', () => {
          const taskUpdate: TaskUpdate = {
            body: 'Updated task body!',
            assigneeId: users.items[1].sys.id
          }
          const interaction = updateTaskBodyAndAssignee(taskUpdate, deprecated).willSucceed();

          updateTaskAndSave(getTasks().first(), taskUpdate);

          cy.wait(interaction);
        });

        it('resolves tasks without error', () => {
          const taskUpdate: TaskUpdate = {
            status: TaskStates.RESOLVED
          }
          const interaction = resolveTask(taskUpdate, deprecated).willSucceed();

          const task = () => getTasks().first();
          expectTask(task(), { isResolved: false });
          getTaskCheckbox(task()).check();

          cy.wait(interaction);

          expectTask(task(), { isResolved: true });
        });

        it('restricts editing resolved tasks', () => {
          const taskUpdate: TaskUpdate = {
            status: TaskStates.RESOLVED
          }
          const interaction = resolveTask(taskUpdate, deprecated).willSucceed();

          const task = () => getTasks().first();
          expectTask(task(), { isResolved: false });
          getTaskCheckbox(task()).check();

          cy.wait(interaction);

          getEditTaskKebabMenuItem(task())
            .should('have.length', 0);
        });

        it('reopens tasks without error', () => {
          const taskUpdate: TaskUpdate = {
            status: TaskStates.ACTIVE
          }
          const interaction = reopenTask(taskUpdate, deprecated).willSucceed();

          const task = () => getTasks().eq(1);
          expectTask(task(), { isResolved: true });
          getTaskCheckbox(task()).uncheck();

          cy.wait(interaction);

          expectTask(task(), { isResolved: false });
        });

        function getEditTaskKebabMenuItem(task: Cypress.Chainable): Cypress.Chainable {
          task.click();

          getTaskKebabMenu(task)
            .should('be.enabled')
            .click();

          return getTaskKebabMenuItems(task)
            .get('[data-test-id="edit-task"]');
        }

        function updateTaskAndSave(task: Cypress.Chainable, { body, assigneeId }: TaskUpdate) {
          getEditTaskKebabMenuItem(task).click();
          if (body) {
            getTaskBodyTextarea(task)
              .should('have.text', severalTasksDefinition(deprecated).items[0].body)
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
  }

  describe('creating a new task', () => {
    const newTaskData: NewTask = {
      body: 'Great new task!',
      assigneeId: 'userID'
    };

    let getAllTasksInteraction: string
    beforeEach(() => {
      getAllTasksInteraction = getAllTasksForDefaultEntry.willReturnNone();
    });

    context('task creation error', () => {
      beforeEach(() => {
        visitEntry();

        cy.wait(getAllTasksInteraction);
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

    for (const deprecated of [true, false]) {
      context(`${deprecated ? '[against deprecated api] ' : ''}task creation successful`, () => {
        beforeEach(() => {
          visitEntry();

          cy.wait(getAllTasksInteraction);
        });

        it('creates task on API and adds it to task list', () => {
          const interaction = createTask(newTaskData).willSucceed(deprecated);

          createNewTaskAndSave(newTaskData);

          cy.wait(interaction);

          getDraftTask().should('have.length', 0);
          getTasks().should('have.length', 1);
        });
      });
    }

    function createNewTaskAndSave({ body, assigneeId }) {
      getCreateTaskAction()
        .should('be.enabled')
        .click();
      getDraftTask()
        .should('have.length', 1)
        .should('be.visible');
      getDraftTaskInput()
        .type(body)
        .should('have.value', body);
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
