import {
  DialogsAPI,
  OpenAlertOptions,
  OpenConfirmOptions,
  OpenCustomWidgetOptions,
} from 'contentful-ui-extensions-sdk';
import { WidgetNamespace } from '../interfaces';

interface OpenEntitySelectorOptions {
  locale: string;
  entityType: 'Entry' | 'Asset';
  multiple: boolean;
  min: number;
  max: number;
  contentType: string[];
  mimetypeGroups: string[];
}

enum SimpleDialogs {
  Alert = 'alert',
  Confirm = 'confirm',
  Prompt = 'prompt',
}

type DialogType =
  | SimpleDialogs
  | 'entitySelector'
  | WidgetNamespace.APP
  | WidgetNamespace.EXTENSION;

type OpenDialogHandlerOptions = OpenAlertOptions | OpenConfirmOptions | OpenEntitySelectorOptions;

export const makeOpenDialogHandler = (dialogApi: DialogsAPI) => {
  return function (type: DialogType, options: OpenDialogHandlerOptions) {
    switch (type) {
      case SimpleDialogs.Alert:
        return dialogApi.openAlert(options as OpenAlertOptions);
      case SimpleDialogs.Confirm:
        return dialogApi.openConfirm(options as OpenAlertOptions);
      case SimpleDialogs.Prompt:
        return dialogApi.openPrompt(options as OpenAlertOptions);
      case 'entitySelector':
        return openEntitySelector(options as OpenEntitySelectorOptions);
      case WidgetNamespace.APP:
        return dialogApi.openCurrentApp(options as OpenCustomWidgetOptions);
      case WidgetNamespace.EXTENSION:
        return dialogApi.openExtension(options as OpenCustomWidgetOptions);
      default:
        throw new Error('Unknown dialog type.');
    }
  };

  function openEntitySelector(options: OpenEntitySelectorOptions) {
    if (options.entityType === 'Entry') {
      return options.multiple
        ? dialogApi.selectMultipleEntries(options)
        : dialogApi.selectSingleEntry(options);
    } else if (options.entityType == 'Asset') {
      return options.multiple
        ? dialogApi.selectMultipleAssets(options)
        : dialogApi.selectSingleAsset(options);
    } else {
      throw new Error(`Unsupported entity type "${options.entityType}".`);
    }
  }
};
