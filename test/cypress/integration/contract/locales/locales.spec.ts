import { defaultSpaceId } from '../../../util/requests';
import { defaultRequestsMock } from '../../../util/factories';
import { getLocaleResource, getResources } from '../../../interactions/resources';
import { getFeaturesWithCustomRoles } from '../../../interactions/features';
import {
  deleteLocaleForSpace,
  postLocaleForSpace,
  putLocaleForSpace,
  queryFirst100LocalesOfDefaultSpace,
} from '../../../interactions/locales';
import { getProductRatePlansWithSpace, getSpacePlan } from '../../../interactions/plans';

describe('Locales Management', () => {
  let interactions: string[];

  const LOCALES = {
    French: {
      name: 'French',
      code: 'fr',
      id: '2hLVK2lyr6js7J1PiMOI9q',
    },
  };

  beforeEach(() => {
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['users', 'resources', 'plans', 'features'],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    });
    cy.resetAllFakeServers();
  });

  describe('landing page with one locale', () => {
    beforeEach(() => {
      interactions = [
        ...defaultRequestsMock(),
        getLocaleResource.willReturnDefault(),
        getFeaturesWithCustomRoles.willReturnSeveral(),
        getProductRatePlansWithSpace.willReturnDefault(),
        getResources.willReturnSeveral(),
        getSpacePlan.willReturnDefault(),
      ];
      cy.visit(`/spaces/${defaultSpaceId}/settings/locales`);
      cy.wait(interactions, { timeout: 10000 });
    });

    it('with list of available locales', () => {
      cy.findByTestId('locale-list-workbench').should('be.visible');
    });

    it('add locale button should redirect to new locale page', () => {
      cy.findByTestId('add-locales-button').should('be.visible').click();
      cy.location().should((loc) => {
        expect(loc.pathname).to.eq(`/spaces/${defaultSpaceId}/settings/locales/new`);
      });
    });
  });
  describe('new locale page', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      interactions = [...defaultRequestsMock()];

      cy.visit(`/spaces/${defaultSpaceId}/settings/locales/new`);
      cy.wait(interactions, { timeout: 10000 });
    });

    it('add new Locale', () => {
      const creation = postLocaleForSpace.willCreate(
        LOCALES.French.code,
        LOCALES.French.name,
        LOCALES.French.id
      );
      cy.findByTestId('locale-code-select').should('be.visible');
      cy.findByTestId('locale-code-select').select(
        `${LOCALES.French.name} (${LOCALES.French.code})`
      );
      cy.findByTestId('save-locale').click();
      cy.wait(creation);
      cy.wait([getFeaturesWithCustomRoles.willReturnSeveral()], { timeout: 20000 });
      hasNotification('saved');
    });
  });

  describe('landing page with several locales', () => {
    beforeEach(() => {
      interactions = [
        ...defaultRequestsMock({
          localeResponse: queryFirst100LocalesOfDefaultSpace.willFindSeveral,
        }),
        getLocaleResource.willReturnDefault(),
        getFeaturesWithCustomRoles.willReturnSeveral(),
        getProductRatePlansWithSpace.willReturnDefault(),
        getResources.willReturnSeveral(),
        getSpacePlan.willReturnDefault(),
      ];
      cy.visit(`/spaces/${defaultSpaceId}/settings/locales`);
      cy.wait(interactions, { timeout: 10000 });
    });

    it('with list of available locales', () => {
      cy.findByTestId('locale-en-US').should('be.visible');
      cy.findByTestId('locale-fr').should('be.visible');
    });

    it('delete locale button should redirect to locale edit page', () => {
      cy.findByTestId('locale-fr').click();
      cy.location().should((loc) => {
        expect(loc.pathname).to.eq(
          `/spaces/${defaultSpaceId}/settings/locales/${LOCALES.French.id}`
        );
      });
    });

    it('delete locale', () => {
      const deletion = deleteLocaleForSpace.willDelete(LOCALES.French.id);
      cy.findByTestId('locale-fr').click();
      cy.findByTestId('delete-locale').click();
      cy.findByTestId('repeat-locale-input').focus().type(LOCALES.French.code);
      cy.findByTestId('delete-locale-confirm').click();
      cy.wait(deletion);
      hasNotification('deleted');
    });

    it('change locale button should redirect to locale edit page', () => {
      cy.findByTestId('locale-fr').click();
      cy.location().should((loc) => {
        expect(loc.pathname).to.eq(
          `/spaces/${defaultSpaceId}/settings/locales/${LOCALES.French.id}`
        );
      });
    });

    it('change locale', () => {
      const change = putLocaleForSpace.willChange('de', 'German', LOCALES.French.id);
      cy.findByTestId('locale-fr').click();
      cy.findByTestId('locale-code-select').select('German (de)');
      cy.findByTestId('save-locale').click();
      cy.findByTestId('repeat-locale-input').focus().type(LOCALES.French.code);
      cy.findByTestId('change-locale-confirm').click();
      cy.wait(change);
      hasNotification('saved');
    });
  });
});

function hasNotification(type: 'deleted' | 'saved') {
  cy.findByTestId('cf-ui-notification')
    .should('be.visible')
    .should('contain', `Locale ${type} successfully`);
}
