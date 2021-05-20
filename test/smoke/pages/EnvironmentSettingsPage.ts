import { AbstractPage } from './AbstractPage';
import { EntryPage } from './EntryPage';

export class EnvironmentSettingsPage extends AbstractPage {
  static visit(spaceName: string) {
    const page = new EnvironmentSettingsPage();
    page.sidePanel.goToSpace(spaceName);
    page.goToEnvironmentSettings();

    return page;
  }

  goToEnvironmentSettings() {
    this.navBar.goToItem('settings', 'environments');
  }

  openAddEnvironmentModal() {
    cy.findByText('Add environment').click();
    return new AddEnvironmentModal();
  }

  environmentsTable() {
    cy.findByTestId('environment-table');
  }

  getEnvironmentsTableRow(envId: string) {
    return new EnvironmentsTableRow(envId);
  }

  goToEnvironment(spaceName: string, envId: string) {
    this.sidePanel.goToEnvironment(spaceName, envId);
    return new EntryPage();
  }
}

class AddEnvironmentModal {
  get environmentIdInput() {
    return cy.findByTestId('field.id');
  }

  submit() {
    cy.findByTestId('submit').click();
  }
}

class DeleteEnvironmentModal {
  get deleteEnvironmentInput() {
    return cy.findByTestId('confirmId');
  }

  confirm() {
    cy.findByTestId('delete').click();
  }
}

class EnvironmentsTableRow {
  constructor(private envId: string) {}

  get row() {
    return cy.findByTestId(`environment.${this.envId}`);
  }

  get status() {
    return this.row.findByTestId('view.status', { timeout: 10000 });
  }

  openDeleteEnvironmentModal() {
    this.row.findByTestId('openDeleteDialog').click();
    return new DeleteEnvironmentModal();
  }
}
