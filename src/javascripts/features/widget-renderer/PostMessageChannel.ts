import {
  OutgoingMethodCallMessage,
  Handler,
  IncomingMessage,
  ChannelMethod,
  OutgoingMessage,
  OutgoingResultMessage,
  OutgoingErrorMessage,
  ChannelEvent,
} from './channelTypes';

/**
 * This module is a communication channel between custom widgets
 * (apps and extensions) rendered in IFrames utilizing
 * `window.postMessage` as a messaging bus.
 *
 * `iframe` and `win` are references to DOM nodes: IFrame rendering
 *  a widget and the `window` of the host respectivly.
 */
export class PostMessageChannel {
  private iframe: HTMLIFrameElement;
  private win: Window;
  private id: string;
  private messageQueue: OutgoingMethodCallMessage[] = [];
  private handlers: Record<string, Handler> = {};

  private destroyed = false;
  private connected = false;

  constructor(iframe: HTMLIFrameElement, win: Window) {
    this.iframe = iframe;
    this.win = win;
    this.id = `${Date.now()},${Math.round(Math.random() * 9999999)}`;

    this.win.addEventListener('message', this.messageListener);
  }

  private messageListener = ({ data }: IncomingMessage) => {
    // Make sure the message comes from the same channel.
    if (data.source === this.id) {
      this.handleIncomingMessage(data.method, data.id, data.params);
    }
  };

  /**
   * Calls `postMessage` on the content window of the IFrame.
   *
   * The message looks like this: `{ method, params }`.
   *
   * If the channel has not been yet connected the message will
   * be pushed into the queue and will be sent with the first
   * `connect()` call.
   */
  public send(event: ChannelEvent, params: any[]) {
    const message: OutgoingMethodCallMessage = { method: event, params };

    if (this.connected) {
      this.postMessage(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  public connect(data: Record<string, any>) {
    const message: OutgoingMethodCallMessage = {
      method: ChannelEvent.Connect,
      params: [{ id: this.id, ...data }, this.messageQueue],
    };

    this.postMessage(message);

    // Stop using message queue (see `send()`) right after
    // the first connection is estabilished.
    this.connected = true;
    this.messageQueue = [];
  }

  public destroy() {
    this.destroyed = true;
    this.win.removeEventListener('message', this.messageListener);
  }

  public registerHandler(method: ChannelMethod, handler: Handler) {
    if (this.handlers[method]) {
      throw new Error(`Handler for "${method}" was already registered.`);
    } else {
      this.handlers[method] = handler;
    }
  }

  private postMessage(message: OutgoingMessage) {
    if (!this.destroyed) {
      this.iframe.contentWindow?.postMessage(message, '*');
    }
  }

  private async handleIncomingMessage(method: string, callId: string, args: any[] = []) {
    const handler = this.handlers[method];
    if (!handler) {
      return;
    }

    // Catches both sync and async errors of `handler`.
    try {
      const result = await handler(...args);
      const message: OutgoingResultMessage = { id: callId, result };
      this.postMessage(message);
    } catch (err) {
      const errMessage: OutgoingErrorMessage = {
        id: callId,
        error: {
          code: err.code || err.name,
          message: err.message,
          data: err.data,
        },
      };
      this.postMessage(errMessage);
    }
  }
}
