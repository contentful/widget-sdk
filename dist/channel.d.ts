import { ConnectMessage } from './types'
export default function connect(
  currentWindow: Window,
  onConnect: (channel: Channel, message: ConnectMessage, messageQueue: unknown[]) => void
): void
export declare class Channel {
  private _messageHandlers
  private _responseHandlers
  private _send
  constructor(sourceId: string, currentWindow: Window)
  call(method: string, ...params: any[]): Promise<unknown>
  send(method: string, ...params: any[]): void
  addHandler(method: string, handler: Function): () => boolean
  private _handleMessage
}
