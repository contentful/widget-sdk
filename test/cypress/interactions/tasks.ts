import * as state from '../util/interactionState';
import { getEntryCommentsAndTasks, postEntryCommentOrTask } from '../util/requests';
const empty = require('../fixtures/responses/empty.json');
const severalTasks = require('../fixtures/responses/tasks-several.json');

const provider = 'tasks';

export function successfulGetEntryTasksInteraction(state: string, body: Object) {
  return cy.addInteraction({
    provider,
    state,
    uponReceiving: 'a request for entry comments and tasks',
    withRequest: getEntryCommentsAndTasks(),
    willRespondWith: {
      status: 200,
      body
    }
  });
}

export function taskCreatedResponse(taskTitle) {
  const taskTemplate = severalTasks.items[0];
  const newTask = {
    ...taskTemplate,
    body: taskTitle
  };
  cy.addInteraction({
    provider,
    state: 'taskCreated',
    uponReceiving: 'a POST request for creating an entry tasks',
    withRequest: postEntryCommentOrTask(),
    willRespondWith: {
      status: 200,
      body: newTask
    }
  }).as(state.Tasks.CREATE);
}

export function tasksErrorResponse() {
  cy.addInteraction({
    provider,
    state: 'noTasksError',
    uponReceiving: 'a request for entry comments and tasks',
    withRequest: getEntryCommentsAndTasks(),
    willRespondWith: {
      status: 500,
      body: empty
    }
  }).as(state.Tasks.ERROR);
}
