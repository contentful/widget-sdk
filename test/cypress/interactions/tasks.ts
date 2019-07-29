import {
  defaultSpaceId,
  defaultEntryId,
  defaultTaskId,
  defaultHeader
} from '../util/requests';
import { RequestOptions } from '@pact-foundation/pact-web';
const empty = require('../fixtures/responses/empty.json');
const severalTasks = require('../fixtures/responses/tasks-several.json');

export enum States {
  NONE = 'comments/none',
  SEVERAL = 'comments/several',
  SEVERAL_ONE_OPEN = 'comments/several-one-open',
  SEVERAL_ONE_RESOLVED = 'comments/several-one-resolved',
  INTERNAL_SERVER_ERROR = 'comments/internal-server-error'
}

enum Status {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

const provider = 'tasks';

const GET_TASK_LIST = `a request to get all entry comments for entry "${defaultEntryId}"`

const getEntryCommentsAndTasksRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/comments`,
  headers: defaultHeader
};

export const getAllCommentsForDefaultEntry = {
  willReturnNone() {
    cy.addInteraction({
      provider,
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
      provider,
      state: States.SEVERAL,
      uponReceiving: GET_TASK_LIST,
      withRequest: getEntryCommentsAndTasksRequest,
      willRespondWith: {
        status: 200,
        body: severalTasks
      }
    }).as('getAllCommentsForDefaultEntry');

    return '@getAllCommentsForDefaultEntry';;
  },
  willFailWithAnInternalServerError() {
    cy.addInteraction({
      provider,
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
    provider,
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
      provider,
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

export const openTask = changeTaskStatus(Status.OPEN, States.SEVERAL_ONE_OPEN);
export const reopenTask = changeTaskStatus(Status.OPEN, States.SEVERAL_ONE_RESOLVED);
export const resolveTask = changeTaskStatus(Status.RESOLVED, States.SEVERAL_ONE_OPEN);
