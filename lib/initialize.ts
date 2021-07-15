import { ConnectMessage, KnownSDK } from './types'
import connect, { Channel } from './channel'
import { createClient } from 'contentful-management'

function createPlainCmaClientWithDefaults(sdk: KnownSDK) {
  if (!sdk.cmaAdapter || !createClient) return undefined
  return createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  )
}

export default function createInitializer(
  currentWindow: Window,
  apiCreator: (channel: Channel, data: ConnectMessage, window: Window) => KnownSDK
) {
  const connectDeferred = createDeferred()

  connectDeferred.promise.then(([channel]: [Channel]) => {
    const { document } = currentWindow
    document.addEventListener('focus', () => channel.send('setActive', true), true)
    document.addEventListener('blur', () => channel.send('setActive', false), true)
  })

  // We need to connect right away so we can record incoming
  // messages before `init` is called.
  connect(currentWindow, (...args) => connectDeferred.resolve(args))

  return function init(
    initCb: (sdk: KnownSDK, customSdk: any) => any,
    {
      makeCustomApi,
      supressIframeWarning,
    }: { makeCustomApi?: Function; supressIframeWarning?: boolean } = {
      supressIframeWarning: false,
    }
  ) {
    if (!supressIframeWarning && currentWindow.self === currentWindow.top) {
      console.error(`Cannot use ui-extension-sdk outside of Contenful:

In order for the ui-extension-sdk to function correctly, your app needs to be run in an iframe in the Contentful Web App.

Learn more about local development with the ui-extension-sdk here:
  https://www.contentful.com/developers/docs/extensibility/ui-extensions/faq/#how-can-i-use-the-ui-extension-sdk-locally`)
    }
    connectDeferred.promise.then(
      ([channel, params, messageQueue]: [Channel, ConnectMessage, unknown[]]) => {
        const api = apiCreator(channel, params, currentWindow)

        let customApi
        if (typeof makeCustomApi === 'function') {
          customApi = makeCustomApi(channel, params)
        }

        api.predefinedClient = createPlainCmaClientWithDefaults(api)

        // Handle pending incoming messages.
        // APIs are created before so handlers are already
        // registered on the channel.
        messageQueue.forEach((m) => {
          // TODO Expose private handleMessage method
          ;(channel as any)._handleMessage(m)
        })

        // Hand over control to the developer.
        initCb(api, customApi)
      }
    )
  }
}

function createDeferred<T = any>() {
  const deferred: {
    promise: Promise<T>
    resolve: (value: T | PromiseLike<T>) => void
  } = {
    promise: null as any,
    resolve: null as any,
  }

  deferred.promise = new Promise<T>((resolve) => {
    deferred.resolve = resolve
  })

  return deferred
}
