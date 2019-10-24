import { getTokenForUser } from '../../../interactions/token';
import {
    getUserProfileData,
    deleteIdentity,
    updateDefaultUserProfileData,
    addPassword,
    changePassword,
    deleteUserAccount,
    getTwoFAData,
    verifyTwoFAData
} from '../../../interactions/user_profile';
import { FeatureFlag } from '../../../util/featureFlag';

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
            cy.enableFeatureFlags([FeatureFlag.TWO_FA]);
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

            cy.getByTestId('user-account-data').should('exist');
            cy.getByTestId('remove-twitter-button').should('exist').click();
            cy.getByTestId('dialog-remove-twitter-identity').should('exist');
            cy.getByTestId('confirm-remove-twitter-identity').should('exist').click();

            cy.wait(deleteIdentityInteraction);

            cy.getByTestId('user-account-data')
                .should('exist').
                find('[data-test-id="remove-twitter-button"]')
                .should('not.exist');
        });

        it('setup 2FA with invalid code', () => {
            const get2FAInteraction = [getTwoFAData.willReturnIt()];
            const verify2FAInteraction = [verifyTwoFAData.willReturnFail()];
            cy.getByTestId('security-section-card').should('exist');
            cy.getByTestId('enable-2fa-cta').click();
            cy.wait(get2FAInteraction);

            cy.getByTestId('code-input').find('input').should('exist').clear().type('111111');
            cy.getByTestId('submit').should('exist').click();
            cy.wait(verify2FAInteraction);

            cy.getByTestId('cf-ui-validation-message').contains('The code you entered is not correct');
        });

        it('setup 2FA with valid code', () => {
            const get2FAInteraction = [getTwoFAData.willReturnIt()];
            const verify2FAInteraction = [verifyTwoFAData.willReturnSuccess()];
            cy.getByTestId('security-section-card').should('exist');
            cy.getByTestId('enable-2fa-cta').click();
            cy.wait(get2FAInteraction);

            cy.getByTestId('code-input').find('input').should('exist').clear().type('123456');
            cy.getByTestId('submit').should('exist').click();
            cy.wait(verify2FAInteraction);

            cy.getByTestId('security-section').contains('Enabled with authenticator app');
        });

        describe('update user profile data', () => {
            it('with correct password', () => {
                const updateUserProfileInteraction = [updateDefaultUserProfileData.willReturnSuccess()];

                cy.getByTestId('user-account-data').should('exist');
                cy.getByTestId('edit-user-account-details').should('exist').click();
                cy.getByTestId('edit-account-data-modal').should('exist');

                cy.getByTestId('first-name-field').find('input').clear().type('NewFirstName');
                cy.getByTestId('last-name-field').find('input').clear().type('NewLastName');
                cy.getByTestId('email-field').find('input').clear().type('new-email@example.com');
                cy.getByTestId('current-password-field')
                    .should('exist')
                    .find('input')
                    .type('test12345');

                cy.getByTestId('confirm-account-data-changes').click();
                cy.wait(updateUserProfileInteraction);

                cy.getByTestId('user-full-name').contains('NewFirstName NewLastName');
                cy.getByTestId('user-email').contains('new-email@example.com');
            });
            it('with incorrect password', () => {
                const updateUserProfileInteraction = [updateDefaultUserProfileData.willReturnError()];

                cy.getByTestId('user-account-data').should('exist');
                cy.getByTestId('edit-user-account-details').should('exist').click();
                cy.getByTestId('edit-account-data-modal').should('exist');

                cy.getByTestId('first-name-field').find('input').clear().type('NewFirstName');
                cy.getByTestId('last-name-field').find('input').clear().type('NewLastName');
                cy.getByTestId('email-field').find('input').clear().type('new-email@example.com');
                cy.getByTestId('current-password-field')
                    .should('exist')
                    .find('input')
                    .type('invalid-current-password');

                cy.getByTestId('confirm-account-data-changes').click();
                cy.wait(updateUserProfileInteraction);

                cy.getByTestId('current-password-field')
                    .find('[data-test-id="cf-ui-validation-message"]')
                    .should('exist');
            });
        });
        describe('update user profile password', () => {
            it('with valid new password', () => {
                const changePasswordInteraction = [changePassword.willReturnSuccess()];
                cy.getByTestId('user-account-data').should('exist');
                cy.getByTestId('link-change-password').should('exist').click();
                cy.getByTestId('change-password-modal').should('exist');

                cy.getByTestId('current-password').find('input').clear().type('test12345');
                cy.getByTestId('new-password').find('input').clear().type('new-password');
                cy.getByTestId('new-password-confirm').find('input').clear().type('new-password');

                cy.getByTestId('confirm-change-password').click();
                cy.wait(changePasswordInteraction);

                cy.getByTestId('user-account-data')
                    .should('exist').
                    find('[data-test-id="change-password-modal"]')
                    .should('not.exist');
            });

            it('with invalid new password', () => {
                const changePasswordInteraction = [changePassword.willReturnError()];
                cy.getByTestId('user-account-data').should('exist');
                cy.getByTestId('link-change-password').should('exist').click();
                cy.getByTestId('change-password-modal').should('exist');

                cy.getByTestId('current-password').find('input').clear().type('test12345');
                cy.getByTestId('new-password').find('input').clear().type('password');
                cy.getByTestId('new-password-confirm').find('input').clear().type('password');

                cy.getByTestId('confirm-change-password').click();
                cy.wait(changePasswordInteraction);

                cy.getByTestId('new-password')
                    .find('[data-test-id="cf-ui-validation-message"]')
                    .should('exist');
            });
        });

        it('delete user', () => {
            const deleteUserAccountInteraction = [deleteUserAccount.willReturnIt()];
            cy.getByTestId('delete-cta').click();
            cy.getByTestId('confirm-delete-account-button').click();
            cy.wait(deleteUserAccountInteraction);
            cy.url().should('include', '/goodbye');
        });
    });

    context('identity only logged in user', () => {
        beforeEach(() => {
            cy.resetAllFakeServers();
            cy.enableFeatureFlags([FeatureFlag.TWO_FA]);
            const interactions = [
                getTokenForUser.willReturnAValidToken(),
                getUserProfileData.willReturnIdentityLoginUser()
            ];
            cy.server();
            cy.visit('/account/profile/user');
            cy.wait(interactions);
        });

        it('check 2FA eligibility', () => {
            cy.getByTestId('security-section-card').should('exist');
            cy.getByTestId('add-password-cta').should('exist').click();
            cy.getByTestId('change-password-modal').should('exist');
        });

        it('add valid password', () => {
            const addPasswordInteraction = [addPassword.willReturnSuccess()];
            cy.getByTestId('user-account-data').should('exist');
            cy.getByTestId('link-change-password').should('exist').click();
            cy.getByTestId('change-password-modal').should('exist');

            cy.getByTestId('new-password').find('input').clear().type('new-password');
            cy.getByTestId('new-password-confirm').find('input').clear().type('new-password');

            cy.getByTestId('confirm-change-password').click();
            cy.wait(addPasswordInteraction);

            cy.getByTestId('user-account-data')
                .should('exist').
                find('[data-test-id="change-password-modal"]')
                .should('not.exist');
            cy.getByTestId('link-change-password').contains('Change password');
        });

        it('add invalid password', () => {
            const addPasswordInteraction = [addPassword.willReturnError()];
            cy.getByTestId('user-account-data').should('exist');
            cy.getByTestId('link-change-password').should('exist').click();
            cy.getByTestId('change-password-modal').should('exist');

            cy.getByTestId('new-password').find('input').clear().type('password');
            cy.getByTestId('new-password-confirm').find('input').clear().type('password');

            cy.getByTestId('confirm-change-password').click();
            cy.wait(addPasswordInteraction);

            cy.getByTestId('new-password')
                .find('[data-test-id="cf-ui-validation-message"]')
                .should('exist');
        });
    });
});
