export class NavBar {
  goTo(tab: 'content-model') {
    switch (tab) {
      case 'content-model':
        cy.findByTestId('navbar-top').findByText('Content model').click();
        break;
      default:
        throw new Error(`Cant find tab ${tab} in navbar`);
    }
  }
}
