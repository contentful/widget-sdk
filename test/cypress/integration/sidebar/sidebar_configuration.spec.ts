import { defaultRequestsMock } from '../../util/factories';
import {
  allContentTypesResponse,
  concreteContentTypeResponse,
  concretePublishedContentTypeResponse
} from '../../interactions/content_types';
import { noExtensionsResponse } from '../../interactions/extensions';
import { editorInterfaceResponse } from '../../interactions/content_types';
import * as state from '../../util/interactionState';
import { defaultContentTypeId, defaultSpaceId } from '../../util/requests';

describe('Sidebar configuration', () => {
  before(() => {
    cy.setAuthTokenToLocalStorage();
    defaultRequestsMock();
    noExtensionsResponse();
    editorInterfaceResponse();
    allContentTypesResponse();
    concreteContentTypeResponse();
    concretePublishedContentTypeResponse();

    cy.visit(
      `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/sidebar_configuration`
    );
    cy.wait([`@${state.Token.VALID}`, `@${state.PreviewEnvironments.NONE}`]);
  });

  it('opening the page with no configuration saved', () => {
    cy.getByTestId('default-sidebar-option')
      .find('input')
      .should('be.checked');

    cy.getByTestId('custom-sidebar-option')
      .find('input')
      .should('not.be.checked');
  });
});
