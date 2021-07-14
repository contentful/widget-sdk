import { KnownSDK, ConnectMessage } from './types'
import { Channel } from './channel'
export default function createAPI(
  channel: Channel,
  data: ConnectMessage,
  currentWindow: Window
): KnownSDK
