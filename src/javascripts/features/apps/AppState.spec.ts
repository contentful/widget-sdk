import { getCurrentState, validateState } from './AppState';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { Control, Editor, SidebarItem } from 'contentful-management/types';
import APIClient from 'data/APIClient';

const DEFAULT_WIDGET_ID = 'widgetId';
const DEFAULT_WIDGET_NAMESPACE = WidgetNamespace.APP;

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

const createAPIClient = (editorInterfaceResponse) => {
  return ({
    getEditorInterfaces: jest.fn().mockResolvedValueOnce(editorInterfaceResponse),
  } as unknown) as APIClient;
};

describe('AppState', () => {
  describe('#getCurrentState', () => {
    it('includes editor', async () => {
      const contentTypeOne = 'ct1';
      const contentTypeTwo = 'ct1';

      const editorInterfaceResponse = createEditorInterfaceResponse(
        createEditorInterface({
          contentTypeId: contentTypeOne,
          editor: makeEditor(),
        }),
        createEditorInterface({
          contentTypeId: contentTypeTwo,
          editor: makeEditor('anotherId'),
        })
      );
      const apiClient = createAPIClient(editorInterfaceResponse);

      const result = await getCurrentState(apiClient, DEFAULT_WIDGET_ID, DEFAULT_WIDGET_NAMESPACE);

      expect(result).toEqual({
        EditorInterface: {
          [contentTypeOne]: { editor: true },
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
      const apiClient = createAPIClient(editorInterfaceResponse);

      const result = await getCurrentState(apiClient, DEFAULT_WIDGET_ID, DEFAULT_WIDGET_NAMESPACE);

      expect(result).toEqual({
        EditorInterface: {
          [contentType]: { editors: { position: 0 } },
          [anotherContentType]: { editors: { position: 0 } },
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
      const apiClient = createAPIClient(editorInterfaceResponse);

      const result = await getCurrentState(apiClient, DEFAULT_WIDGET_ID, DEFAULT_WIDGET_NAMESPACE);

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
      const apiClient = createAPIClient(editorInterfaceResponse);

      const result = await getCurrentState(apiClient, DEFAULT_WIDGET_ID, DEFAULT_WIDGET_NAMESPACE);

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
      const apiClient = createAPIClient(editorInterfaceResponse);

      const result = await getCurrentState(apiClient, DEFAULT_WIDGET_ID, DEFAULT_WIDGET_NAMESPACE);

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
      const apiClient = createAPIClient(editorInterfaceResponse);

      const result = await getCurrentState(apiClient, DEFAULT_WIDGET_ID, DEFAULT_WIDGET_NAMESPACE);

      expect(result).toEqual({
        EditorInterface: {
          [contentType]: {
            sidebar: { position: 0 },
            controls: [{ fieldId }],
            editors: { position: 0 },
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
      const apiClient = createAPIClient(editorInterfaceResponse);

      const result = await getCurrentState(apiClient, DEFAULT_WIDGET_ID, DEFAULT_WIDGET_NAMESPACE);

      expect(result).toEqual({
        EditorInterface: {},
      });
    });
  });

  describe('#validateState', () => {
    it('accepts empty target states', () => {
      [null, undefined, {}, { EditorInterface: null }, { EditorInterface: [] }].forEach(
        (targetState) => {
          expect(() => validateState(targetState)).not.toThrow();
        }
      );
    });
    it('rejects unknown entity types', () => {
      expect(() => validateState({ WebhookDefinition: [] })).toThrow();
    });
    describe('controls validation', () => {
      it('accepts empty controls', () => {
        [[], undefined, null].forEach((controls) => {
          expect(() => {
            validateState({
              EditorInterface: {
                someCtId: { controls },
              },
            });
          }).not.toThrow();
        });
      });

      it('accepts controls for multiple CTs with defined field IDs', () => {
        expect(() => {
          validateState({
            EditorInterface: {
              someCtId: {
                controls: [{ fieldId: 'title' }, { fieldId: 'hello-world' }],
              },
              otherCt: {
                controls: [{ fieldId: 'test' }],
              },
            },
          });
        }).not.toThrow();
      });

      it('rejects invalid controls', () => {
        [
          {}, // no field ID
          { fieldId: 123 }, // field ID not a string
          { fieldId: '' }, // field ID is empty
          { fieldId: 'string', settings: 'yolo' }, //settings is not an object
          { fieldId: 'fieldId', randomKey: "I shouldn't be here" }, // additional property on object
        ].forEach((control) => {
          expect(() => {
            validateState({
              EditorInterface: {
                someCtId: { controls: [control] },
              },
            });
          }).toThrow();
        });
      });
    });
    describe('sidebar validation', () => {
      it('accepts empty sidebar', () => {
        [undefined, null].forEach((sidebar) => {
          expect(() => {
            validateState({
              EditorInterface: {
                someCtId: { sidebar },
              },
            });
          }).not.toThrow();
        });
      });

      it('accepts position for multiple CTs', () => {
        expect(() => {
          validateState({
            EditorInterface: {
              someCtId: {
                sidebar: { position: 1 },
              },
              otherCt: {
                sidebar: { position: 7 },
              },
            },
          });
        }).not.toThrow();
      });

      it('accepts sidebar set to true', () => {
        expect(() => {
          validateState({
            EditorInterface: {
              someCtId: { sidebar: true },
            },
          });
        }).not.toThrow();
      });

      it('rejects invalid sidebar', () => {
        [
          { position: 'TEST' }, // position is not a number
          { position: 1.23 }, // position is not an integer
          { position: -1 }, // position is a negative number
          { position: 1, settings: 'yolo' }, //settings is not an object
          { position: 1, randomKey: "I shouldn't be here" }, // additional property on object
        ].forEach((sidebar) => {
          expect(() => {
            validateState({
              EditorInterface: {
                someCtId: { sidebar },
              },
            });
          }).toThrow();
        });
      });
    });
    describe('editor validation', () => {
      it('accepts empty editor', () => {
        [null, undefined].forEach((editor) => {
          expect(() => {
            validateState({
              EditorInterface: {
                someCtId: { editor },
              },
            });
          }).not.toThrow();
        });
      });

      it('accepts editor set to true', () => {
        expect(() => {
          validateState({
            EditorInterface: {
              someCtId: { editor: true },
            },
          });
        }).not.toThrow();
      });

      it('reject invalid editor', () => {
        ['string', 1023].forEach((editor) => {
          expect(() => {
            validateState({
              EditorInterface: {
                someCtId: { editor },
              },
            });
          }).toThrow();
        });
      });
    });
    describe('editors validation', () => {
      it('accepts empty editors', () => {
        [null, undefined].forEach((editors) => {
          expect(() => {
            validateState({
              EditorInterface: {
                someCtId: { editors },
              },
            });
          }).not.toThrow();
        });
      });

      it('accepts position for multiple CTs', () => {
        expect(() => {
          validateState({
            EditorInterface: {
              someCtId: {
                editors: { position: 1 },
              },
              otherCt: {
                editors: { position: 7 },
              },
            },
          });
        }).not.toThrow();
      });

      it('accepts editor set to true', () => {
        expect(() => {
          validateState({
            EditorInterface: {
              someCtId: { editors: true },
            },
          });
        }).not.toThrow();
      });

      it('reject invalid editor', () => {
        [
          { position: 'TEST' }, // position is not a number
          { position: 1.23 }, // position is not an integer
          { position: -1 }, // position is a negative number,
          { position: 1, settings: 'yolo' }, //settings is not an object
          { position: 1, randomKey: "I shouldn't be here" }, // additional property on object
        ].forEach((editors) => {
          expect(() => {
            validateState({
              EditorInterface: {
                someCtId: { editors },
              },
            });
          }).toThrow();
        });
      });
    });

    it('allows to define all properties on multiple CTs', () => {
      expect(() => {
        validateState({
          EditorInterface: {
            someCtId: {
              fields: [{ fieldId: 'title' }, { fieldId: 'hello' }],
              editor: true,
            },
            otherCt: {
              fields: [{ fieldId: 'author' }],
              sidebar: {
                position: 3,
              },
            },
            yetAnotherCt: {
              sidebar: true,
              editor: true,
            },
          },
        });
      }).not.toThrow();
    });
  });
});
