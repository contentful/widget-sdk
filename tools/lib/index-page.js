import {h, doctype} from './hyperscript'
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
  const resolve = createResolver(manifest, '/app')
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
  const resolve = (path) => `/app/${path}`
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
    // We inline this style so it is immediately available no page
    // load. Otherwise the loader animation from below will not work.
    h('style', [
      `@keyframes rotate {
        from { transform: rotate(0deg) }
        to { transform: rotate(360deg) }
      }`
    ]),
    h('body', {
      ngApp: 'contentful/app',
      ngCsp: 'no-inline-style;no-unsafe-eval',
      ngController: 'ClientController',
      ngInit: 'initClient()'
    }, [
      h('.client', [
        h('cf-app-container.app-container.ng-hide', {ngShow: 'user', cfRolesForWalkMe: ''}),
        h('div', {ngIf: '!user'}, [
          appLoader()
        ])
      ])
    ].concat(
      entryScripts.map((src) => scriptTag(resolve(src)))
    ))
  ])
}

/**
 * Show an animated Contentful log with the text 'Loading Contentful'.
 *
 * The element is positioned absolutely and covers its whole container.
 * The loader is centered within this element.
 */
function appLoader () {
  return h('div', {
    style: {
      position: 'absolute',
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }
  }, [
    h('svg', {
      width: '60',
      height: '60',
      style: {
        transform: 'rotate(-45deg)'
      }
    }, [
      loaderSegment('M10,30 a20,20 0 0,0 20,20', '0', '#e0534e'),
      loaderSegment('M30,10 a20,20 0 0,0 -20,20', '0.3s', '#faec28'),
      loaderSegment('M50,30 a20,20 0 0,0 -20,-20', '.15s', '#56aed2')
    ]),
    h('div', {
      style: {
        // Font size should be the same as for the other page loaders
        // in the app.
        fontSize: '2em',
        marginTop: '0.9em',
        // better horizontal visual balance because of the hanging
        // ellipsis
        marginLeft: '28px'
      }
    }, [
      'Loading Contentful…'
    ])
  ])
}

/**
 * One arc segment of the Contentful logo.
 */
function loaderSegment (path, delay, color) {
  return h('path', {
    d: path,
    style: {
      strokeWidth: '11px',
      stroke: color,
      strokeLinecap: 'round',
      fill: 'transparent',
      mixBlendMode: 'darken',
      animation: 'rotate 2s infinite cubic-bezier(0.6, 0.03, 0.15, 1)',
      transformOrigin: '30px 30px',
      animationDelay: delay
    }
  })
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
