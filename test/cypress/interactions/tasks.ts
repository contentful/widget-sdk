import * as state from '../util/interactionState';
import { getEntryCommentsAndTasks, postEntryCommentOrTask } from '../util/requests';
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
  }).as(state.Tasks.ERROR);
}

export function taskCreatedResponse(taskTitle) {
  const taskTemplate = severalTasks.items[0];
  const newTask = {
    ...taskTemplate,
    body: taskTitle
  };
  cy.addInteraction({
    provider,
    state: 'noTasks',
    uponReceiving: request.CREATE_TASK,
    withRequest: postEntryCommentOrTask(),
    willRespondWith: {
      status: 200,
      body: newTask
    }
  }).as(state.Tasks.CREATE);
}

export function taskNotCreatedErrorResponse() {
  cy.addInteraction({
    provider,
    state: 'serverIsDown',
    uponReceiving: request.CREATE_TASK,
    withRequest: postEntryCommentOrTask(),
    willRespondWith: {
      status: 500,
      body: empty
    }
  }).as(state.Tasks.ERROR);
}
