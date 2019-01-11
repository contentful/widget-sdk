import Channel from './ExtensionIFrameChannel.es6';

describe('ExtensionIFrameChannel', () => {
  const makeChannel = () => {
    let messageListener;
    const addEventListenerStub = jest.fn((event, listener) => {
      if (event === 'message') {
        messageListener = listener;
      }
    });

    const stubs = {
      postMessage: jest.fn(),
      addEventListener: addEventListenerStub,
      removeEventListener: jest.fn()
    };

    const iframe = { contentWindow: { postMessage: stubs.postMessage } };
    const win = {
      addEventListener: stubs.addEventListener,
      removeEventListener: stubs.removeEventListener
    };

    const channel = new Channel(iframe, win);

    const receiveMessage = data => {
      if (!data.source) {
        data.source = channel.id;
      }

      if (typeof messageListener === 'function') {
        return messageListener({ data });
      } else {
        return Promise.resolve();
      }
    };

    return [channel, stubs, receiveMessage];
  };

  describe('#connect()', () => {
    it('sends connect message with ID', () => {
      const [channel, stubs] = makeChannel();
      channel.connect();

      expect(stubs.postMessage).toBeCalledWith(
        {
          method: 'connect',
          params: [{ id: channel.id }, []]
        },
        '*'
      );
    });

    it('throws an error when called twice', () => {
      const [channel] = makeChannel();
      const connect = channel.connect.bind(channel);
      connect();
      expect(connect).toThrow();
    });
  });

  describe('#send()', () => {
    const PARAMS = ['PARAM'];

    it('messages to the IFrame', () => {
      const [channel, stubs] = makeChannel();
      channel.connect();
      channel.send('METHOD', PARAMS);
      expect(stubs.postMessage).toBeCalledWith({ method: 'METHOD', params: PARAMS }, '*');
    });

    it('queued messages after connecting', () => {
      const [channel, stubs] = makeChannel();

      channel.send('METHOD1', ['PARAM1']);
      channel.send('METHOD2', ['PARAM2']);

      expect(stubs.postMessage).not.toBeCalled();

      channel.connect();

      const queued = [
        { method: 'METHOD1', params: ['PARAM1'] },
        { method: 'METHOD2', params: ['PARAM2'] }
      ];

      expect(stubs.postMessage).toBeCalledWith(
        {
          method: 'connect',
          params: [{ id: channel.id }, queued]
        },
        '*'
      );
    });

    it('throws an error if params is not an array', () => {
      const [channel] = makeChannel();
      const send = channel.send.bind(channel, 'METHOD', 'NOT-AN-ARRAY');
      channel.connect();
      expect(send).toThrow();
    });
  });

  describe('on message', () => {
    it('calls handlers on message event', () => {
      const [channel, _stubs, receiveMessage] = makeChannel();

      const handler = jest.fn();
      channel.handlers['MY_METHOD'] = handler;

      receiveMessage({ method: 'MY_METHOD', params: ['A', 'B'] });
      expect(handler).toBeCalledTimes(1);
      expect(handler).toBeCalledWith('A', 'B');
    });

    it('does not call handlers when source ID does not match', () => {
      const [channel, _stubs, receiveMessage] = makeChannel();

      const handler = jest.fn();
      channel.handlers['MY_METHOD'] = handler;

      receiveMessage({ method: 'MY_METHOD', source: 'another id' });
      expect(handler).not.toBeCalled();
    });

    it('sends result when handler returns a value', async () => {
      const [channel, stubs, receiveMessage] = makeChannel();

      const handler = jest.fn(() => 'RESULT');
      channel.handlers['MY_METHOD'] = handler;

      expect(stubs.postMessage).not.toBeCalled();

      await receiveMessage({ method: 'MY_METHOD', id: 'CALL ID' });
      expect(stubs.postMessage).toBeCalledWith({ id: 'CALL ID', result: 'RESULT' }, '*');
    });

    it('sends result when handler promise is resolved', async () => {
      const [channel, stubs, receiveMessage] = makeChannel();

      let resolve;
      const promise = new Promise(_resolve => {
        resolve = _resolve;
      });
      const handler = jest.fn(() => promise);
      channel.handlers['MY_METHOD'] = handler;

      const resultPromise = receiveMessage({ method: 'MY_METHOD', id: 'CALL ID' });
      expect(stubs.postMessage).not.toBeCalled();

      resolve('RESULT');
      await resultPromise;

      expect(stubs.postMessage).toBeCalledWith({ id: 'CALL ID', result: 'RESULT' }, '*');
    });

    it('does not send result when channel is destroyed', async () => {
      const [channel, stubs, receiveMessage] = makeChannel();

      const handler = jest.fn(() => 'RESULT');
      channel.handlers['MY_METHOD'] = handler;

      const resultPromise = receiveMessage({ method: 'MY_METHOD', id: 'CALL ID' });
      expect(stubs.postMessage).not.toBeCalled();

      channel.destroy();
      await resultPromise;
      expect(stubs.postMessage).not.toBeCalled();
    });

    it('sends error when handler promise is rejected', async () => {
      const [channel, stubs, receiveMessage] = makeChannel();

      const handler = jest.fn(() =>
        Promise.reject({
          code: 'ECODE',
          message: 'EMESSAGE',
          data: 'EDATA'
        })
      );
      channel.handlers['MY_METHOD'] = handler;

      const resultPromise = receiveMessage({ method: 'MY_METHOD', id: 'CALL ID' });
      expect(stubs.postMessage).not.toBeCalled();

      await resultPromise;
      expect(stubs.postMessage).toBeCalledWith(
        {
          id: 'CALL ID',
          error: { code: 'ECODE', message: 'EMESSAGE', data: 'EDATA' }
        },
        '*'
      );
    });

    it('sends error when handler synchronously throws', () => {
      const [channel, stubs, receiveMessage] = makeChannel();

      const handler = jest.fn(() => {
        throw new Error('boom');
      });
      channel.handlers['MY_METHOD'] = handler;

      receiveMessage({ method: 'MY_METHOD', id: 'CALL ID' });
      expect(stubs.postMessage).toBeCalledWith(
        { id: 'CALL ID', error: { code: 'Error', message: 'boom' } },
        '*'
      );
    });
  });
});
