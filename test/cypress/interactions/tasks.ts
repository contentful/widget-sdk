import { getEntryCommentsAndTasks } from '../util/requests';

export function successfulGetEntryTasksInteraction(state: string, body: Object) {
  return cy.addInteraction({
    provider: 'tasks',
    state,
    uponReceiving: 'a request for entry comments and tasks',
    withRequest: getEntryCommentsAndTasks(),
    willRespondWith: {
      status: 200,
      body
    }
  });
}
