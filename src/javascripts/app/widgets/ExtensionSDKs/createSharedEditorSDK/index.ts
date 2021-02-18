import { SharedEditorSDK, ContentType, EntryAPI } from '@contentful/app-sdk';

interface SharedBasedWidgetSDK {
  entryApi: EntryAPI;
  contentTypeApi: ContentType;
  editorApi: any;
}

export const createSharedEditorSDK = ({
  contentTypeApi,
  entryApi,
  editorApi,
}: SharedBasedWidgetSDK): SharedEditorSDK => {
  return {
    contentType: contentTypeApi,
    entry: entryApi,
    editor: editorApi,
  };
};
