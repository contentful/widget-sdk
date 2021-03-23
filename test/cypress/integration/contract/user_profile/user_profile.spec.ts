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

      cy.findByTestId('account-details-section-card').should('be.visible');
      cy.findByTestId('remove-twitter-button').should('be.visible').click();
      cy.findByTestId('dialog-remove-twitter-identity').should('be.visible');
      cy.findByTestId('confirm-remove-twitter-identity').should('be.visible').click();

      cy.wait(deleteIdentityInteraction);

      cy.findByTestId('account-details-section-card')
        .should('be.visible')
        .find('[data-test-id="remove-twitter-button"]')
        .should('not.exist');
    });

    it('setup 2FA with invalid code', () => {
      const get2FAInteraction = [getTwoFAData.willReturnIt()];
      const verify2FAInteraction = [verifyTwoFAData.willReturnFail()];
      cy.findByTestId('security-section-card').should('be.visible');
      cy.findByTestId('enable-2fa-cta').click();
      cy.wait(get2FAInteraction);

      cy.findByTestId('code-input').find('input').should('be.visible').clear().type('111111');
      cy.findByTestId('submit').should('be.visible').click();
      cy.wait(verify2FAInteraction);

      cy.findByTestId('cf-ui-validation-message').contains('The code you entered is not correct');
    });

    it('setup 2FA with valid code', () => {
      const get2FAInteraction = [getTwoFAData.willReturnIt()];
      const verify2FAInteraction = [verifyTwoFAData.willReturnSuccess()];
      cy.findByTestId('security-section-card').should('be.visible');
      cy.findByTestId('enable-2fa-cta').click();
      cy.wait(get2FAInteraction);

      cy.findByTestId('code-input').find('input').should('be.visible').clear().type('123456');
      cy.findByTestId('submit').should('be.visible').click();
      cy.wait(verify2FAInteraction);

      cy.findByTestId('security-section').contains('Enabled with authenticator app');
    });

    describe('update user profile data', () => {
      it('with correct password', () => {
        const updateUserProfileInteraction = [updateDefaultUserProfileData.willReturnSuccess()];

        cy.findByTestId('account-details-section-card').should('be.visible');
        cy.findByTestId('edit-user-account-details').should('be.visible').click();
        cy.findByTestId('edit-account-data-modal').should('be.visible');

        cy.findByTestId('first-name-field').find('input').clear().type('NewFirstName');
        cy.findByTestId('last-name-field').find('input').clear().type('NewLastName');
        cy.findByTestId('email-field').find('input').clear().type('new-email@example.com');
        cy.findByTestId('current-password-field')
          .should('be.visible')
          .find('input')
          .type('test12345');

        cy.findByTestId('confirm-account-data-changes').click();
        cy.wait(updateUserProfileInteraction);

        cy.findByTestId('user-full-name').contains('NewFirstName NewLastName');
        cy.findByTestId('user-email').contains('new-email@example.com');
      });
      it('with incorrect password', () => {
        const updateUserProfileInteraction = [updateDefaultUserProfileData.willReturnError()];

        cy.findByTestId('account-details-section-card').should('be.visible');
        cy.findByTestId('edit-user-account-details').should('be.visible').click();
        cy.findByTestId('edit-account-data-modal').should('be.visible');

        cy.findByTestId('first-name-field').find('input').clear().type('NewFirstName');
        cy.findByTestId('last-name-field').find('input').clear().type('NewLastName');
        cy.findByTestId('email-field').find('input').clear().type('new-email@example.com');
        cy.findByTestId('current-password-field')
          .should('be.visible')
          .find('input')
          .type('invalid-current-password');

        cy.findByTestId('confirm-account-data-changes').click();
        cy.wait(updateUserProfileInteraction);

        cy.findByTestId('current-password-field')
          .find('[data-test-id="cf-ui-validation-message"]')
          .should('be.visible');
      });
    });
    describe('update user profile password', () => {
      it('with valid new password', () => {
        const changePasswordInteraction = [changePassword.willReturnSuccess()];
        cy.findByTestId('account-details-section-card').should('be.visible');
        cy.findByTestId('link-change-password').should('be.visible').click();
        cy.findByTestId('change-password-modal').should('be.visible');

        cy.findByTestId('current-password').find('input').clear().type('test12345');
        cy.findByTestId('new-password').find('input').clear().type('new-password');
        cy.findByTestId('new-password-confirm').find('input').clear().type('new-password');

        cy.findByTestId('confirm-change-password').click();
        cy.wait(changePasswordInteraction);

        cy.findByTestId('account-details-section-card')
          .should('be.visible')
          .find('[data-test-id="change-password-modal"]')
          .should('not.exist');
      });

      it('with invalid new password', () => {
        const changePasswordInteraction = [changePassword.willReturnError()];
        cy.findByTestId('account-details-section-card').should('be.visible');
        cy.findByTestId('link-change-password').should('be.visible').click();
        cy.findByTestId('change-password-modal').should('be.visible');

        cy.findByTestId('current-password').find('input').clear().type('test12345');
        cy.findByTestId('new-password').find('input').clear().type('password');
        cy.findByTestId('new-password-confirm').find('input').clear().type('password');

        cy.findByTestId('confirm-change-password').click();
        cy.wait(changePasswordInteraction);

        cy.findByTestId('new-password')
          .find('[data-test-id="cf-ui-validation-message"]')
          .should('be.visible');
      });
    });

    it('delete user', () => {
      const deleteUserAccountInteraction = [deleteUserAccount.willReturnIt()];
      cy.findByTestId('delete-cta').click();
      cy.findByTestId('confirm-delete-account-button').click();
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
      cy.findByTestId('security-section-card').should('be.visible');
      cy.get('button[data-test-id=add-password-cta]').click();
      cy.findByTestId('change-password-modal').should('be.visible');
    });

    it('add valid password', () => {
      const addPasswordInteraction = [addPassword.willReturnSuccess()];
      cy.findByTestId('account-details-section-card').should('be.visible');
      cy.findByTestId('link-change-password').should('be.visible').click();
      cy.findByTestId('change-password-modal').should('be.visible');

      cy.findByTestId('new-password').find('input').clear().type('new-password');
      cy.findByTestId('new-password-confirm').find('input').clear().type('new-password');

      cy.findByTestId('confirm-change-password').click();
      cy.wait(addPasswordInteraction);

      cy.findByTestId('account-details-section-card')
        .should('be.visible')
        .find('[data-test-id="change-password-modal"]')
        .should('not.exist');
      cy.findByTestId('link-change-password').contains('Change password');
    });

    it('add invalid password', () => {
      const addPasswordInteraction = [addPassword.willReturnError()];
      cy.findByTestId('account-details-section-card').should('be.visible');
      cy.findByTestId('link-change-password').should('be.visible').click();
      cy.findByTestId('change-password-modal').should('be.visible');

      cy.findByTestId('new-password').find('input').clear().type('password');
      cy.findByTestId('new-password-confirm').find('input').clear().type('password');

      cy.findByTestId('confirm-change-password').click();
      cy.wait(addPasswordInteraction);

      cy.findByTestId('new-password')
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
      cy.findByTestId('security-section-card').should('exist');
      cy.findByTestId('delete-2fa-cta').click();
      cy.findByTestId('confirm-disable-2fa-button').click();
      cy.wait(interactions);
      cy.findByTestId('enable-2fa-cta').should('exist');
    });
  });
});
