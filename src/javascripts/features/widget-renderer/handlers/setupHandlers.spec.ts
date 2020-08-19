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

const fieldEditingLocations = [WidgetLocation.ENTRY_FIELD, WidgetLocation.ENTRY_FIELD_SIDEBAR];
const entryEditingLocations = [WidgetLocation.ENTRY_SIDEBAR, WidgetLocation.ENTRY_EDITOR].concat(
  fieldEditingLocations
);

const allLocationsBut = (exceptions: WidgetLocation[]): WidgetLocation[] =>
  Object.keys(WidgetLocation)
    .map((k) => WidgetLocation[k])
    .filter((l) => !exceptions.includes(l));

const allLocations = allLocationsBut([]);

describe('setupHandlers', () => {
  let registerHandler: jest.Mock;
  let channel: PostMessageChannel;

  beforeEach(() => {
    registerHandler = jest.fn();
    channel = ({ registerHandler } as unknown) as PostMessageChannel;
  });

  it('registers shared handlers', () => {
    allLocations.forEach((location) => {
      setupHandlers(channel, sdk, location);

      sharedMethods.forEach((method) => {
        expect(registerHandler).toHaveBeenCalledWith(method, expect.any(Function));
      });
    });
  });

  describe('entry editing - field value handlers', () => {
    const methods = [ChannelMethod.SetValue, ChannelMethod.RemoveValue];

    it('registers field handlers when editing an entry', () => {
      entryEditingLocations.forEach((location) => {
        setupHandlers(channel, sdk, location);

        methods.forEach((method) => {
          expect(registerHandler).toHaveBeenCalledWith(method, expect.any(Function));
        });
      });
    });

    it('does not register field handlers when not editing an entry', () => {
      allLocationsBut(entryEditingLocations).forEach((location) => {
        setupHandlers(channel, sdk, location);

        methods.forEach((method) => {
          expect(registerHandler).not.toHaveBeenCalledWith(method, expect.any(Function));
        });
      });
    });
  });

  describe('field editing - mark invalid handler', () => {
    it('registers mark invalid handler when editing a field', () => {
      fieldEditingLocations.forEach((location) => {
        setupHandlers(channel, sdk, location);
        expect(registerHandler).toHaveBeenCalledWith(
          ChannelMethod.SetInvalid,
          expect.any(Function)
        );
      });
    });

    it('does not register mark invalid handler when not editing a field', () => {
      allLocationsBut(fieldEditingLocations).forEach((location) => {
        setupHandlers(channel, sdk, location);
        expect(registerHandler).not.toHaveBeenCalledWith(
          ChannelMethod.SetInvalid,
          expect.any(Function)
        );
      });
    });
  });

  describe('dialog - close handler', () => {
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
