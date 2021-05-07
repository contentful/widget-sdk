import { ContentTypeListPage } from './pages/ContentTypeListPage';
import { lorem } from 'faker';

test('content-type creation', () => {
  const name = lorem.slug();
  const description = lorem.words(5);
  const fieldName = lorem.slug();

  cy.login();

  const listPage = ContentTypeListPage.visit('Test: Content type creation');
  const createTypeModal = listPage.openCreateContentTypeModal();

  createTypeModal.contentTypeNameInput.type(name);
  createTypeModal.contentTypeDescriptionInput.type(description);

  const createTypePage = createTypeModal.createContentType();
  createTypePage.contentTypeName.should('have.text', name);
  createTypePage.contentTypeDescription.should('have.text', description);

  const addFieldModal = createTypePage.openAddFieldModal();
  addFieldModal.selectType('text');
  addFieldModal.fieldNameInput.type(fieldName);
  addFieldModal.createField();

  createTypePage.saveContentType();

  const row = listPage.getContentTypeTableRow(name);
  row.descriptionColumn.should('have.text', description);
  row.fieldsColumn.should('have.text', 1);

  const editTypePage = row.go();
  editTypePage.contentTypeName.should('have.text', name);

  const deleteTypeModal = editTypePage.actions.delete();
  deleteTypeModal.contentTypeNameInput.type(name);
  deleteTypeModal.confirm();

  listPage.getContentTypeTableRow(name).row.should('not.exist');
});
