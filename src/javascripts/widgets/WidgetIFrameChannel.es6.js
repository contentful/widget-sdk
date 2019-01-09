import * as random from 'utils/Random.es6';

/**
 * This module exposes a `Channel` class that is used to communicate
 * with extensions in IFrames through `window.postMessage`.
 *
 * The communication protocol is based on http://www.jsonrpc.org/.
 */

// TODO: should be a normal class.
export default function Channel(iframe, win, applyChanges) {
  this.iframe = iframe;
  this.win = win;
  this.id = random.id();
  this.handlers = {};
  this.messageQueue = [];

  this.messageListener = ({ data }) => {
    if (data.source === this.id) {
      // TODO: `applyChanges` is actually `$rootScope.$apply`.
      // We need it to make Angular aware of changes.
      // Can be removed once Angular is gone :)
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
Channel.prototype.send = function(method, params) {
  if (!Array.isArray(params)) {
    throw new Error('`params` is expected to be an array');
  }

  if (this.connected) {
    this._send(method, params);
  } else {
    this.messageQueue.push({ method, params });
  }
};

Channel.prototype.connect = function(data) {
  if (this.connected) {
    throw new Error('Widget Channel already connected');
  }

  this.connected = true;
  const params = [{ id: this.id, ...data }, this.messageQueue];
  this._send('connect', params);
};

Channel.prototype._dispatch = async function(method, callId, args) {
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
};

Channel.prototype.destroy = function() {
  this.destroyed = true;
  this.iframe = null;
  this.win.removeEventListener('message', this.messageListener);
};

Channel.prototype._send = function(method, params) {
  this.iframe.contentWindow.postMessage({ method, params }, '*');
};

Channel.prototype._respondError = function(id, error) {
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
};
