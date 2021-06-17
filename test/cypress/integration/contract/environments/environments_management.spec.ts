import { defaultSpaceId } from '../../../util/requests';
import { defaultRequestsMock } from '../../../util/factories';
import { getSpaceResources } from '../../../interactions/resources';
import {
  deleteEnvironmentInDefaultSpace,
  putEnvironmentInDefaultSpace,
  queryFirst101EnvironmentsInDefaultSpace,
} from '../../../interactions/environments';

describe('Environments Management', () => {
  let interactions: string[];

  beforeEach(() => {
    cy.enableFeatureFlags(['basic_apps']);
  });

  describe('landing page with one environment (master)', () => {
    beforeEach(() => {
      interactions = basicServerSetUp({
        environmentResponse: queryFirst101EnvironmentsInDefaultSpace.willFindOne,
      });
      cy.visit(`/spaces/${defaultSpaceId}/settings/environments`);
      cy.wait(interactions, { timeout: 10000 });
    });

    it('list a master environment with state "Ready"', () => {
      cy.findByTestId('environmentList').should('be.visible');
      cy.findByTestId('environment-table').should('be.visible');
      cy.findByTestId('environment.master').should('be.visible');
      cy.findByTestId('view.status').should('be.visible').and('have.text', 'Ready');
    });

    it('open create modal and cancel', () => {
      cy.findByTestId('openCreateDialog').click();
      cy.findByTestId('spaceEnvironmentsEditDialog').should('be.visible');
      cy.findByTestId('spaceEnvironmentsEditDialog').findByTestId('cancel').click();
      cy.findByTestId('spaceEnvironmentsEditDialog').should('not.be.visible');
    });

    it('open create modal environment and submit', () => {
      const creation = putEnvironmentInDefaultSpace.willCreate('123');
      cy.findByTestId('openCreateDialog').click();
      cy.findByTestId('spaceEnvironmentsEditDialog').should('be.visible');
      cy.findByTestId('field.id').should('be.visible');
      cy.findByTestId('field.id').focus().type('123');
      cy.findByTestId('spaceEnvironmentsEditDialog').findByTestId('submit').click();
      cy.wait(creation);
      cy.findByTestId('spaceEnvironmentsEditDialog').should('not.be.visible');
    });
  });

  describe('landing page with two environments (master, 123)', () => {
    beforeEach(() => {
      interactions = basicServerSetUp({
        environmentResponse: queryFirst101EnvironmentsInDefaultSpace.willFindTwo,
      });
      cy.visit(`/spaces/${defaultSpaceId}/settings/environments`);
      cy.wait(interactions, { timeout: 10000 });
    });

    it('list multiple environments with state', () => {
      cy.findAllByTestId('environment.master').should('be.visible');
      cy.findAllByTestId('environment.123').should('be.visible');
      cy.findAllByTestId('view.status').should('have.length', 2);
    });

    it('with not deletable master environment in list', () => {
      cy.findByTestId('environment.master').findByTestId('openDeleteDialog').should('be.visible');
      cy.findByTestId('environment.master').findByTestId('openDeleteDialog').should('be.disabled');
    });

    it('with deletable 123 environment in list', () => {
      cy.findByTestId('environment.123').findByTestId('openDeleteDialog').should('be.visible');
      cy.findByTestId('environment.123').findByTestId('openDeleteDialog').should('not.be.disabled');
    });

    it('open delete modal and delete environment 123', () => {
      const deletion = deleteEnvironmentInDefaultSpace.willDelete('123');

      cy.findByTestId('environment.123').findByTestId('openDeleteDialog').click();
      cy.findByTestId('spaceEnvironmentsDeleteDialog').should('be.visible');
      cy.findByTestId('delete').should('be.disabled');
      cy.findByTestId('confirmId').should('be.visible');
      cy.findByTestId('confirmId').focus().type('123');
      cy.findByTestId('delete').should('not.be.disabled');
      cy.findByTestId('delete').click();
      cy.wait(deletion);
      cy.findByTestId('spaceEnvironmentsDeleteDialog').should('not.be.visible');
    });
  });
});

function basicServerSetUp(customHandlers: {}): string[] {
  cy.resetAllFakeServers();
  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['users', 'resources'],
    cors: true,
    pactfileWriteMode: 'merge',
    dir: Cypress.env('pactDir'),
    spec: 2,
  });

  cy.server();

  return [...defaultRequestsMock(customHandlers), getSpaceResources.willReturnSeveral()];
}
