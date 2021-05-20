import { EnvironmentSettingsPage, EntryPage } from './pages';
import { wrapWithDuration } from './telemetry';
import { id as randomId } from '../../src/javascripts/utils/Random';

test('environment-switching', () => {
  const spaceName = 'Test: Environment switching';
  const envId = randomId();

  cy.login();

  let envSettings = EnvironmentSettingsPage.visit(spaceName);

  const addEnvironmentModal = envSettings.openAddEnvironmentModal();
  const addEnvironmentInput = addEnvironmentModal.environmentIdInput;
  addEnvironmentInput.type(envId);
  addEnvironmentModal.submit();

  const newEnvRow = envSettings.getEnvironmentsTableRow(envId);
  newEnvRow.row.should('be.visible');

  cy.reload();

  const entryPage = wrapWithDuration<EntryPage>(
    'time-environment-ready-after-switching-environment',
    () => {
      const entryPage = envSettings.goToEnvironment(spaceName, envId);
      entryPage.container.should('be.visible');
      return entryPage;
    }
  );

  entryPage.sidePanel.environmentInfo.should('have.attr', 'title', envId);
  cy.url().should('include', `/environments/${envId}`);
  cy.url().should('include', '/entries');

  envSettings = entryPage.goToEnvironmentSettings();

  const deleteEnvironmentModal = newEnvRow.openDeleteEnvironmentModal();
  const deleteEnvironmentInput = deleteEnvironmentModal.deleteEnvironmentInput;
  deleteEnvironmentInput.type(envId);
  deleteEnvironmentModal.confirm();

  cy.findByTestId(`environment.${envId}`).should('not.exist');
  cy.url().should('include', `/environments/master`);
});
