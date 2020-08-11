import { getCurrentState } from './AppState';
import { Control, Editor, SidebarItem, WidgetNamespace } from 'features/widget-renderer';

const DEFAULT_WIDGET_ID = 'widgetId';

const makeEditor = (widgetId = DEFAULT_WIDGET_ID): Editor => {
  return {
    settings: {},
    widgetId,
    widgetNamespace: WidgetNamespace.APP,
  };
};
const makeControl = (fieldId): Control => {
  return {
    fieldId,
    widgetId: DEFAULT_WIDGET_ID,
    widgetNamespace: WidgetNamespace.APP,
  };
};
const makeSidebarItem = (
  widgetId = DEFAULT_WIDGET_ID,
  widgetNamespace = WidgetNamespace.APP
): SidebarItem => {
  return {
    settings: {},
    widgetId,
    widgetNamespace,
  };
};

const createEditorInterface = ({
  contentTypeId = DEFAULT_WIDGET_ID,
  editor,
  editors,
  controls,
  sidebar,
}: {
  contentTypeId: string | unknown;
  editor?: Editor;
  editors?: Editor[];
  controls?: Control[];
  sidebar?: SidebarItem[];
}) => {
  return {
    sys: {
      type: 'EditorInterface',
      space: {
        sys: {
          id: '6zsefpijez5t',
          type: 'Link',
          linkType: 'Space',
        },
      },
      version: 34,
      createdAt: '2020-04-30T09:40:11.349Z',
      createdBy: {
        sys: {
          id: '7JWRGOYWY5AnjuoNVzBwyO',
          type: 'Link',
          linkType: 'User',
        },
      },
      updatedAt: '2020-08-10T15:24:12.827Z',
      updatedBy: {
        sys: {
          id: '2YVRzNgF2sE64ooav1eKSd',
          type: 'Link',
          linkType: 'User',
        },
      },
      contentType: {
        sys: {
          id: contentTypeId,
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
    controls,
    editors,
    sidebar,
    editor,
  };
};

const createEditorInterfaceResponse = (...editorInterfaces) => {
  return {
    sys: {
      type: 'Array',
    },
    total: editorInterfaces.length,
    items: editorInterfaces,
  };
};

const createSpaceContext = (editorInterfaceResponse) => {
  return {
    cma: {
      getEditorInterfaces: jest.fn().mockResolvedValueOnce(editorInterfaceResponse),
    },
  };
};

describe('AppState', () => {
  describe('#getCurrentState', () => {
    it('includes editor', async () => {
      const contentType = 'ct1';

      const editorInterfaceResponse = createEditorInterfaceResponse(
        createEditorInterface({
          contentTypeId: contentType,
          editor: makeEditor(),
        })
      );
      const spaceContext = createSpaceContext(editorInterfaceResponse);

      const result = await getCurrentState(spaceContext, DEFAULT_WIDGET_ID);

      expect(result).toEqual({
        EditorInterface: {
          [contentType]: { editor: true },
        },
      });
    });
    it('includes editors', async () => {
      const [contentType, anotherContentType] = ['ct1', 'ct2'];

      const editorInterfaceResponse = createEditorInterfaceResponse(
        createEditorInterface({
          contentTypeId: contentType,
          editors: [makeEditor(), makeEditor('another-widget-id')],
        }),
        createEditorInterface({
          contentTypeId: anotherContentType,
          editors: [makeEditor(), makeEditor('another-widget-id')],
        })
      );
      const spaceContext = createSpaceContext(editorInterfaceResponse);

      const result = await getCurrentState(spaceContext, DEFAULT_WIDGET_ID);

      expect(result).toEqual({
        EditorInterface: {
          [contentType]: { editor: true },
          [anotherContentType]: { editor: true },
        },
      });
    });
    it('includes controls', async () => {
      const [contentType, anotherContentType] = ['ct1', 'ct2'];
      const [fieldId, anotherFieldId, yetAnotherFieldId] = ['fid1', 'fid2', 'fid3'];

      const editorInterfaceResponse = createEditorInterfaceResponse(
        createEditorInterface({
          contentTypeId: contentType,
          controls: [makeControl(fieldId), makeControl(anotherFieldId)],
        }),
        createEditorInterface({
          contentTypeId: anotherContentType,
          controls: [makeControl(yetAnotherFieldId)],
        })
      );
      const spaceContext = createSpaceContext(editorInterfaceResponse);

      const result = await getCurrentState(spaceContext, DEFAULT_WIDGET_ID);

      expect(result).toEqual({
        EditorInterface: {
          [contentType]: {
            controls: [{ fieldId: fieldId }, { fieldId: anotherFieldId }],
          },
          [anotherContentType]: {
            controls: [{ fieldId: yetAnotherFieldId }],
          },
        },
      });
    });
    it('includes sidebars', async () => {
      const [contentType, anotherContentType] = ['ct1', 'ct2'];

      const editorInterfaceResponse = createEditorInterfaceResponse(
        createEditorInterface({
          contentTypeId: contentType,
          sidebar: [
            makeSidebarItem('something', WidgetNamespace.SIDEBAR_BUILTIN),
            makeSidebarItem(),
          ],
        }),
        createEditorInterface({
          contentTypeId: anotherContentType,
          sidebar: [makeSidebarItem()],
        })
      );
      const spaceContext = createSpaceContext(editorInterfaceResponse);

      const result = await getCurrentState(spaceContext, DEFAULT_WIDGET_ID);

      expect(result).toEqual({
        EditorInterface: {
          [contentType]: {
            sidebar: { position: 1 },
          },
          [anotherContentType]: {
            sidebar: { position: 0 },
          },
        },
      });
    });
    it('returns an empty object if no editor interfaces', async () => {
      const editorInterfaceResponse = createEditorInterfaceResponse([]);
      const spaceContext = createSpaceContext(editorInterfaceResponse);

      const result = await getCurrentState(spaceContext, DEFAULT_WIDGET_ID);

      expect(result).toEqual({
        EditorInterface: {},
      });
    });
    it('handles mixed types of editor interfaces', async () => {
      const contentType = 'ct1';
      const fieldId = 'fid1';

      const editorInterfaceResponse = createEditorInterfaceResponse(
        createEditorInterface({
          contentTypeId: contentType,
          sidebar: [
            makeSidebarItem(),
            makeSidebarItem('something', WidgetNamespace.SIDEBAR_BUILTIN),
          ],
          controls: [makeControl(fieldId)],
          editors: [makeEditor()],
        })
      );
      const spaceContext = createSpaceContext(editorInterfaceResponse);

      const result = await getCurrentState(spaceContext, DEFAULT_WIDGET_ID);

      expect(result).toEqual({
        EditorInterface: {
          [contentType]: {
            sidebar: { position: 0 },
            controls: [{ fieldId }],
            editor: true,
          },
        },
      });
    });
    it('does not include anything if missing content type', async () => {
      const fieldId = 'fid1';

      const editorInterfaceResponse = createEditorInterfaceResponse(
        createEditorInterface({
          contentTypeId: null,
          sidebar: [
            makeSidebarItem(),
            makeSidebarItem('something', WidgetNamespace.SIDEBAR_BUILTIN),
          ],
          controls: [makeControl(fieldId)],
          editors: [makeEditor()],
        })
      );
      const spaceContext = createSpaceContext(editorInterfaceResponse);

      const result = await getCurrentState(spaceContext, DEFAULT_WIDGET_ID);

      expect(result).toEqual({
        EditorInterface: {},
      });
    });
  });
});
