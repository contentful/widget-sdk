import { KnownSDK, FieldExtensionSDK, DialogExtensionSDK } from 'contentful-ui-extensions-sdk';

import { PostMessageChannel } from '../PostMessageChannel';
import { ChannelMethod } from '../channelTypes';
import { WidgetLocation } from '../interfaces';

import { makeCallSpaceMethodHandler } from './CallSpaceMethodHandler';
import { makeNotifyHandler } from './NotifyHandler';
import { makeOpenDialogHandler } from './DialogHandler';
import {
  makeNavigateToBulkEditorHandler,
  makeNavigateToContentEntityHandler,
  makeNavigateToPageHandler,
} from './NavigateToHandler';
import { makeSetValueHandler, makeRemoveValueHandler, makeSetInvalidHandler } from './FieldHandler';
import { isFieldEditingLocation } from '../utils';

export function setupHandlers(
  channel: PostMessageChannel,
  sdk: KnownSDK,
  location: WidgetLocation
) {
  // Shared handlers for all locations:
  channel.registerHandler(ChannelMethod.CallSpaceMethod, makeCallSpaceMethodHandler(sdk.space));
  channel.registerHandler(ChannelMethod.Notify, makeNotifyHandler(sdk.notifier));
  channel.registerHandler(ChannelMethod.OpenDialog, makeOpenDialogHandler(sdk.dialogs));
  channel.registerHandler(ChannelMethod.CheckAccess, sdk.access.can);

  channel.registerHandler(
    ChannelMethod.NavigateToBulkEditor,
    makeNavigateToBulkEditorHandler(sdk.navigator)
  );

  channel.registerHandler(
    ChannelMethod.NavigateToContentEntity,
    makeNavigateToContentEntityHandler(sdk.navigator)
  );

  // This is not a mistake. NavigateToPage and NavigateToPageExtension have the same handler
  // who understands internally what to do. Reason for this is that UIE SDK uses for both the
  // events the same 'navigateToPage', but in the bridge we cater for these two different events
  channel.registerHandler(ChannelMethod.NavigateToPage, makeNavigateToPageHandler(sdk.navigator));
  channel.registerHandler(
    ChannelMethod.NavigateToPageExtension,
    makeNavigateToPageHandler(sdk.navigator)
  );

  // Handlers specific to field editing.
  if (isFieldEditingLocation(location)) {
    const { field } = sdk as FieldExtensionSDK;
    channel.registerHandler(ChannelMethod.SetValue, makeSetValueHandler(field));
    channel.registerHandler(ChannelMethod.RemoveValue, makeRemoveValueHandler(field));
    channel.registerHandler(ChannelMethod.SetInvalid, makeSetInvalidHandler(field));
  }

  // Handlers specific to dialogs.
  if (location === WidgetLocation.DIALOG) {
    const { close } = sdk as DialogExtensionSDK;
    channel.registerHandler(ChannelMethod.CloseDialog, (data?: any) => close(data));
  }
}
