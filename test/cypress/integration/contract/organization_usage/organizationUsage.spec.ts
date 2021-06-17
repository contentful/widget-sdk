import { defaultOrgId } from '../../../util/requests';
import { getPlans, getProductRatePlans, getBasePlan } from '../../../interactions/plans';
import {
  getUsagePeriods,
  getOrganizationPeriodicUsages,
  getSpacePeriodicUsages,
  getAllSpaces,
} from '../../../interactions/organization_usage';
import { getTokenForUser } from '../../../interactions/token';
import { getUsers } from '../../../interactions/users';
import { getOrgResources } from '../../../interactions/resources';

const loadPageWithServerState = (interactions: string[]) => {
  const basicInteractions = [
    getTokenForUser.willReturnAValidToken(),
    getUsagePeriods.willReturnDefault(),
    getOrganizationPeriodicUsages.willReturnDefault(),
    getSpacePeriodicUsages.willReturnCmaUsage(),
    getSpacePeriodicUsages.willReturnCdaUsage(),
    getSpacePeriodicUsages.willReturnGqlUsage(),
    getSpacePeriodicUsages.willReturnCpaUsage(),
  ];

  cy.visit(`/account/organizations/${defaultOrgId}/usage`);

  cy.wait([...basicInteractions, ...interactions]);
};

describe('Organization Usage page', () => {
  before(() => {
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['organization_usage', 'plans', 'resources'],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    });
  });

  beforeEach(() => {
    cy.resetAllFakeServers();
  });

  describe('the organization does not have spaces', () => {
    beforeEach(() => {
      const interactions = [
        getBasePlan.willReturnFree(),
        getPlans.willContainFree(),
        getAllSpaces.willReturnEmpty(),
        getOrgResources.willReturnSeveral(),
        getProductRatePlans.willReturnEmpty(),
      ];
      loadPageWithServerState(interactions);
    });
    it('renders a no space placeholder', () => {
      cy.findByTestId('usage-page__no-spaces-placeholder').should('be.visible');
    });
  });

  describe('the community tier organization', () => {
    beforeEach(() => {
      const interactions = [
        getBasePlan.willReturnFree(),
        getPlans.willContainFree(),
        getUsers.willReturnSingle(),
        getAllSpaces.willReturnDefault(),
        getOrgResources.willReturnSeveral(),
        getProductRatePlans.willReturnDefault(),
      ];
      loadPageWithServerState(interactions);
    });
    it('renders a table with two rows', () => {
      cy.findByTestId('api-usage-table').should('exist');
      cy.findAllByTestId('api-usage-table-row').should('have.length', 2);
      cy.findAllByTestId('api-usage-table-row').first().contains('My space').should('exist');
      cy.findAllByTestId('api-usage-table-row').last().contains('Deleted space').should('exist');
    });
    it('renders two bar charts', () => {
      cy.findByTestId('api-usage-bar-chart').should('exist');
      cy.findByTestId('organization-usage-bar-chart').should('exist');
    });
    it('renders a current usage period label', () => {
      cy.findByTestId('usage-period-text').should('exist');
      cy.findByTestId('usage-period-text').contains('(current)');
    });
    it('shows api request and bandwidth usage with overages', () => {
      cy.findAllByTestId('org-usage-total').should('be.visible');

      cy.findAllByTestId('organization-usage_asset-bandwidth-tab').click();

      cy.findAllByTestId('asset-bandwidth-usage').should('be.visible');
    });
  });

  describe('the enterprise tier organization', () => {
    beforeEach(() => {
      const interactions = [
        getBasePlan.willReturnEnterprise(),
        getPlans.willContainEnterprise(),
        getUsers.willReturnSingle(),
        getAllSpaces.willReturnDefault(),
        getOrgResources.willReturnWithUnlimitedAPIRequest(),
        getProductRatePlans.willReturnDefault(),
      ];
      loadPageWithServerState(interactions);
    });
    it('renders a period selector', () => {
      cy.findByTestId('period-selector').should('exist');
      cy.findByTestId('period-selector').find('option').should('have.length', 1);
    });
  });
});
