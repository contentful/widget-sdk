import { setupHandlers } from './setupHandlers';
import { PostMessageChannel } from '../PostMessageChannel';
import { WidgetLocation } from '../interfaces';
import { KnownSDK } from 'contentful-ui-extensions-sdk';
import { ChannelMethod } from '../channelTypes';

// `can` is used directly, without wrapping, so we need to provide it.
const sdk = ({ access: { can: jest.fn() } } as unknown) as KnownSDK;

const sharedMethods = [
  ChannelMethod.CallSpaceMethod,
  ChannelMethod.Notify,
  ChannelMethod.OpenDialog,
  ChannelMethod.CheckAccess,
  ChannelMethod.NavigateToBulkEditor,
  ChannelMethod.NavigateToContentEntity,
  ChannelMethod.NavigateToPage,
  ChannelMethod.NavigateToPageExtension,
];

const fieldMethods = [ChannelMethod.SetValue, ChannelMethod.RemoveValue, ChannelMethod.SetInvalid];

const fieldEditingLocations = [WidgetLocation.ENTRY_FIELD, WidgetLocation.ENTRY_FIELD_SIDEBAR];

const allLocationsBut = (exceptions: WidgetLocation[]) =>
  Object.keys(WidgetLocation)
    .map((k) => WidgetLocation[k])
    .filter((l) => !exceptions.includes(l));

describe('setupHandlers', () => {
  let registerHandler: jest.Mock;
  let channel: PostMessageChannel;

  beforeEach(() => {
    registerHandler = jest.fn();
    channel = ({ registerHandler } as unknown) as PostMessageChannel;
  });

  it('registers shared handlers', () => {
    Object.keys(WidgetLocation).forEach((k) => {
      setupHandlers(channel, sdk, WidgetLocation[k]);

      sharedMethods.forEach((method) => {
        expect(registerHandler).toHaveBeenCalledWith(method, expect.any(Function));
      });
    });
  });

  describe('field handlers', () => {
    it('registers field handlers when editing a field', () => {
      fieldEditingLocations.forEach((location) => {
        setupHandlers(channel, sdk, location);

        fieldMethods.forEach((method) => {
          expect(registerHandler).toHaveBeenCalledWith(method, expect.any(Function));
        });
      });
    });

    it('does not register field handlers when not editing a field', () => {
      allLocationsBut(fieldEditingLocations).forEach((location) => {
        setupHandlers(channel, sdk, location);

        fieldMethods.forEach((method) => {
          expect(registerHandler).not.toHaveBeenCalledWith(method, expect.any(Function));
        });
      });
    });
  });

  describe('dialog close handler', () => {
    it('registers close handler in the dialog location', () => {
      const close = jest.fn();

      setupHandlers(channel, { ...sdk, close }, WidgetLocation.DIALOG);

      expect(registerHandler).toHaveBeenCalledWith(ChannelMethod.CloseDialog, expect.any(Function));

      const { calls } = registerHandler.mock;
      const closeWrapped = calls[calls.length - 1][1];
      closeWrapped('test');
      expect(close).toHaveBeenCalledTimes(1);
      expect(close).toHaveBeenCalledWith('test');
    });

    it('does not register dialog close handler when not in dialog', () => {
      allLocationsBut([WidgetLocation.DIALOG]).forEach((location) => {
        setupHandlers(channel, sdk, location);

        expect(registerHandler).not.toHaveBeenCalledWith(
          ChannelMethod.CloseDialog,
          expect.any(Function)
        );
      });
    });
  });
});
