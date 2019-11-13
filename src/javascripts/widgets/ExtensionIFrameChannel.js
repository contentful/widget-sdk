import * as random from 'utils/Random';

const callArg1 = fn => fn();

/**
 * This module exposes a `Channel` class that is used to communicate
 * with extensions in IFrames through `window.postMessage`.
 *
 * The communication protocol is based on http://www.jsonrpc.org/.
 *
 * - `iframe` and `win` are references to DOM nodes, IFrame rendering
 *   an extension and app's `window` respectively.
 * - `applyChanges` is a "transaction" wrapping action execution.
 *   We can use it to wrap message handling with `$rootScope.$apply`
 *   if still running in Angular context. Defaults to `fn => fn()`.
 */
export default class ExtensionIFrameChannel {
  constructor(iframe, win, applyChanges = callArg1) {
    this.iframe = iframe;
    this.win = win;
    this.id = random.id();
    this.messageQueue = [];
    this.handlers = {};

    this.messageListener = ({ data }) => {
      // Make sure the message comes from the same channel.
      if (data.source !== this.id) {
        return;
      }

      // `setHeight` method acts directly on the `<iframe>` element
      // of the Extension being rendered. We can handle the message
      // without a handler. Thanks to that it is a universal way
      // of setting the height of the `<iframe>` which cannot be
      // cancelled by `applyChanges`.
      if (data.method === 'setHeight' && !this.destroyed && this.iframe) {
        this.iframe.setAttribute('height', data.params[0]);
        return;
      }

      // Finally, dispatch all the other messages to be handled.
      // Note that implementation of `applyChanges` may defer or even
      // cancel message handling.
      applyChanges(() => {
        this._dispatch(data.method, data.id, data.params);
      });
    };

    this.win.addEventListener('message', this.messageListener);
  }

  /**
   * Calls `postMessage` on the content of the IFrame window.
   *
   * The message looks like this: `{ method, params }`.
   *
   * If the channel has not been yet connected the message will
   * be pushed into the queue and will be sent with the first
   * `connect()` call.
   */
  send(method, params) {
    if (!Array.isArray(params)) {
      throw new Error('`params` is expected to be an array');
    }

    if (this.connected) {
      this._send(method, params);
    } else {
      this.messageQueue.push({ method, params });
    }
  }

  connect(data) {
    this._send('connect', [{ id: this.id, ...data }, this.messageQueue]);

    // Stop using message queue (see `send()`) right after
    // the first connection is estabilished.
    this.connected = true;
    this.messageQueue = [];
  }

  destroy() {
    this.destroyed = true;
    this.iframe = null;
    this.win.removeEventListener('message', this.messageListener);
  }

  _send(method, params) {
    this.iframe.contentWindow.postMessage({ method, params }, '*');
  }

  async _dispatch(method, callId, args) {
    const handler = this.handlers[method];

    if (!handler) {
      return;
    }

    // Catches both sync and async errors of `handler`.
    try {
      const result = await handler(...args);
      if (!this.destroyed) {
        this.iframe.contentWindow.postMessage({ id: callId, result }, '*');
      }
    } catch (err) {
      this._respondError(callId, err);
    }
  }

  _respondError(id, error) {
    if (this.destroyed || !this.iframe || !this.iframe.contentWindow) {
      return;
    }

    this.iframe.contentWindow.postMessage(
      {
        id,
        error: {
          code: error.code || error.name,
          message: error.message,
          data: error.data
        }
      },
      '*'
    );
  }
}
