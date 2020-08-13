import { PostMessageChannel } from './PostMessageChannel';
import { ChannelMethod, ChannelEvent, IncomingMessage } from './channelTypes';
import { ConnectMessage } from './makeConnectMessage';

const flushImmediatePromises = () => new Promise((resolve) => setTimeout(resolve, 1));

const CONNECT_MSG = ({ test: true } as unknown) as ConnectMessage;

describe('PostMessageChannel', () => {
  let postMessage: jest.Mock;
  let iframe: HTMLIFrameElement;
  let window: Window;
  let channel: PostMessageChannel;

  beforeEach(() => {
    postMessage = jest.fn();
    iframe = ({ contentWindow: { postMessage } } as unknown) as HTMLIFrameElement;
    window = ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown) as Window;
    channel = new PostMessageChannel(iframe, window);

    expect(window.addEventListener).toHaveBeenCalledTimes(1);
  });

  describe('.connect() and .send()', () => {
    it('sends initial message', () => {
      channel.connect(CONNECT_MSG);

      expect(postMessage).toHaveBeenCalledTimes(1);
      expect(postMessage).toHaveBeenCalledWith(
        {
          method: ChannelEvent.Connect,
          params: [{ id: expect.any(String), test: true }, []],
        },
        '*'
      );
    });

    it('offloads the message queue and sends consecutive messages', () => {
      channel.send(ChannelEvent.ValueChanged, ['EVENT1']);
      channel.send(ChannelEvent.IsDisabledChangedForFieldLocale, ['EVENT2']);

      channel.connect(CONNECT_MSG);

      channel.send(ChannelEvent.LocaleSettingsChanged, ['EVENT3']);

      expect(postMessage).toHaveBeenCalledTimes(2);
      expect(postMessage.mock.calls).toEqual([
        [
          {
            method: ChannelEvent.Connect,
            params: [
              { id: expect.any(String), test: true },
              [
                { method: ChannelEvent.ValueChanged, params: ['EVENT1'] },
                { method: ChannelEvent.IsDisabledChangedForFieldLocale, params: ['EVENT2'] },
              ],
            ],
          },
          '*',
        ],
        [
          {
            method: ChannelEvent.LocaleSettingsChanged,
            params: ['EVENT3'],
          },
          '*',
        ],
      ]);
    });
  });

  describe('.destroy()', () => {
    it('stops to listen to incoming messages', () => {
      channel.destroy();

      expect(window.removeEventListener).toHaveBeenCalledTimes(1);
    });

    it('ignores following .send() calls', () => {
      channel.destroy();

      channel.send(ChannelEvent.SysChanged, ['data']);

      expect(postMessage).toHaveBeenCalledTimes(0);
    });
  });

  describe('.registerHandler()', () => {
    it('disallows to register two handlers for the same method', () => {
      channel.registerHandler(ChannelMethod.CallSpaceMethod, jest.fn());

      expect(() => {
        channel.registerHandler(ChannelMethod.CallSpaceMethod, jest.fn());
      }).toThrowError(/was already registered/);
    });

    it('ignores incoming message if belongs to a different channel or a handler was not registered', () => {
      // Grab channel ID from the connect message
      channel.connect(CONNECT_MSG);
      const channelId = postMessage.mock.calls[0][0].params[0].id;
      expect(typeof channelId).toBe('string');

      // Register some different channel handler
      const checkAccess = jest.fn();
      channel.registerHandler(ChannelMethod.CheckAccess, checkAccess);

      const messageHandler = (window.addEventListener as jest.Mock).mock.calls[0][1];
      expect(typeof messageHandler).toBe('function');

      // Dispatch a message for a method with no handler
      let message: IncomingMessage = {
        data: {
          id: 'some-message-id',
          source: channelId,
          method: ChannelMethod.CallSpaceMethod,
          params: ['test'],
        },
      };
      messageHandler(message);

      // Handler for a different method was not called
      expect(checkAccess).toHaveBeenCalledTimes(0);
      // Only the connect message was sent back, no response for incoming message
      expect(postMessage).toHaveBeenCalledTimes(1);

      message = {
        data: {
          id: 'next-message-id',
          source: 'different-channel-id',
          method: ChannelMethod.CheckAccess,
          params: ['test'],
        },
      };
      messageHandler(message);

      // Handler was not called because the message comes from a different channel
      expect(checkAccess).toHaveBeenCalledTimes(0);
      // Still no response produced, only the initial message was sent
      expect(postMessage).toHaveBeenCalledTimes(1);
    });

    it('handles incoming message and produces result/error response', async () => {
      // Grab channel ID from the connect message
      channel.connect(CONNECT_MSG);
      const channelId = postMessage.mock.calls[0][0].params[0].id;
      expect(typeof channelId).toBe('string');

      // Register a handler producing some result
      const checkAccess = jest.fn().mockResolvedValue('RESULT');
      channel.registerHandler(ChannelMethod.CheckAccess, checkAccess);

      const messageHandler = (window.addEventListener as jest.Mock).mock.calls[0][1];
      expect(typeof messageHandler).toBe('function');

      // Dispatch a message that will be handled
      const message: IncomingMessage = {
        data: {
          id: 'some-message-id',
          source: channelId,
          method: ChannelMethod.CheckAccess,
          params: ['test', true],
        },
      };
      messageHandler(message);

      // Handler was invoked
      expect(checkAccess).toHaveBeenCalledTimes(1);
      expect(checkAccess).toHaveBeenCalledWith('test', true);

      // Response was sent
      await flushImmediatePromises();
      expect(postMessage.mock.calls[1]).toEqual([{ id: 'some-message-id', result: 'RESULT' }, '*']);

      // Make the handler fail and dispatch
      checkAccess.mockRejectedValue({ code: 'BOOM', message: 'boom!', data: 'BOOM!' });
      messageHandler(message);

      // Error response was sent
      expect(checkAccess).toHaveBeenCalledTimes(2);
      await flushImmediatePromises();
      expect(postMessage.mock.calls[2]).toEqual([
        {
          id: 'some-message-id',
          error: {
            code: 'BOOM',
            message: 'boom!',
            data: 'BOOM!',
          },
        },
        '*',
      ]);
    });
  });
});
