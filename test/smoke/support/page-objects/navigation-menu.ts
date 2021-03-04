export const navigationMenu = {
  openUserProfile: () => {
    cy.findByTestId('account-menu-trigger').click();
    cy.findByTestId('nav.account.userProfile').click();
  },
};
