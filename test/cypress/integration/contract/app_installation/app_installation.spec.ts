import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId, entryIdWithApp } from '../../../util/requests';
import {
  queryForAppInstallations,
  queryForAppDefinitions,
  saveAppInstallation,
  deleteAppInstallation,
} from '../../../interactions/apps';
import {
  getAllContentTypesInDefaultSpace,
  getEditorInterfaceForDefaultContentType,
  getAllPublicContentTypesInDefaultSpace,
} from '../../../interactions/content_types';
import { queryForEditorInterfaces } from '../../../interactions/editor_interfaces';
import { getDefaultEntry } from '../../../interactions/entries';
import { queryFirst100UsersInDefaultSpace } from '../../../interactions/users';

describe('App Installation', () => {
  before(() =>
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['users', 'apps', 'content_types', 'editor_interfaces', 'entries'],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    })
  );

  describe('Marketplace', () => {
    let interactions: string[];
    beforeEach(() => {
      cy.resetAllFakeServers();

      interactions = [...defaultRequestsMock(), queryForAppDefinitions.willReturnNone()];
      queryForAppDefinitions.willReturnSeveralPublic();
    });

    context('No app installed', () => {
      beforeEach(() => {
        interactions.push(queryForAppInstallations.willReturnNone());

        cy.server();
        cy.route('**/channel/**', []).as('shareJS');
        cy.visit(`/spaces/${defaultSpaceId}/apps`);
        cy.wait(interactions);
      });

      describe('Loads marketplace and installs the Dropbox app', () => {
        it('should install', () => {
          const loadAppConfigurationScreenInteraction = [
            queryForAppInstallations.willReturnNoInstalledApp(),
            getAllContentTypesInDefaultSpace.willReturnOne(),
            queryForEditorInterfaces.willReturnSeveral(),
          ];

          const installInteractions = [saveAppInstallation.willSucceed()];

          cy.get('div').contains('Dropbox').click();
          cy.get('span').contains('Install').click();
          cy.get('button').contains('Authorize access').click();

          cy.wait(loadAppConfigurationScreenInteraction);
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(500); // wait for the loading animation to finish
          cy.get('span').contains('Install').click();
          cy.wait(installInteractions);
        });
      });
    });

    context('App already installed', () => {
      beforeEach(() => {
        interactions.push(queryForAppInstallations.willReturnSome());
        cy.server();
        cy.route('**/channel/**', []).as('shareJS');
        cy.visit(`/spaces/${defaultSpaceId}/apps`);
        cy.wait(interactions);
      });

      describe('Loads marketplace and uninstalls the Dropbox app', () => {
        it('should uninstall', () => {
          cy.findByTestId('installed-list').should('be.visible');
          cy.get('span').contains('Configure').click();

          const loadAppConfigurationScreenInteraction = [
            queryForAppInstallations.willReturnOneInstalledApp(),
            getAllContentTypesInDefaultSpace.willReturnOne(),
            queryForEditorInterfaces.willReturnSeveral(),
          ];
          cy.wait(loadAppConfigurationScreenInteraction);

          const deleteInteraction = deleteAppInstallation.willSucceed();
          cy.findAllByTestId('app-uninstall-button').should('contain', 'Uninstall');
          cy.findByTestId('app-uninstall-button').click();
          cy.findByTestId('uninstall-button').click();
          cy.wait(deleteInteraction);
        });
      });
    });
  });

  describe('Entries page', () => {
    let interactions: string[];
    beforeEach(() => {
      cy.resetAllFakeServers();
      interactions = [
        ...defaultRequestsMock({
          publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnSeveral,
        }),
        getDefaultEntry.willReturnEntryWithAppInstalled(),
        queryFirst100UsersInDefaultSpace.willFindSeveral(),
        queryForAppInstallations.willReturnSome(),
      ];
    });

    context('with app installed', () => {
      beforeEach(() => {
        interactions.push(
          getEditorInterfaceForDefaultContentType.willReturnEditorInterfaceWithAppInstalled()
        );

        cy.server();
        cy.route('**/channel/**', []).as('shareJS');

        cy.visit(`/spaces/${defaultSpaceId}/entries/${entryIdWithApp}`);

        cy.wait(interactions);
      });

      describe('Opening the Entry page', () => {
        it('shows the installed app instead of a JSON field', () => {
          //check for loaded app iframe
          cy.get('iframe[data-extension-id="6YdAwxoPHopeTeuwh43UJu"]').should('exist');
        });
      });
    });
  });
});
