import { getTokenForUser } from '../../../interactions/token';
import { getDefaultUserProfileData } from '../../../interactions/user_profile';

describe('User profile page', () => {
    before(() =>
        cy.startFakeServer({
            consumer: 'user_interface',
            provider: 'user_profile',
            cors: true,
            pactfileWriteMode: 'merge',
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
        it('see user account data', () => {
            cy.getByTestId('user-account-data').should('be.visible');
        });
        it('remove twitter identity', () => {
            cy.getByTestId('remove-twitter-button').should('be.visible').click();
            cy.getByTestId('dialog-remove-twitter-identity').should('be.visible');
            cy.getByTestId('confirm-remove-twitter-identity').should('be.visible').click();
            // check for successful interaction "/users/me/identities/3035"
        })
    });
});