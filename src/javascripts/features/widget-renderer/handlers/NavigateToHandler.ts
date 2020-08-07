import { NavigatorAPI } from 'contentful-ui-extensions-sdk';
import { WidgetNamespace } from '../interfaces';

interface NavigateToBulkEditorOptions {
  entryId: string;
  fieldId: string;
  locale: string;
  index: number;
}

type NavigateToContentEntityOptions = Partial<{
  entityType: 'Entry' | 'Asset';
  slideIn: boolean;
  id?: string;
  contentTypeId: string;
}>;

export const makeNavigateToBulkEditorHandler = (navigatorApi: NavigatorAPI) => {
  return function ({ entryId, fieldId, locale, index }: NavigateToBulkEditorOptions) {
    return navigatorApi.openBulkEditor(entryId, { fieldId, locale, index });
  };
};

export const makeNavigateToContentEntityHandler = (navigatorApi: NavigatorAPI) => {
  return function (options: NavigateToContentEntityOptions) {
    const navigateToExisting = typeof options.id === 'string';

    if (options.entityType === 'Entry') {
      if (navigateToExisting) {
        return navigatorApi.openEntry(options.id!, options);
      } else if (options.contentTypeId) {
        return navigatorApi.openNewEntry(options.contentTypeId, options);
      } else {
        throw new Error('One of entry ID or content type ID is required.');
      }
    } else if (options.entityType === 'Asset') {
      if (navigateToExisting) {
        return navigatorApi.openAsset(options.id!, options);
      } else {
        return navigatorApi.openNewAsset(options);
      }
    } else {
      throw new Error(`Unsupported entity type "${options.entityType}".`);
    }
  };
};

interface NavigateToPageHandlerOptions {
  id: string;
  path: string;
  type: WidgetNamespace;
}

export const makeNavigateToPageHandler = (navigatorApi: NavigatorAPI) => {
  return function (options: NavigateToPageHandlerOptions) {
    return options.type === WidgetNamespace.APP
      ? navigatorApi.openCurrentAppPage(options)
      : navigatorApi.openPageExtension(options);
  };
};
