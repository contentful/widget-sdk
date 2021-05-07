import { AbstractPage } from './AbstractPage';

export class SpaceHomePage extends AbstractPage {
  constructor() {
    try {
      cy.findByTestId('admin-space-home', { timeout: 20000 });
    } catch {
      throw new Error(
        'admin-space-home element did not appear within 20 seconds of SpaceHomePage instantiation'
      );
    }
  }

  get container() {
    return cy.findByTestId('admin-space-home');
  }
}
