import {h, doctype} from '../../src/javascripts/utils/hyperscript/h.es6.js'
import {create as createResolver} from './manifest-resolver'

const DEV_ENTRY_SCRIPTS = [
  'vendor.js',
  'templates.js',
  'libs.js',
  'components.js'
]

const DEFAULT_ENTRY_SCRIPTS = ['application.min.js']


/**
 * @usage
 * var htmlString = render(version, config, manifest)
 *
 * @description
 * Returns a configured HTML index file as string. No further
 * processing is needed to run this file in the given environment.
 *
 * The `manifest` maps asset paths to their fingerprinted version. It is used
 * to resolve all `src` and `href` properties. For example:
 * ~~~js
 * {
 *   "app/application.js": "app/application-3ef9a.js"
 * }
 * ~~~
 *
 * All `uiVersion`, `config` and resolved `manifest` are put together and
 * exposed as content of <meta name="external-config" content="..."> element.
 *
 * @param {string} uiVersion
 * @param {object} config
 * @param {function} manifest
 */
export function render (uiVersion, config, manifest) {
  let resolve = createResolver(manifest, '/app')
  return renderPage(uiVersion, config, resolve, DEFAULT_ENTRY_SCRIPTS)
}


/**
 * @usage
 * var htmlString = render(config)
 *
 * @description
 * Similar to `render` but prepares an index that is used in development.
 *
 * In particular
 * - No resolution of assets through the manifest is done. The links
 *   are used as-is.
 * - No version and manifest are exposed to the application.
 * - Instead of the '/app/application.min.js' main script multiple
 *   separate scripts are loaded. (See `DEV_ENTRY_SCRIPTS` above).
 */
export function renderDev (config) {
  let resolve = (path) => `/app/${path}`
  return renderPage(null, config, resolve, DEV_ENTRY_SCRIPTS)
}

function renderPage (...args) {
  return doctype + indexPage(...args)
}

function indexPage (uiVersion, config, resolve, entryScripts) {
  return h('html', [
    h('head', [
      h('meta', {charset: 'UTF-8'}),
      h('meta', {httpEquiv: 'x-ua-compatible', content: 'ID=edge'}),
      configMetaTag(uiVersion, config, resolve),
      h('title', ['Contentful']),
      stylesheet(resolve('vendor.css')),
      stylesheet(resolve('main.css')),
      iconLink('shortcut icon', resolve('images/favicons/favicon32x32.png')),
      iconLink('apple-touch-icon', resolve('images/favicons/apple_icon57x57.png')),
      iconLink('apple-touch-icon', resolve('images/favicons/apple_icon72x72.png')),
      iconLink('apple-touch-icon', resolve('images/favicons/apple_icon114x114.png'))
    ]),
    h('body', {
      ngApp: 'contentful/app',
      ngCsp: 'no-inline-style;no-unsafe-eval',
      ngController: 'ClientController',
      ngInit: 'initClient()'
    }, [
      h('.client', [
        h('cf-app-container.app-container.ng-hide', {ngShow: 'user'}),
        h('.client-loading', {ngIf: '!user'}, [
          h('.client-loading__container', [
            h('.client-loading__icon.fa.fa-cog.fa-spin'),
            h('.client-loading__text', ['Loading Contentful...'])
          ])
        ])
      ])
    ].concat(
      entryScripts.map((src) => scriptTag(resolve(src)))
    ))
  ])
}

function configMetaTag (uiVersion, config, resolve) {
  return h('meta', {
    name: 'external-config',
    content: JSON.stringify({
      config,
      uiVersion,
      manifest: {
        'app/kaltura.js': resolve('kaltura.js'),
        'app/markdown_vendors.js': resolve('markdown_vendors.js'),
        'app/snowplow.js': resolve('snowplow.js')
      }
    })
  })
}

function stylesheet (href) {
  return h('link', {
    href: href,
    media: 'all',
    rel: 'stylesheet',
    type: 'text/css'
  })
}

function iconLink (rel, href) {
  return h('link', {
    href: href,
    rel: rel,
    type: 'image/png'
  })
}

function scriptTag (src) {
  return h('script', {src, type: 'text/javascript'})
}
