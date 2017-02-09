/**
 * This module exports a JSON schema for the application configuration.
 */

const domainPattern = '\\w[\\w-]*'

const subdomainHostSchema = {
  type: 'string',
  // Matches `sub.main.tld:1234` where the host part is optional
  pattern: `^(${domainPattern}\\.){2}(${domainPattern})(:\\d{2,4})?$`
}

const hostSchema = {
  type: 'string',
  // Matches `main.tld:1234` where the host part is optional
  pattern: `^(${domainPattern}\\.)(${domainPattern})(:\\d{2,4})?$`
}

const urlSchema = {
  type: 'string',
  format: 'url'
}

// For each item 'x' we require a property 'xUrl' that has a URL format.
const URL_KEYS = [
  'auth', 'api', 'ot', 'asset', 'marketing'
]

export default strictObject(Object.assign({
  environment: {type: 'string'},
  main_domain: hostSchema,
  contentful: strictObject({
    spaceTemplatesUserReadOnlyToken: hex(64),
    spaceTemplateEntryContentTypeId: alnum(21),
    cdaApiUrl: subdomainHostSchema,
    apiUrl: subdomainHostSchema,
    previewApiUrl: subdomainHostSchema,
    accessToken: hex(64),
    space: alnum(12),
    previewAccessToken: hex(64)
  })
}, hosts(), integrations()), {
  clientId: hex(64)
})


function hosts () {
  let props = {}
  for (let key of URL_KEYS) {
    props[key + 'Url'] = urlSchema
  }
  return props
}


function integrations () {
  return {
    launchDarkly: strictObject({
      envId: alnum(24)
    }),
    filepicker: strictObject({
      api_key: alnum(22),
      policy: alnum(60),
      signature: alnum(64)
    }),
    aviary: strictObject({
      api_key: hex(32)
    }),
    embedly: strictObject({
      api_key: hex(32)
    }),
    google: strictObject({
      maps_api_key: alnum(39)
    }),
    fonts_dot_com: strictObject({
      project_id: {type: 'string', format: 'uuid'}
    }),
    segment_io: alnum(10),
    snowplow: strictObject({
      collector_endpoint: {type: 'string'},
      app_id: {type: 'string'},
      buffer_size: {type: 'number'}
    })
  }
}

function strictObject (props, optional) {
  return {
    type: 'object',
    additionalProperties: false,
    required: Object.keys(props),
    properties: Object.assign(props, optional)
  }
}


function alnum (length) {
  return {
    type: 'string',
    pattern: `^[a-zA-Z0-9]{${length}}`
  }
}


function hex (length) {
  return {
    type: 'string',
    pattern: `^[0-9a-f]{${length}}$`
  }
}
