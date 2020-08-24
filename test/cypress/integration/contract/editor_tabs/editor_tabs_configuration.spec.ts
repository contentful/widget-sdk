import { defaultRequestsMock } from '../../../util/factories';
import {
  getAllContentTypesInDefaultSpace,
  getDefaultContentType,
  getPublishedVersionOfDefaultContentType,
  getEditorInterfaceForDefaultContentType,
  saveDefaultContentTypeWithCustomSidebar,
  publishDefaultContentType,
} from '../../../interactions/content_types';
import { defaultContentTypeId, defaultSpaceId } from '../../../util/requests';
import {
  queryForCustomSidebarInDefaultOrg,
  queryForTeamsInDefaultOrg,
  queryForSelfConfigureSsoInDefaultOrg,
  queryForScimInDefaultOrg,
} from '../../../interactions/product_catalog_features';
import { defaultHeader } from '../../../util/requests';

const editorInterfaceWithCustomEditorsRequestBody = {
  sys: {
    id: 'default',
    type: 'EditorInterface',
    space: { sys: { id: 'fuuami4adicz', type: 'Link', linkType: 'Space' } },
    version: 2,
    createdAt: '2019-04-08T09:12:00.280Z',
    createdBy: { sys: { id: 'userId', type: 'Link', linkType: 'User' } },
    updatedAt: '2019-04-08T09:12:00.995Z',
    updatedBy: { sys: { id: 'userId', type: 'Link', linkType: 'User' } },
    contentType: {
      sys: { id: 'testContentType', type: 'Link', linkType: 'ContentType' },
    },
    environment: { sys: { id: 'master', type: 'Link', linkType: 'Environment' } },
  },
  controls: [
    {
      fieldId: 'testFieldName',
      widgetId: 'singleLine',
      widgetNamespace: 'builtin',
    },
  ],
  editors: [
    {
      widgetId: 'reference-tree',
      widgetNamespace: 'editor-builtin',
      settings: {},
    },
    {
      widgetId: 'default-editor',
      widgetNamespace: 'editor-builtin',
      disabled: true,
    },
  ],
};
const editorInterfaceWithCustomEditorsResponseBody = {
  sys: {
    id: 'default',
    type: 'EditorInterface',
    space: {
      sys: {
        id: 'fuuami4adicz',
        type: 'Link',
        linkType: 'Space',
      },
    },
    version: 2,
    createdAt: '2019-04-08T09:12:00.280Z',
    createdBy: {
      sys: {
        id: 'userId',
        type: 'Link',
        linkType: 'User',
      },
    },
    updatedAt: '2019-04-08T09:12:00.995Z',
    updatedBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: 'userId',
      },
    },
    contentType: {
      sys: {
        id: 'testContentType',
        type: 'Link',
        linkType: 'ContentType',
      },
    },
    environment: {
      sys: {
        id: 'master',
        type: 'Link',
        linkType: 'Environment',
      },
    },
  },
  controls: [
    {
      fieldId: 'testFieldName',
      widgetId: 'singleLine',
      widgetNamespace: 'builtin',
    },
  ],
  editors: [
    {
      widgetId: 'reference-tree',
      widgetNamespace: 'editor-builtin',
      settings: {},
    },
    {
      widgetId: 'default-editor',
      widgetNamespace: 'editor-builtin',
      disabled: true,
    },
  ],
};

const saveDefaultContentTypeEditorInterfaceWithCustomEditors = {
  willSucceed() {
    cy.addInteraction({
      provider: 'content_types',
      state: 'content_types/editor_interface_with_custom_editors',
      uponReceiving: `a request to save the editor interface of content type "${defaultContentTypeId}" with custom editors`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/editor_interface`,
        headers: defaultHeader,
        body: editorInterfaceWithCustomEditorsRequestBody,
      },
      willRespondWith: {
        status: 200,
        body: editorInterfaceWithCustomEditorsResponseBody,
      },
    }).as('saveDefaultContentTypeEditorInterfaceWithCustomEditors');

    return '@saveDefaultContentTypeEditorInterfaceWithCustomEditors';
  },
};

describe('Editor tabs configuration', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();
    // TODO: move this to a before block
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['jobs', 'entries', 'users', 'product_catalog_features'],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    });

    cy.server();

    const interactions = [
      ...defaultRequestsMock(),
      getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
      getAllContentTypesInDefaultSpace.willReturnOne(),
      getDefaultContentType.willReturnIt(),
      getPublishedVersionOfDefaultContentType.willReturnIt(),
      queryForCustomSidebarInDefaultOrg.willFindFeatureEnabled(),
      queryForTeamsInDefaultOrg.willFindFeatureEnabled(),
      queryForSelfConfigureSsoInDefaultOrg.willFindFeatureEnabled(),
      queryForScimInDefaultOrg.willFindFeatureEnabled(),
    ];

    cy.visit(
      `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/entry_editor_configuration`
    );

    cy.wait(interactions);
  });

  describe('Saving the content type with configured custom tabs', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      cy.findByTestId('reset-widet-configuration').click();
    });

    it('checks that content type with a custom tabs has been successfully saved', () => {
      const interactions = [
        saveDefaultContentTypeWithCustomSidebar.willSucceed(),
        publishDefaultContentType.willSucceed(),
        getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
        saveDefaultContentTypeEditorInterfaceWithCustomEditors.willSucceed(),
      ];

      cy.findAllByTestId('cf-ui-icon-button').first().click();

      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);

      cy.verifyNotification('success', 'Content type saved successfully');
    });
  });
});
