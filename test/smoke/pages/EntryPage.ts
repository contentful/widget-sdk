import { AbstractPage } from './AbstractPage';
import { EnvironmentSettingsPage } from './EnvironmentSettingsPage';

export class EntryPage extends AbstractPage {
  goToEnvironmentSettings() {
    this.navBar.goToItem('settings', 'environments');
    return new EnvironmentSettingsPage();
  }

  get container() {
    return cy.findByTestId('entry-view', { timeout: 20000 });
  }
}
