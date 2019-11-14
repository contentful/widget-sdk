import { omit } from 'lodash'
import {
  defaultSpaceId,
  defaultEntryId,
  defaultHeader as commonDefaultHeader
} from '../util/requests';
import { RequestOptions } from '@pact-foundation/pact-web';
const emptyWithTotal = require('../fixtures/responses/empty.json');
const serverError = require('../fixtures/responses/server-error.json');
import {
  definition as severalTasksDefinition,
  getTaskDefinitionById as getSeveralTasksTaskDefinitionById
} from '../fixtures/responses/tasks-several.js';

const empty = {
  // Tasks doesn't currently support "total" like most other collection endpoints.
  ...omit(emptyWithTotal, 'total'),
  // We also have to account for the temporary isPrePreview property.
  isPrePreview: true
}

export enum States {
  NONE = 'tasks/none',
  SEVERAL = 'tasks/several',
  INTERNAL_SERVER_ERROR = 'tasks/internal-server-error'
}

export enum TaskStates {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

export type TaskUpdate = {
  title?: string,
  assigneeId?: string,
  status?: TaskStates
}

export const PROVIDER = 'tasks';

const GET_TASK_LIST = `a request to get all entry tasks for entry "${defaultEntryId}"`

const defaultHeader = {
  ...commonDefaultHeader,
  'x-contentful-enable-alpha-feature': 'comments-api'
}

const getEntryCommentsAndTasksRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/tasks`,
  headers: defaultHeader
};

export const getAllCommentsForDefaultEntry = {
  willReturnNone() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.NONE,
      uponReceiving: GET_TASK_LIST,
      withRequest: getEntryCommentsAndTasksRequest,
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('getAllCommentsForDefaultEntry');

    return '@getAllCommentsForDefaultEntry';
  },
  willReturnSeveral() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SEVERAL,
      uponReceiving: GET_TASK_LIST,
      withRequest: getEntryCommentsAndTasksRequest,
      willRespondWith: {
        status: 200,
        body: severalTasksDefinition
      }
    }).as('getAllCommentsForDefaultEntry');

    return '@getAllCommentsForDefaultEntry';
  },
  willFailWithAnInternalServerError() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.INTERNAL_SERVER_ERROR,
      uponReceiving: GET_TASK_LIST,
      withRequest: getEntryCommentsAndTasksRequest,
      willRespondWith: {
        status: 500,
        body: serverError
      }
    }).as('getAllCommentsForDefaultEntry');

    return '@getAllCommentsForDefaultEntry';
  }
}

export function createTask({ title, assigneeId }) {
  const alias = `createTask-for-${assigneeId}`;
  const newTask = {
    body: title,
    assignment: {
      assignedTo: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: assigneeId,
        }
      },
      status: 'open'
    }
  };
  const interactionRequestInfo = {
    provider: PROVIDER,
    uponReceiving: `a request to create a new task for user "${assigneeId}" on entry "${defaultEntryId}"`,
    withRequest: {
      method: 'POST',
      path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/tasks`,
      headers: {
        ...defaultHeader,
        'Content-Type': 'application/vnd.contentful.management.v1+json'
      },
      body: newTask
    } as RequestOptions
  };
  return {
    willSucceed() {
      const newTaskSys = severalTasksDefinition.items[0].sys;
      cy.addInteraction({
        ...interactionRequestInfo,
        state: States.NONE,
        willRespondWith: {
          status: 201,
          body: {
            sys: newTaskSys,
            ...newTask,
          }
        }
      }).as(alias);

      return `@${alias}`;
    },
    willFailWithAnInternalServerError() {
      cy.addInteraction({
        ...interactionRequestInfo,
        state: States.INTERNAL_SERVER_ERROR,
        willRespondWith: {
          status: 500,
          body: serverError
        }
      }).as(alias);

      return `@${alias}`;
    }
  }
}

function updateTask(taskId: string, alias: string, change: string) {
  const taskDefinition = getSeveralTasksTaskDefinitionById(taskId);

  return function (update: TaskUpdate, ) {
    const { title, assigneeId, status } = update;
    const updatedTask = {
      body: title || taskDefinition.body,
      assignment: {
        assignedTo: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: assigneeId || taskDefinition.assignment.assignedTo.sys.id,
          }
        },
        status: status || taskDefinition.assignment.status
      }
    };

    const interactionRequestInfo = {
      provider: PROVIDER,
      uponReceiving: `a request for task "${taskId}" to ${change}`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/tasks/${taskId}`,
        headers: {
          ...defaultHeader,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'X-Contentful-Version': '1'
        },
        body: updatedTask
      } as RequestOptions
    };

    return {
      willSucceed() {
        const { sys: newTaskSysDefinition } = severalTasksDefinition.items.find((task: any) =>
          task.sys.id.getValue() === taskId)
        cy.addInteraction({
          ...interactionRequestInfo,
          state: States.SEVERAL,
          willRespondWith: {
            status: 200,
            body: {
              sys: {
                ...newTaskSysDefinition,
                version: newTaskSysDefinition.version + 1
              },
              ...updatedTask
            }
          }
        }).as(alias);

        return `@${alias}`;
      },
      // TODO: Add a test actually using this or remove.
      willFailWithAnInternalServerError() {
        cy.addInteraction({
          ...interactionRequestInfo,
          state: States.INTERNAL_SERVER_ERROR,
          willRespondWith: {
            status: 500,
            body: serverError
          }
        }).as(alias);

        return `@${alias}`;
      }
    }
  }
}

export const updateTaskTitleAndAssignee = updateTask('taskId1', 'changeTaskId1TitleAndReassignUser', 'change title and assignee');
export const resolveTask = updateTask('taskId1', 'resolveTaskId1', 'set status to "done"');
export const reopenTask = updateTask('taskId2', 'reopenTaskId2', 'set "done" task back to "open"');
