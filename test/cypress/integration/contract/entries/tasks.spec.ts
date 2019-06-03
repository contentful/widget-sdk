import { defaultRequestsMock } from '../../../util/factories';
import { singleUser, singleSpecificOrgUserResponse } from '../../../interactions/users';
import { successfulGetEntryTasksInteraction } from '../../../interactions/tasks';

import {
  singleContentTypeResponse,
  editorInterfaceWithoutSidebarResponse
} from '../../../interactions/content_types';
import { singleEntryResponse, noEntrySnapshotsResponse } from '../../../interactions/entries';
import { microbackendStreamToken } from '../../../interactions/microbackend';
import * as state from '../../../util/interactionState';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';

const empty = require('../../../fixtures/responses/empty.json');
const severalTasks = require('../../../fixtures/responses/tasks-several.json');
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
  });

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

  describe('opening entry without tasks', () => {
    beforeEach(() => {
      successfulGetEntryTasksInteraction('noTasks', empty).as('tasks/empty');

      cy.wait([`@${state.Token.VALID}`, '@tasks/empty']);
    });

    it('renders "Tasks" sidebar section', () => {
      cy.getByTestId('sidebar-tasks-widget').should('be.visible');
    });
  });

  describe('opening entry with tasks', () => {
    beforeEach(() => {
      successfulGetEntryTasksInteraction('someTasks', severalTasks).as('tasks/several');
      singleSpecificOrgUserResponse();

      cy.wait([`@${state.Token.VALID}`, '@tasks/several', `@${state.Users.SINGLE}`]);
    });

    it('renders list of tasks', () => {
      cy.getAllByTestId('task').should('have.length', 3);
    });
  });

  // TODO: Test case for receiving a list of mixed tasks/comments after the backend
  //  has implemented `assignedTo` and we can distinguish the two.
});
