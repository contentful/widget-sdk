import * as state from '../util/interactionState';
import {
  defaultSpaceId,
  defaultEntryId,
  defaultTaskId,
  defaultHeader
} from '../util/requests';
import { RequestOptions } from '@pact-foundation/pact-web';
const empty = require('../fixtures/responses/empty.json');
const severalTasks = require('../fixtures/responses/tasks-several.json');

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
    return cy.addInteraction({
      provider,
      state: state.Tasks.NONE,
      uponReceiving: request.GET_TASK_LIST,
      withRequest: getEntryCommentsAndTasksRequest,
      willRespondWith: {
        status: 200,
        body: empty
      }
    });
  },
  willReturnSeveral() {
    return cy.addInteraction({
      provider,
      state: state.Tasks.SEVERAL,
      uponReceiving: request.GET_TASK_LIST,
      withRequest: getEntryCommentsAndTasksRequest,
      willRespondWith: {
        status: 200,
        body: severalTasks
      }
    });
  },
  willFailWithAnInternalServerError() {
    return cy.addInteraction({
      provider,
      state: state.Tasks.INTERNAL_SERVER_ERROR,
      uponReceiving: request.GET_TASK_LIST,
      withRequest: getEntryCommentsAndTasksRequest,
      willRespondWith: {
        status: 500,
        body: empty
      }
    }).as(state.Tasks.INTERNAL_SERVER_ERROR);
  }
}

export function createTask({ title, assigneeId }) {
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
      return cy.addInteraction({
        ...interactionRequestInfo,
        state: state.Tasks.NONE,
        willRespondWith: {
          status: 200,
          body: {
            sys: newTaskSys,
            ...newTask,
          }
        }
      });
    },
    willFailWithAnInternalServerError() {
      return cy.addInteraction({
        ...interactionRequestInfo,
        state: state.Tasks.INTERNAL_SERVER_ERROR,
        willRespondWith: {
          status: 500,
          body: empty
        }
      });
    }
  }
}

function changeTaskStatus(status: Status) {
  return function ({ title, assigneeId, taskId = defaultTaskId }, stateName: state.Tasks) {
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
        return cy.addInteraction({
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
        });
      },
      willFailWithAnInternalServerError() {
        return cy.addInteraction({
          ...interactionRequestInfo,
          state: state.Tasks.INTERNAL_SERVER_ERROR,
          willRespondWith: {
            status: 500,
            body: empty
          }
        });
      }
    }
  }
}

export const openTask = changeTaskStatus(Status.OPEN);
export const resolveTask = changeTaskStatus(Status.RESOLVED);
