import { WidgetRendererProps } from '../WidgetRenderer';
import {
  DialogsAPI as _DialogsAPI,
  OpenAlertOptions,
  OpenConfirmOptions,
  OpenCustomWidgetOptions,
} from 'contentful-ui-extensions-sdk';
import { WidgetNamespace } from '../interfaces';

export type DialogsAPI = _DialogsAPI;
export type OnClose = (data?: any) => Promise<void>;

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

type DialogType = SimpleDialogs | 'entitySelector' | WidgetNamespace;
type OpenDialogHandlerOptions = OpenAlertOptions | OpenConfirmOptions | OpenEntitySelectorOptions;

export const makeOpenDialogHandler = (dialogApi: WidgetRendererProps['apis']['dialogs']) => {
  return async function (type: DialogType, options: OpenDialogHandlerOptions) {
    switch (type) {
      case SimpleDialogs.Alert:
        return dialogApi?.openAlert(options as OpenAlertOptions);
      case SimpleDialogs.Confirm:
        return dialogApi?.openConfirm(options as OpenAlertOptions);
      case SimpleDialogs.Prompt:
        return dialogApi?.openPrompt(options as OpenAlertOptions);
      case 'entitySelector':
        const opt = options as OpenEntitySelectorOptions;

        if (opt.entityType === 'Entry') {
          return opt.multiple
            ? dialogApi?.selectMultipleEntries(opt)
            : dialogApi?.selectSingleEntry(opt);
        } else if (opt.entityType == 'Asset') {
          return opt.multiple
            ? dialogApi?.selectMultipleAssets(opt)
            : dialogApi?.selectSingleAsset(opt);
        } else {
          throw new TypeError(`Unknown content type ${opt.entityType}`);
        }
      case WidgetNamespace.APP:
        return dialogApi?.openCurrentApp(options as OpenCustomWidgetOptions);
      case WidgetNamespace.EXTENSION:
        return dialogApi?.openExtension(options as OpenCustomWidgetOptions);
      default:
        throw new Error('Unknown dialog type.');
    }
  };
};

export const makeCloseDialogHandler = (onClose?: OnClose) => {
  return async function(data: any) {
    return onClose ? onClose(data) : undefined;
  }
}