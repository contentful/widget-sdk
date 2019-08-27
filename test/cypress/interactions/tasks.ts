import { omit } from 'lodash'
import {
  defaultSpaceId,
  defaultEntryId,
  defaultTaskId,
  defaultHeader as commonDefaultHeader
} from '../util/requests';
import { RequestOptions } from '@pact-foundation/pact-web';
const emptyWithTotal = require('../fixtures/responses/empty.json');
const serverError = require('../fixtures/responses/server-error.json');
import {
  definition as severalTasksDefinition,
} from '../fixtures/responses/tasks-several.js';

// Tasks doesn't currently support "total" like most other collection endpoints.
const empty = omit(emptyWithTotal, 'total')

export enum States {
  NONE = 'tasks/none',
  SEVERAL = 'tasks/several',
  INTERNAL_SERVER_ERROR = 'tasks/internal-server-error'
}

enum Status {
  OPEN = 'open',
  RESOLVED = 'resolved',
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

    return '@getAllCommentsForDefaultEntry';;
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
const capitalize = (str: string): string => str.length > 0 ?
  str[0].toUpperCase().concat(str.slice(1)) :
  ''

function changeTaskStatus(status: Status, stateName: States) {
  return function ({ title, assigneeId, taskId = defaultTaskId }, ) {
    const alias = `changeTask(${taskId})To${capitalize(status.toString())}`
    const updatedTask = {
      body: title,
      assignment: {
        assignedTo: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: assigneeId,
          }
        }
      }
    };

    const interactionRequestInfo = {
      provider: PROVIDER,
      uponReceiving: `a request to change status of task "${taskId}" to "${status}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/tasks/${taskId}`,
        headers: {
          ...defaultHeader,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'X-Contentful-Version': '1'
        },
        body: {
          ...updatedTask,
          assignment: { ...updatedTask.assignment, status }
        }
      } as RequestOptions
    };

    return {
      willSucceed() {
        const { sys: newTaskSysDefinition } = severalTasksDefinition.items.find((task: any) =>
          task.sys.id.getValue() === taskId)
        cy.addInteraction({
          ...interactionRequestInfo,
          state: stateName,
          willRespondWith: {
            status: 200,
            body: {
              sys: {
                ...newTaskSysDefinition,
                version: newTaskSysDefinition.version + 1
              },
              ...updatedTask,
              assignment: { ...updatedTask.assignment, status },
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
}

export const openTask = changeTaskStatus(Status.OPEN, States.SEVERAL);
export const reopenTask = changeTaskStatus(Status.OPEN, States.SEVERAL);
export const resolveTask = changeTaskStatus(Status.RESOLVED, States.SEVERAL);
