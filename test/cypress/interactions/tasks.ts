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

export enum States {
  NONE = 'tasks/none',
  SEVERAL = 'tasks/several',
  INTERNAL_SERVER_ERROR = 'tasks/internal-server-error'
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

export const PROVIDER = 'tasks';

const GET_TASK_LIST = (deprecated: boolean = false): string => `${deprecated ? '[legacy api] ' : ''}a request to get all entry tasks for entry "${defaultEntryId}"`

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
      provider: PROVIDER,
      state: States.NONE,
      uponReceiving: GET_TASK_LIST(),
      withRequest: getEntryTasksRequest,
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('getAllTasksForDefaultEntry');

    return '@getAllTasksForDefaultEntry';
  },
  willReturnSeveral(deprecated) {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SEVERAL,
      uponReceiving: GET_TASK_LIST(deprecated),
      withRequest: getEntryTasksRequest,
      willRespondWith: {
        status: 200,
        body: severalTasksDefinition(deprecated)
      }
    }).as('getAllTasksForDefaultEntry');

    return '@getAllTasksForDefaultEntry';
  },
  willFailWithAnInternalServerError() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.INTERNAL_SERVER_ERROR,
      uponReceiving: GET_TASK_LIST(),
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
    provider: PROVIDER,
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
        state: States.NONE,
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
    willFailWithAnInternalServerError() {
      cy.addInteraction({
        ...interactionRequestInfo(false),
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
      provider: PROVIDER,
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
          state: States.SEVERAL,
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
        console.log({
          hello: "hello!",
          sys: {
            ...newTaskSysDefinition,
            version: newTaskSysDefinition.version + 1
          }
        })
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

export const updateTaskBodyAndAssignee = updateTask('taskId1', 'changeTaskId1BodyAndReassignUser', 'change body and assignee');
export const resolveTask = updateTask('taskId1', 'resolveTaskId1', `set status to "${TaskStates.RESOLVED}"`);
export const reopenTask = updateTask('taskId2', 'reopenTaskId2', `set "${TaskStates.RESOLVED}" task back to "${TaskStates.ACTIVE}"`);
