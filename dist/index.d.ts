import { KnownSDK } from './types'
export * from './types'
export { default as locations } from './locations'
declare type Init = <T extends KnownSDK = KnownSDK>(
  initCallback: (sdk: T) => any,
  options?: {
    supressIframeWarning?: boolean
  }
) => void
export declare const init: Init
