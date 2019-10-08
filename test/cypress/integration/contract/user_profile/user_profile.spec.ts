import { getTokenForUser } from '../../../interactions/token';
import { getUserProfileData, deleteIdentity, updateDefaultUserProfileData, addPassword, changePassword, deleteUserAccount } from '../../../interactions/user_profile';

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
                getUserProfileData.willReturnDefault()
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

        describe('update user profile data', () => {
            it('with correct password', () => {
                const updateUserProfileInteraction = [updateDefaultUserProfileData.willReturnSuccess()];

                cy.getByTestId('user-account-data').should('be.visible');
                cy.getByTestId('edit-user-account-details').should('be.visible').click();
                cy.getByTestId('edit-account-data-modal').should('be.visible');

                cy.getByTestId('first-name-field').find('input').clear().type('NewFirstName');
                cy.getByTestId('last-name-field').find('input').clear().type('NewLastName');
                cy.getByTestId('email-field').find('input').clear().type('new-email@example.com');
                cy.getByTestId('current-password-field')
                    .should('be.visible')
                    .find('input')
                    .type('test12345');

                cy.getByTestId('confirm-account-data-changes').click();
                cy.wait(updateUserProfileInteraction);

                cy.getByTestId('user-full-name').contains('NewFirstName NewLastName');
                cy.getByTestId('user-email').contains('new-email@example.com');
            });
            it('with incorrect password', () => {
                const updateUserProfileInteraction = [updateDefaultUserProfileData.willReturnError()];

                cy.getByTestId('user-account-data').should('be.visible');
                cy.getByTestId('edit-user-account-details').should('be.visible').click();
                cy.getByTestId('edit-account-data-modal').should('be.visible');

                cy.getByTestId('first-name-field').find('input').clear().type('NewFirstName');
                cy.getByTestId('last-name-field').find('input').clear().type('NewLastName');
                cy.getByTestId('email-field').find('input').clear().type('new-email@example.com');
                cy.getByTestId('current-password-field')
                    .should('be.visible')
                    .find('input')
                    .type('invalid-current-password');

                cy.getByTestId('confirm-account-data-changes').click();
                cy.wait(updateUserProfileInteraction);

                cy.getByTestId('current-password-field')
                    .find('[data-test-id="cf-ui-validation-message"]')
                    .should('be.visible');
            });
        });
        describe('update user profile password', () => {
            it('with valid new password', () => {
                const changePasswordInteraction = [changePassword.willReturnSuccess()];
                cy.getByTestId('user-account-data').should('be.visible');
                cy.getByTestId('link-change-password').should('be.visible').click();
                cy.getByTestId('change-password-modal').should('be.visible');

                cy.getByTestId('current-password').find('input').clear().type('test12345');
                cy.getByTestId('new-password').find('input').clear().type('new-password');
                cy.getByTestId('new-password-confirm').find('input').clear().type('new-password');

                cy.getByTestId('confirm-change-password').click();
                cy.wait(changePasswordInteraction);

                cy.getByTestId('user-account-data')
                    .should('be.visible').
                    find('[data-test-id="change-password-modal"]')
                    .should('not.exist');
            });

            it('with invalid new password', () => {
                const changePasswordInteraction = [changePassword.willReturnError()];
                cy.getByTestId('user-account-data').should('be.visible');
                cy.getByTestId('link-change-password').should('be.visible').click();
                cy.getByTestId('change-password-modal').should('be.visible');

                cy.getByTestId('current-password').find('input').clear().type('test12345');
                cy.getByTestId('new-password').find('input').clear().type('password');
                cy.getByTestId('new-password-confirm').find('input').clear().type('password');

                cy.getByTestId('confirm-change-password').click();
                cy.wait(changePasswordInteraction);

                cy.getByTestId('new-password')
                    .find('[data-test-id="cf-ui-validation-message"]')
                    .should('be.visible');
            });
        });

        it('delete user', () => {
            const deleteUserAccountInteraction = [deleteUserAccount.willReturnIt()];
            cy.getByTestId('delete-cta').click();
            cy.getByTestId('confirm-delete-account-button').click();
            cy.wait(deleteUserAccountInteraction);
            cy.url().should('include', '/goodbye');
        })
    });
    context('identity only logged in user', () => {
        beforeEach(() => {

            cy.resetAllFakeServers();
            const interactions = [
                getTokenForUser.willReturnAValidToken(),
                getUserProfileData.willReturnIdentityLoginUser()
            ];
            cy.server();
            cy.visit('/account/profile/user');
            cy.wait(interactions);
        });

        it('add valid password', () => {
            const addPasswordInteraction = [addPassword.willReturnSuccess()];
            cy.getByTestId('user-account-data').should('be.visible');
            cy.getByTestId('link-change-password').should('be.visible').click();
            cy.getByTestId('change-password-modal').should('be.visible');

            cy.getByTestId('new-password').find('input').clear().type('new-password');
            cy.getByTestId('new-password-confirm').find('input').clear().type('new-password');

            cy.getByTestId('confirm-change-password').click();
            cy.wait(addPasswordInteraction);

            cy.getByTestId('user-account-data')
                .should('be.visible').
                find('[data-test-id="change-password-modal"]')
                .should('not.exist');
            cy.getByTestId('link-change-password').contains('Change password');
        });

        it('add invalid password', () => {
            const addPasswordInteraction = [addPassword.willReturnError()];
            cy.getByTestId('user-account-data').should('be.visible');
            cy.getByTestId('link-change-password').should('be.visible').click();
            cy.getByTestId('change-password-modal').should('be.visible');

            cy.getByTestId('new-password').find('input').clear().type('password');
            cy.getByTestId('new-password-confirm').find('input').clear().type('password');

            cy.getByTestId('confirm-change-password').click();
            cy.wait(addPasswordInteraction);

            cy.getByTestId('new-password')
                .find('[data-test-id="cf-ui-validation-message"]')
                .should('be.visible');
        });
    });
});
