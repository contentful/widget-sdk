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
  severalTasksDefinition,
  getTaskDefinitionById
} from '../fixtures/responses/tasks-several.js';

const empty = {
  // Tasks doesn't currently support "total" like most other collection endpoints.
  ...omit(emptyWithTotal, 'total')
}

enum States {
  NONE = 'none',
  SEVERAL = 'several',
  INTERNAL_SERVER_ERROR = 'internal-server-error'
}

export enum TaskStates {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
}

export interface NewTask {
  body: string
  assigneeId: string
}

export interface TaskUpdate {
  body?: string
  assigneeId?: string
  status?: TaskStates
}

const providerState = (state: States): string => `tasks-v2/${state}`

const defaultHeader = {
  ...commonDefaultHeader,
  'x-contentful-enable-alpha-feature': 'comments-api'
}

const getEntryTasksRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/tasks`,
  headers: defaultHeader
};

export const getAllTasksForDefaultEntry = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'tasks-v2',
      state: providerState(States.NONE),
      uponReceiving: `a request to get all entry tasks for entry "${defaultEntryId}"`,
      withRequest: getEntryTasksRequest,
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('getAllTasksForDefaultEntry');

    return '@getAllTasksForDefaultEntry';
  },
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'tasks-v2',
      state: providerState(States.SEVERAL),
      uponReceiving: `a request to get all entry tasks for entry "${defaultEntryId}"`,
      withRequest: getEntryTasksRequest,
      willRespondWith: {
        status: 200,
        body: severalTasksDefinition
      }
    }).as('getAllTasksForDefaultEntry');

    return '@getAllTasksForDefaultEntry';
  },
  willFailWithAnInternalServerError() {
    cy.addInteraction({
      provider: 'tasks-v2',
      state: providerState(States.INTERNAL_SERVER_ERROR),
      uponReceiving: `a request to get all entry tasks for entry "${defaultEntryId}"`,
      withRequest: getEntryTasksRequest,
      willRespondWith: {
        status: 500,
        body: serverError
      }
    }).as('getAllTasksForDefaultEntry');

    return '@getAllTasksForDefaultEntry';
  }
}

export function createTask({ body, assigneeId }) {
  const alias = `createTask-for-${assigneeId}`;
  const newTask = {
    body,
    assignedTo: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: assigneeId,
      }
    },
    status: TaskStates.ACTIVE
  };

  const interactionRequestInfo = {
    provider: 'tasks-v2',
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
      const [{ sys: newTaskSys }] = severalTasksDefinition.items;
      cy.addInteraction({
        ...interactionRequestInfo,
        state: providerState(States.NONE),
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
        state: providerState(States.INTERNAL_SERVER_ERROR),
        willRespondWith: {
          status: 500,
          body: serverError
        }
      }).as(alias);

      return `@${alias}`;
    }
  }
}

function updateTask(taskId: string, change: string) {
  const alias = `update-task-${taskId}`
  return function (update: TaskUpdate) {
    const taskDefinition = getTaskDefinitionById(taskId);
    const { body, assigneeId, status } = update;
    const updatedTask = {
      body: body || taskDefinition.body,
      assignedTo: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: assigneeId || taskDefinition.assignedTo.sys.id,
        }
      },
      status: status || taskDefinition.status,
    };

    const interactionRequestInfo = {
      provider: 'tasks-v2',
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
          state: providerState(States.SEVERAL),
          willRespondWith: {
            status: 200,
            body: {
              ...updatedTask,
              sys: {
                ...newTaskSysDefinition,
                version: newTaskSysDefinition.version + 1
              },
            }
          }
        }).as(alias);
        
        return `@${alias}`;
      }
    }
  }
}

export function deleteTask() {
  const taskId = 'taskId1'
  const alias = `delete-task-${taskId}`

  const interactionRequestInfo = {
    provider: 'tasks-v2',
    uponReceiving: `a request to delete task "${taskId}"`,
    withRequest: {
      method: 'DELETE',
      path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/tasks/${taskId}`,
      headers: {
        ...defaultHeader,
        'X-Contentful-Version': '1'
      }
    } as RequestOptions
  };

  return {
    willSucceed() {
      cy.addInteraction({
        ...interactionRequestInfo,
        state: providerState(States.SEVERAL),
        willRespondWith: {
          status: 204
        }
      }).as(alias);
      
      return `@${alias}`;
    }
  }
}

export const updateTaskBodyAndAssignee = updateTask('taskId1', 'change body and assignee');
export const resolveTask = updateTask('taskId1', `set status to "${TaskStates.RESOLVED}"`);
export const reopenTask = updateTask('taskId2', `set "${TaskStates.RESOLVED}" task back to "${TaskStates.ACTIVE}"`);
