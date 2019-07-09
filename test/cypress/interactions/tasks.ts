import * as state from '../util/interactionState';
import { defaultSpaceId, defaultEntryId, getEntryCommentsAndTasks, postEntryTask } from '../util/requests';
const empty = require('../fixtures/responses/empty.json');
const severalTasks = require('../fixtures/responses/tasks-several.json');

const provider = 'tasks';

const request = {
  GET_TASK_LIST: 'a request for entry comments and tasks',
  CREATE_TASK: 'a POST request for creating an entry tasks'
};

export function successfulGetEntryTasksInteraction(state: string, body: Object) {
  return cy.addInteraction({
    provider,
    state,
    uponReceiving: request.GET_TASK_LIST,
    withRequest: getEntryCommentsAndTasks(),
    willRespondWith: {
      status: 200,
      body
    }
  });
}

export function tasksErrorResponse() {
  cy.addInteraction({
    provider,
    state: 'serverIsDown',
    uponReceiving: request.GET_TASK_LIST,
    withRequest: getEntryCommentsAndTasks(),
    willRespondWith: {
      status: 500,
      body: empty
    }
  }).as(state.Tasks.INTERNAL_SERVER_ERROR);
}

export function taskCreateRequest({ title, assigneeId }) {
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
    withRequest: postEntryTask(defaultSpaceId, defaultEntryId, newTask),
  };
  return {
    successResponse() {
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
    errorResponse() {
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
