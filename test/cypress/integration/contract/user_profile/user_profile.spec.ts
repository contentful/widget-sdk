import { getTokenForUser } from '../../../interactions/token';
import { getDefaultUserProfileData } from '../../../interactions/user_profile';

describe('User profile page', () => {
    before(() =>
        cy.startFakeServer({
            consumer: 'user_interface',
            provider: 'user_profile',
            cors: true,
            pactfileWriteMode: 'merge',
            dir: Cypress.env('pactDir'),
            spec: 2
        })
    );
    context('default user', () => {
        beforeEach(() => {

            cy.resetAllFakeServers();
            const interactions = [
                getTokenForUser.willReturnAValidToken(),
                getDefaultUserProfileData.willReturnIt()
            ];
            cy.server();
            cy.visit('/account/profile/user');
            cy.wait(interactions);
        });
        it('find id', () => {
            cy.getByTestId('user-account-data').should('be.visible');
        })
    });
});