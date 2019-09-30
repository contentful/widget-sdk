import { getTokenForUser } from '../../../interactions/token';
import { getDefaultUserProfileData, deleteIdentity, updateDefaultUserProfileData, changePassword } from '../../../interactions/user_profile';

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

        it('remove twitter identity', () => {
            const deleteIdentityInteraction = [deleteIdentity.willReturnIt()];

            cy.getByTestId('user-account-data').should('be.visible');
            cy.getByTestId('remove-twitter-button').should('be.visible').click();
            cy.getByTestId('dialog-remove-twitter-identity').should('be.visible');
            cy.getByTestId('confirm-remove-twitter-identity').should('be.visible').click();

            cy.wait(deleteIdentityInteraction);

            cy.getByTestId('user-account-data')
                .should('be.visible').
                find('[data-test-id="remove-twitter-button"]')
                .should('not.exist');
        });

        it('update user profile data', () => {
            const updateUserProfileInteraction = [updateDefaultUserProfileData.willReturnIt()];

            cy.getByTestId('user-account-data').should('be.visible');
            cy.getByTestId('edit-user-account-details').should('be.visible').click();
            cy.getByTestId('edit-account-data-modal').should('be.visible');

            cy.getByTestId('first-name-field').find('input').clear().type('NewFirstName');
            cy.getByTestId('last-name-field').find('input').clear().type('NewLastName');
            cy.getByTestId('email-field').find('input').clear().type('new-email@example.com');
            cy.getByTestId('current-password-field')
                .should('be.visible')
                .find('input')
                .type('newPassword');

            cy.getByTestId('confirm-account-data-changes').click();
            cy.wait(updateUserProfileInteraction);

            cy.getByTestId('user-full-name').contains('NewFirstName NewLastName');
            cy.getByTestId('user-email').contains('new-email@example.com');
        });

        it('update user profile password', () => {
            const changePasswordInteraction = [changePassword.willReturnIt()];
            cy.getByTestId('user-account-data').should('be.visible');
            cy.getByTestId('link-change-password').should('be.visible').click();
            cy.getByTestId('change-password-modal').should('be.visible');

            cy.getByTestId('current-password').find('input').clear().type('currentPassword');
            cy.getByTestId('new-password').find('input').clear().type('newPassword');
            cy.getByTestId('new-password-confirm').find('input').clear().type('newPassword');

            cy.getByTestId('confirm-change-password').click();
            cy.wait(changePasswordInteraction);
        })
    });
});