import { ConnectMessage, KnownSDK } from './types'
import { Channel } from './channel'
export default function createInitializer(
  currentWindow: Window,
  apiCreator: (channel: Channel, data: ConnectMessage, window: Window) => KnownSDK
): (
  initCb: (sdk: KnownSDK, customSdk: any) => any,
  {
    makeCustomApi,
    supressIframeWarning,
  }?: {
    makeCustomApi?: Function | undefined
    supressIframeWarning?: boolean | undefined
  }
) => void
