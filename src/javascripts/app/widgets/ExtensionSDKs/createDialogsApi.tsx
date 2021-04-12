import React from 'react';
import { Modal } from '@contentful/forma-36-react-components';
import {
  DialogExtensionSDK,
  DialogsAPI,
  OpenCustomWidgetOptions,
  BaseExtensionSDK,
  IdsAPI,
} from '@contentful/app-sdk';
import { omit, noop } from 'lodash';

import { entitySelector } from 'features/entity-search';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import * as ExtensionDialogs from 'widgets/ExtensionDialogs';
import trackExtensionRender from 'widgets/TrackExtensionRender';
import { toLegacyWidget } from 'widgets/WidgetCompat';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';
import {
  Widget,
  WidgetRenderer,
  WidgetLocation,
  WidgetNamespace,
} from '@contentful/widget-renderer';
import { applyDefaultValues } from 'widgets/WidgetParametersUtils';

type BaseExtensionSDKWithoutDialogs = Omit<BaseExtensionSDK, 'dialogs' | 'ids'> & {
  ids: Omit<IdsAPI, 'field' | 'entry' | 'contentType'>;
};

const denyDialog = () => {
  throw makeReadOnlyApiError(ReadOnlyApi.Dialog);
};

export function createReadOnlyDialogsApi() {
  return {
    openAlert: denyDialog,
    openConfirm: denyDialog,
    openCurrent: denyDialog,
    openCurrentApp: denyDialog,
    openExtension: denyDialog,
    openPrompt: denyDialog,
    selectMultipleAssets: denyDialog,
    selectMultipleEntries: denyDialog,
    selectSingleAsset: denyDialog,
    selectSingleEntry: denyDialog,
  };
}

export function createDialogsApi(
  sdk: BaseExtensionSDKWithoutDialogs,
  currentAppWidget?: Widget
): DialogsAPI {
  const entitySelectorSdk = Object.assign({}, sdk, {
    space: {
      ...sdk.space,
      getTags: () => {
        return sdk.space.readTags(0, 10000);
      },
    },
  });

  return {
    openAlert: ExtensionDialogs.openAlert,
    openConfirm: ExtensionDialogs.openConfirm,
    openPrompt: ExtensionDialogs.openPrompt,
    selectSingleEntry: (async (opts) => {
      const result = await entitySelector.openFromWidget(entitySelectorSdk, {
        ...opts,
        entityType: 'Entry',
      });
      if (result && result.length > 0) {
        return result[0] ?? null;
      }
      return null;
    }) as DialogExtensionSDK['dialogs']['selectSingleEntry'],
    selectMultipleEntries: (async (opts) => {
      const result = await entitySelector.openFromWidget(entitySelectorSdk, {
        ...opts,
        entityType: 'Entry',
        multiple: true,
      });
      return result ?? null;
    }) as DialogExtensionSDK['dialogs']['selectMultipleEntries'],
    selectSingleAsset: (async (opts) => {
      const result = await entitySelector.openFromWidget(entitySelectorSdk, {
        ...opts,
        entityType: 'Asset',
      });
      if (result && result.length > 0) {
        return result[0] ?? null;
      }
      return null;
    }) as DialogExtensionSDK['dialogs']['selectSingleAsset'],
    selectMultipleAssets: async function (opts) {
      const result = await entitySelector.openFromWidget(entitySelectorSdk, {
        ...opts,
        entityType: 'Asset',
        multiple: true,
      });
      return result ?? null;
    } as DialogExtensionSDK['dialogs']['selectMultipleAssets'],
    openCurrent: function (opts) {
      if (sdk.ids.app) {
        return this.openCurrentApp(opts);
      } else {
        return this.openExtension({
          ...opts,
          id: sdk.ids.extension,
        });
      }
    },
    openCurrentApp: (opts) => {
      const options = { ...opts, id: sdk.ids.app };
      return openCustomDialog(WidgetNamespace.APP, options, sdk, currentAppWidget);
    },
    openExtension: (opts) => {
      return openCustomDialog(WidgetNamespace.EXTENSION, opts, sdk);
    },
  };
}

async function findWidget(
  widgetNamespace: WidgetNamespace,
  widgetId: string,
  currentAppWidget?: Widget
) {
  const loader = await getCustomWidgetLoader();
  const widget = await loader.getOne({ widgetNamespace, widgetId });

  // If a widget was found, meaning that an app or an extension
  // is already installed, just return it.
  if (widget) {
    return widget;
  }

  // It is possible to open dialogs when installing an app, even before the app is installed.
  // Before it's installed, there is no AppInstallation entity, so the result of loader call
  // above will be empty. In this case we use the widget that is passed in.

  if (widgetNamespace === WidgetNamespace.APP && currentAppWidget) {
    return currentAppWidget;
  }

  throw new Error(`No widget with ID "${widgetId}" found in "${widgetNamespace}" namespace.`);
}

function createDialogSDK(
  sdk: BaseExtensionSDKWithoutDialogs,
  widget: Widget,
  onClose: (data?: any) => void,
  invocationParameters: Record<string, any>
): DialogExtensionSDK {
  // Use installation parameters as they are.
  let installationParameters = widget.parameters.values.installation;
  // Extensions can declare defaults for parameters, we need to apply them.
  if (widget.namespace === WidgetNamespace.EXTENSION) {
    // TODO: eventually move `applyDefaultValues` to the renderer library
    // and integrate with the loader class so defaults are auto-applied.
    installationParameters = applyDefaultValues(
      widget.parameters.definitions.installation,
      installationParameters
    );
  }

  const sdkWithoutDialogs = {
    ...sdk,
    location: {
      is: (location: string) => location === WidgetLocation.DIALOG,
    },
    parameters: {
      installation: installationParameters,
      // No instance parameters for dialogs.
      instance: {},
      // Parameters passed directly to the dialog.
      invocation: invocationParameters,
    },
    ids: {
      // Do not leak entry- or field-specific IDs nor widget ID.
      ...omit(sdk.ids, ['app', 'extension']),
      // Expose widget ID (can be the same when doing `openCurrent`).
      [widget.namespace]: widget.id,
    },
    // Pass onClose in order to allow child modal to close.
    close: onClose,
    window: {
      // There are no iframes in the internal API so any methods related
      // to <iframe> height can be safely ignored.
      updateHeight: noop,
      startAutoResizer: noop,
      stopAutoResizer: noop,
    },
  };

  return {
    ...sdkWithoutDialogs,
    dialogs: createDialogsApi(sdkWithoutDialogs as BaseExtensionSDKWithoutDialogs),
  };
}

async function openCustomDialog(
  namespace: WidgetNamespace,
  options: OpenCustomWidgetOptions,
  sdk: BaseExtensionSDKWithoutDialogs,
  currentAppWidget?: Widget
) {
  if (!options.id) {
    throw new Error('No ID provided.');
  }

  const widget = await findWidget(namespace, options.id, currentAppWidget);

  return ModalLauncher.open(({ isShown, onClose }) => {
    const size =
      typeof options.width === 'number' && Number.isInteger(options.width)
        ? `${options.width}px`
        : (options.width as string | undefined);

    const dialogSdk = createDialogSDK(sdk, widget, onClose, options.parameters || {});

    return (
      <Modal
        key={`${Date.now()}`}
        shouldCloseOnOverlayClick={options.shouldCloseOnOverlayClick || false}
        shouldCloseOnEscapePress={options.shouldCloseOnEscapePress || false}
        allowHeightOverflow={options.allowHeightOverflow || false}
        position={options.position || 'center'}
        isShown={isShown}
        onClose={() => onClose()}
        size={size || '700px'}>
        {() => (
          <>
            {options.title && <Modal.Header title={options.title} onClose={() => onClose()} />}

            <WidgetRenderer
              location={WidgetLocation.DIALOG}
              sdk={dialogSdk}
              widget={widget}
              minHeight={options.minHeight}
              onRender={(widget, location) =>
                trackExtensionRender(location, toLegacyWidget(widget), sdk.ids.environment)
              }
            />
          </>
        )}
      </Modal>
    );
  });
}
