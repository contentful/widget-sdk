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

export const provider = (deprecated: boolean) => deprecated ? 'tasks' : 'tasks-v2';
const providerState = (state: States, deprecated: boolean): string => `${provider(deprecated)}/${state}`

const GET_TASK_LIST = (deprecated: boolean): string => `${deprecated ? '[legacy api] ' : ''}a request to get all entry tasks for entry "${defaultEntryId}"`

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
  willReturnNone(deprecated: boolean) {
    cy.addInteraction({
      provider: provider(deprecated),
      state: providerState(States.NONE, deprecated),
      uponReceiving: GET_TASK_LIST(deprecated),
      withRequest: getEntryTasksRequest,
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('getAllTasksForDefaultEntry');

    return '@getAllTasksForDefaultEntry';
  },
  willReturnSeveral(deprecated: boolean) {
    cy.addInteraction({
      provider: provider(deprecated),
      state: providerState(States.SEVERAL, deprecated),
      uponReceiving: GET_TASK_LIST(deprecated),
      withRequest: getEntryTasksRequest,
      willRespondWith: {
        status: 200,
        body: severalTasksDefinition(deprecated)
      }
    }).as('getAllTasksForDefaultEntry');

    return '@getAllTasksForDefaultEntry';
  },
  willFailWithAnInternalServerError(deprecated: boolean) {
    cy.addInteraction({
      provider: provider(deprecated),
      state: providerState(States.INTERNAL_SERVER_ERROR, deprecated),
      uponReceiving: GET_TASK_LIST(deprecated),
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
  const newTaskDeprecated = {
    body,
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
  const interactionRequestInfo = (deprecated: boolean) => ({
    provider: provider(deprecated),
    uponReceiving: `${deprecated ? '[legacy api] ' : ''}a request to create a new task for user "${assigneeId}" on entry "${defaultEntryId}"`,
    withRequest: {
      method: 'POST',
      path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/tasks`,
      headers: {
        ...defaultHeader,
        'Content-Type': 'application/vnd.contentful.management.v1+json'
      },
      body: {
        ...newTaskDeprecated,
        ...newTask
      }
    } as RequestOptions
  });
  return {
    willSucceed(deprecated: boolean) {
      const newTaskSys = severalTasksDefinition(deprecated).items[0].sys;
      cy.addInteraction({
        ...interactionRequestInfo(deprecated),
        state: providerState(States.NONE, deprecated),
        willRespondWith: {
          status: 201,
          body: {
            sys: newTaskSys,
            ...(deprecated ? newTaskDeprecated : newTask),
          }
        }
      }).as(alias);

      return `@${alias}`;
    },
    willFailWithAnInternalServerError(deprecated: boolean) {
      cy.addInteraction({
        ...interactionRequestInfo(deprecated),
        state: providerState(States.INTERNAL_SERVER_ERROR, deprecated),
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
  return function (update: TaskUpdate, deprecated: boolean) {
    const taskDefinition = getTaskDefinitionById(taskId, false);
    const deprecatedTaskDefinition = getTaskDefinitionById(taskId, true);
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

    const updatedTaskDeprecated = {
      body: body || deprecatedTaskDefinition.body,
      assignment: {
        assignedTo: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: assigneeId || deprecatedTaskDefinition.assignment.assignedTo.sys.id,
          }
        },
        status: status === TaskStates.ACTIVE ? 'open' : (status || deprecatedTaskDefinition.assignment.status)
      }
    };

    const interactionRequestInfo = {
      provider: provider(deprecated),
      uponReceiving: `${deprecated ? '[legacy api] ' : ''}a request for task "${taskId}" to ${change}`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/tasks/${taskId}`,
        headers: {
          ...defaultHeader,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'X-Contentful-Version': '1'
        },
        body: {
          ...updatedTaskDeprecated,
          ...updatedTask
        }
      } as RequestOptions
    };

    return {
      willSucceed() {
        const { sys: newTaskSysDefinition } = severalTasksDefinition(deprecated).items.find((task: any) =>
          task.sys.id.getValue() === taskId)

        cy.addInteraction({
          ...interactionRequestInfo,
          state: providerState(States.SEVERAL, deprecated),
          willRespondWith: {
            status: 200,
            body: {
              ...(deprecated ? updatedTaskDeprecated : updatedTask),
              sys: {
                ...newTaskSysDefinition,
                version: newTaskSysDefinition.version + 1
              },
            }
          }
        }).as(alias);
        
        return `@${alias}`;
      },
      // TODO: Add a test actually using this or remove.
      willFailWithAnInternalServerError() {
        cy.addInteraction({
          ...interactionRequestInfo,
          state: providerState(States.INTERNAL_SERVER_ERROR, deprecated),
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

export const updateTaskBodyAndAssignee = updateTask('taskId1', 'change body and assignee');
export const resolveTask = updateTask('taskId1', `set status to "${TaskStates.RESOLVED}"`);
export const reopenTask = updateTask('taskId2', `set "${TaskStates.RESOLVED}" task back to "${TaskStates.ACTIVE}"`);
