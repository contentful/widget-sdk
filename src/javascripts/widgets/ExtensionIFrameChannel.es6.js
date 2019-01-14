import * as random from 'utils/Random.es6';

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
export default class Channel {
  constructor(iframe, win, applyChanges = callArg1) {
    this.iframe = iframe;
    this.win = win;
    this.id = random.id();
    this.messageQueue = [];

    this.handlers = {
      setHeight: val => iframe.setAttribute('height', val)
    };

    this.messageListener = ({ data }) => {
      if (data.source === this.id) {
        applyChanges(() => this._dispatch(data.method, data.id, data.params));
      }
    };

    this.win.addEventListener('message', this.messageListener);
  }

  /**
   * Calls `postMessage` on the content of the IFrame window.
   *
   * The message looks like this: `{ method, params }`.
   *
   * If the channel has not yet been connected the message will be
   * pushed onto a queue and will be sent after calling `#connect()`.
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
    if (this.connected) {
      throw new Error('Widget Channel already connected');
    }

    this.connected = true;
    const params = [{ id: this.id, ...data }, this.messageQueue];
    this._send('connect', params);
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
