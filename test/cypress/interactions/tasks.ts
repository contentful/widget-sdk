import * as state from '../util/interactionState';
import { getEntryCommentsAndTasks } from '../util/requests';
const empty = require('../fixtures/responses/empty.json');

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
