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
  NONE = 'tasks/none',
  SEVERAL = 'tasks/several',
  SEVERAL_ONE_OPEN = 'tasks/several-one-open',
  SEVERAL_ONE_RESOLVED = 'tasks/several-one-resolved',
  INTERNAL_SERVER_ERROR = 'tasks/internal-server-error'
}

enum Status {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

const provider = 'tasks';

const request = {
  GET_TASK_LIST: `a request to get all entry comments for entry "${defaultEntryId}"`,
  CREATE_TASK: `a request to create a new task for entry "${defaultEntryId}"`,
  UPDATE_TASK: 'a PUT request for updating an entry task'
};

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
      uponReceiving: request.GET_TASK_LIST,
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
      uponReceiving: request.GET_TASK_LIST,
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
      uponReceiving: request.GET_TASK_LIST,
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
    uponReceiving: request.CREATE_TASK,
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

function changeTaskStatus(status: Status, stateName: States) {
  return function ({ title, assigneeId, taskId = defaultTaskId }, ) {
    const alias = `changeTask-${taskId}-to-${status}`
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
      uponReceiving: request.UPDATE_TASK,
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
