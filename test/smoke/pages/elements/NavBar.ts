type Tab = 'content-model' | 'settings';
type Item = 'environments';

export class NavBar {
  goToTab(tab: Tab) {
    switch (tab) {
      case 'content-model':
        cy.findByTestId('navbar-top').findByText('Content model').click();
        break;
      case 'settings':
        cy.findByTestId('navbar-top').findByText('Settings').click();
        break;
      default:
        throw new Error(`Can't find tab ${tab} in navbar`);
    }
  }

  goToItem(tab: Tab, item: Item) {
    this.goToTab(tab);
    switch (item) {
      case 'environments':
        cy.findByTestId('navbar-dropdown-menu').findByText('Environments').click();
        break;
      default:
        throw new Error(`Can't find item ${item} in navbar tab ${tab} dropdown`);
    }
  }
}
