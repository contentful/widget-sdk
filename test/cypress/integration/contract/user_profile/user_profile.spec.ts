import { getTokenForUser } from '../../../interactions/token';
import {
  getUserProfileData,
  deleteIdentity,
  updateDefaultUserProfileData,
  addPassword,
  changePassword,
  deleteUserAccount,
  getTwoFAData,
  verifyTwoFAData,
  deleteTwoFA,
} from '../../../interactions/user_profile';
import { FeatureFlag } from '../../../util/featureFlag';

function waitForAppLoadFinish() {
  cy.get('cf-app-container').should('be.visible');
}

describe('User profile page', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'user_profile',
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 2,
    })
  );
  context('default user', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      cy.enableFeatureFlags([FeatureFlag.COOKIE_CONSENT_MANAGEMENT]);
      const interactions = [
        getTokenForUser.willReturnAValidToken(),
        getUserProfileData.willReturnDefault(),
      ];
      cy.server();
      cy.visit('/account/profile/user');
      cy.wait(interactions);

      waitForAppLoadFinish();
    });

    it('remove twitter identity', () => {
      const deleteIdentityInteraction = [deleteIdentity.willReturnIt()];

      cy.getByTestId('user-account-data').should('be.visible');
      cy.getByTestId('remove-twitter-button').should('be.visible').click();
      cy.getByTestId('dialog-remove-twitter-identity').should('be.visible');
      cy.getByTestId('confirm-remove-twitter-identity').should('be.visible').click();

      cy.wait(deleteIdentityInteraction);

      cy.getByTestId('user-account-data')
        .should('be.visible')
        .find('[data-test-id="remove-twitter-button"]')
        .should('not.exist');
    });

    it('setup 2FA with invalid code', () => {
      const get2FAInteraction = [getTwoFAData.willReturnIt()];
      const verify2FAInteraction = [verifyTwoFAData.willReturnFail()];
      cy.getByTestId('security-section-card').should('be.visible');
      cy.getByTestId('enable-2fa-cta').click();
      cy.wait(get2FAInteraction);

      cy.getByTestId('code-input').find('input').should('be.visible').clear().type('111111');
      cy.getByTestId('submit').should('be.visible').click();
      cy.wait(verify2FAInteraction);

      cy.getByTestId('cf-ui-validation-message').contains('The code you entered is not correct');
    });

    it('setup 2FA with valid code', () => {
      const get2FAInteraction = [getTwoFAData.willReturnIt()];
      const verify2FAInteraction = [verifyTwoFAData.willReturnSuccess()];
      cy.getByTestId('security-section-card').should('be.visible');
      cy.getByTestId('enable-2fa-cta').click();
      cy.wait(get2FAInteraction);

      cy.getByTestId('code-input').find('input').should('be.visible').clear().type('123456');
      cy.getByTestId('submit').should('be.visible').click();
      cy.wait(verify2FAInteraction);

      cy.getByTestId('security-section').contains('Enabled with authenticator app');
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
          .should('be.visible')
          .find('[data-test-id="change-password-modal"]')
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
    });
  });

  context('identity only logged in user', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      cy.enableFeatureFlags([FeatureFlag.COOKIE_CONSENT_MANAGEMENT]);

      const interactions = [
        getTokenForUser.willReturnAValidToken(),
        getUserProfileData.willReturnIdentityLoginUser(),
      ];

      cy.server();
      cy.visit('/account/profile/user');
      cy.wait(interactions);
      waitForAppLoadFinish();
    });

    it('check 2FA eligibility', () => {
      cy.getByTestId('security-section-card').should('be.visible');
      cy.getByTestId('add-password-cta').should('be.visible').click();
      cy.getByTestId('change-password-modal').should('be.visible');
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
        .should('be.visible')
        .find('[data-test-id="change-password-modal"]')
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

  context('user with 2FA enabled', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      cy.enableFeatureFlags([FeatureFlag.COOKIE_CONSENT_MANAGEMENT]);
      const interactions = [
        getTokenForUser.willReturnAValidToken(),
        getUserProfileData.willReturnUserWithTwoFA(),
      ];
      cy.server();
      cy.visit('/account/profile/user');
      cy.wait(interactions);
    });

    it('disable 2FA', () => {
      const interactions = [deleteTwoFA.willReturnSuccess()];
      cy.getByTestId('security-section-card').should('exist');
      cy.getByTestId('delete-2fa-cta').click();
      cy.getByTestId('confirm-disable-2fa-button').click();
      cy.wait(interactions);
      cy.getByTestId('enable-2fa-cta').should('exist');
    });
  });
});
