import { AbstractPage } from './AbstractPage';

export class ContentTypeListPage extends AbstractPage {
  static visit(spaceName: string) {
    const page = new ContentTypeListPage();
    page.sidePanel.goToSpace(spaceName);
    page.goToContentModel();

    return page;
  }

  goToContentModel() {
    this.navBar.goTo('content-model');
  }

  openCreateContentTypeModal() {
    cy.findByTestId('create-content-type').click();

    return new CreateContentTypeModal();
  }

  getContentTypeTableRow(contentTypeName: string) {
    return new ContentTypeTableRow(contentTypeName);
  }
}

class ContentTypeTableRow {
  constructor(private contentTypeName: string) {}

  get row() {
    return cy
      .findByTestId('content-type-list')
      .find(`[data-content-type-name="${this.contentTypeName}"]`);
  }

  get descriptionColumn() {
    return this.row.findByTestId('cell-description');
  }

  get fieldsColumn() {
    return this.row.findByTestId('cell-fields');
  }

  go() {
    this.row.click();

    return new ContentTypeDetailPage();
  }
}

class CreateContentTypeModal {
  private static get contentTypeModal() {
    return cy.findByTestId('create-content-type-modal');
  }

  get contentTypeNameInput() {
    return CreateContentTypeModal.contentTypeModal.findByLabelText('Name(required)');
  }

  get contentTypeIdentifierInput() {
    return CreateContentTypeModal.contentTypeModal.findByLabelText('Api Identifier(required)');
  }

  get contentTypeDescriptionInput() {
    return CreateContentTypeModal.contentTypeModal.findByLabelText('Description');
  }

  createContentType() {
    CreateContentTypeModal.contentTypeModal.findByTestId('content-type-form-confirm').click();

    return new ContentTypeDetailPage();
  }
}

class ContentTypeDetailPage {
  get contentTypeName() {
    return cy.findByTestId('workbench-title');
  }

  get contentTypeDescription() {
    return cy.findByTestId('workbench-description');
  }

  get actions() {
    cy.findByTestId('content-type-actions').click();

    return new ContentTypeDetailActions();
  }

  openAddFieldModal() {
    cy.findByTestId('add-field-button').click();

    return new AddContentTypeFieldModal();
  }

  saveContentType() {
    cy.findByTestId('save-content-type').click();

    // notification
    cy.findByText('Content type saved successfully', { timeout: 20000 }).should('be.visible');

    const listPage = new ContentTypeListPage();
    listPage.goToContentModel();

    return listPage;
  }
}

class ContentTypeDetailActions {
  delete() {
    cy.findByTestId('delete-content-type').click();

    return new DeleteContentTypeModal();
  }
}

class DeleteContentTypeModal {
  get contentTypeNameInput() {
    return cy.findByTestId('delete-content-type-repeat-input');
  }

  confirm() {
    cy.findByTestId('delete-content-type-confirm').click();

    cy.findByText('Content type deleted successfully', { timeout: 20000 }).should('be.visible');
  }
}

class AddContentTypeFieldModal {
  private static get addFieldModal() {
    return cy.findByTestId('add_field_dialog_modal');
  }

  selectType(type: 'text' | 'number') {
    AddContentTypeFieldModal.addFieldModal
      .findAllByTestId('select-field')
      .get(`[data-field-type="select-field-${type}"]`)
      .click();
  }

  get fieldNameInput() {
    return AddContentTypeFieldModal.addFieldModal.findByLabelText('Name');
  }

  get fieldIdInput() {
    return AddContentTypeFieldModal.addFieldModal.findByLabelText('Field ID');
  }

  createField() {
    AddContentTypeFieldModal.addFieldModal.findByTestId('field-create').click();
  }
}
