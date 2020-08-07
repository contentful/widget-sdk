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
        const opt = options as OpenEntitySelectorOptions;

        if (opt.entityType === 'Entry') {
          return opt.multiple
            ? dialogApi.selectMultipleEntries(opt)
            : dialogApi.selectSingleEntry(opt);
        } else if (opt.entityType == 'Asset') {
          return opt.multiple
            ? dialogApi.selectMultipleAssets(opt)
            : dialogApi.selectSingleAsset(opt);
        } else {
          throw new TypeError(`Unsupported entity type "${opt.entityType}".`);
        }
      case WidgetNamespace.APP:
        return dialogApi.openCurrentApp(options as OpenCustomWidgetOptions);
      case WidgetNamespace.EXTENSION:
        return dialogApi.openExtension(options as OpenCustomWidgetOptions);
      default:
        throw new Error('Unknown dialog type.');
    }
  };
};
