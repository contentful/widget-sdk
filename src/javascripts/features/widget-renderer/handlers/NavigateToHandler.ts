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

export function makeNavigateToBulkEditorHandler(navigatorApi: NavigatorAPI) {
  return function ({ entryId, fieldId, locale, index }: NavigateToBulkEditorOptions) {
    return navigatorApi.openBulkEditor(entryId, { fieldId, locale, index });
  };
}

export function makeNavigateToContentEntityHandler(navigatorApi: NavigatorAPI) {
  return function (options: NavigateToContentEntityOptions) {
    const isExisting = typeof options.id === 'string';

    if (options.entityType === 'Entry') {
      if (isExisting) {
        return navigatorApi.openEntry(options.id!, options);
      }

      if (options.contentTypeId) {
        return navigatorApi.openNewEntry(options.contentTypeId, options);
      }

      throw new RangeError(`Unknown Entry and Content Type`);
    } else if (options.entityType === 'Asset') {
      if (isExisting) {
        return navigatorApi.openAsset(options.id!, options);
      }

      return navigatorApi.openNewAsset(options);
    }

    throw new RangeError(`Unknown Entity Type ${options.entityType}`);
  };
}

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
