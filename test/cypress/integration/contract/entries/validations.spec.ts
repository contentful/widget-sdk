import { defaultRequestsMock } from '../../../util/factories';
import {
  getAllPublicContentTypesInDefaultSpace,
  getEditorInterfaceForDefaultContentType,
} from '../../../interactions/content_types';
import { getEntryWithInaccessibleFieldLocale } from '../../../interactions/entries';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';
import { queryFirst100LocalesOfDefaultSpace } from '../../../interactions/locales';

describe.skip('Entry validations', () => {
  let interactions: string[];

  beforeEach(() => {
    cy.resetAllFakeServers();
    interactions = basicServerSetUp();
  });

  context('opening the default entry', () => {
    beforeEach(() => {
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(interactions, { timeout: 10000 });
    });

    describe('when there is a validation in a dead field locale', () => {
      it('shows the field locale', () => {
        cy.findAllByTestId('single-line-editor').should('have.length', 1);
        cy.findByText('Invalid field value from cypress').should('not.exist');
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(5000);
        cy.findByTestId('change-state-published').click();
        cy.findAllByTestId('single-line-editor').should('have.length', 2);
        cy.findByText('Invalid field value from cypress').should('exist');
        // TODO: Ideally we should be testing to make sure the French locale
        // is editable but Cypress isn't configured to work without ShareJS yet.
      });
    });
  });
});

function basicServerSetUp(): string[] {
  cy.resetAllFakeServers();
  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['entries', 'users'],
    cors: true,
    pactfileWriteMode: 'merge',
    dir: Cypress.env('pactDir'),
    spec: 2,
  });

  cy.server();
  cy.route('**/channel/**', []).as('shareJS');

  return [
    ...defaultRequestsMock({
      publicContentTypesResponse:
        getAllPublicContentTypesInDefaultSpace.willReturnOneWithValidation,
      localeResponse: queryFirst100LocalesOfDefaultSpace.willFindSeveral,
    }),
    getEntryWithInaccessibleFieldLocale.willReturnIt(),
    getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
  ];
}
