import {
  defaultSpaceId,
  defaultEntryId,
  defaultTaskId,
  defaultHeader
} from '../util/requests';
import { RequestOptions } from '@pact-foundation/pact-web';
const empty = require('../fixtures/responses/empty.json');
import {
  default as severalTasks,
  definition as severalTasksRequestDefinition,
} from '../fixtures/responses/tasks-several.js';

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

const getEntryCommentsAndTasksRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/comments`,
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
        body: severalTasksRequestDefinition
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
        body: empty
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
    uponReceiving: `a request to assign a new task to user "${assigneeId}" for entry "${defaultEntryId}"`,
    withRequest: {
      method: 'POST',
      path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/comments`,
      headers: defaultHeader,
      body: newTask
    } as RequestOptions
  };
  return {
    willSucceed() {
      const newTaskSys = severalTasks.items[0].sys;
      cy.addInteraction({
        ...interactionRequestInfo,
        state: States.NONE,
        willRespondWith: {
          status: 200,
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
          body: empty
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
        path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/comments/${taskId}`,
        headers: defaultHeader,
        body: {
          ...updatedTask,
          assignment: { ...updatedTask.assignment, status }
        }
      } as RequestOptions
    };

    return {
      willSucceed() {
        const { sys: newTaskSys } = severalTasks.items.find((task: any) => {
          return task.sys.id === taskId;
        });
        cy.addInteraction({
          ...interactionRequestInfo,
          state: stateName,
          willRespondWith: {
            status: 200,
            body: {
              sys: newTaskSys,
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
            body: empty
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
