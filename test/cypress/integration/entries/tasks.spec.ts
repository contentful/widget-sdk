import { defaultRequestsMock } from '../../util/factories';
import { singleUser, singleSpecificOrgUserResponse } from '../../interactions/users';

import {
  singleContentTypeResponse,
  editorInterfaceWithoutSidebarResponse
} from '../../interactions/content_types';
import {
  singleEntryResponse,
  noEntrySnapshotsResponse
} from '../../interactions/entries';
import { microbackendStreamToken } from '../../interactions/microbackend';
import * as state from '../../util/interactionState';
import { defaultEntryId, defaultSpaceId, getEntryComments } from '../../util/requests';

const empty = require('../../fixtures/empty.json');
const severalTasks = require('../../fixtures/tasks-several.json');
const featureFlag = 'feature-05-2019-content-workflows-tasks';

describe('Tasks (based on `comments` endpoint)', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'tasks',
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 3
    });

    cy.setAuthTokenToLocalStorage();
    window.localStorage.setItem('ui_enable_flags', JSON.stringify([featureFlag]));
    basicServerSetUpWithEntry();
    cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
  }
  );

  function basicServerSetUpWithEntry() {
    defaultRequestsMock({
      publicContentTypesResponse: singleContentTypeResponse
    });
    singleUser();
    singleEntryResponse();
    noEntrySnapshotsResponse();
    editorInterfaceWithoutSidebarResponse();
    microbackendStreamToken();

    cy.route('**/channel/**', []).as('shareJS');
  }

  function addTaskListInteraction(state: string, body: Object) {
    return cy.addInteraction({
      provider: 'tasks',
      state,
      uponReceiving: 'a request for entry comments',
      withRequest: getEntryComments(),
      willRespondWith: {
        status: 200,
        body
      }
    });
  }

  describe('opening entry without tasks', () => {
    beforeEach(() => {
      addTaskListInteraction('noTasks', empty).as('tasks/empty');

      cy.wait([
        `@${state.Token.VALID}`,
        '@tasks/empty'
      ]);
    });

    it('renders "Tasks" sidebar section', () => {
      cy.getByTestId('sidebar-tasks-widget').should('be.visible');
    });
  });

  describe('opening entry with tasks', () => {
    beforeEach(() => {
      addTaskListInteraction('someTasks', severalTasks).as('tasks/several');
      singleSpecificOrgUserResponse();

      cy.wait([
        `@${state.Token.VALID}`,
        '@tasks/several',
        `@${state.Users.SINGLE}`
      ]);
    });

    it('renders list of tasks', () => {
      cy.getAllByTestId('task').should('have.length', 3);
    });
  });

  // TODO: Test case for receiving a list of mixed tasks/comments after the backend
  //  has implemented `assignedTo` and we can distinguish the two.
});
