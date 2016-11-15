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

// For each item 'x' we require a property 'x_host' with a domain and
// optional port format.
const HOST_KEYS = [
  'base', 'api', 'asset', 'ot'
]

export default strictObject(Object.assign({
  environment: {type: 'string'},
  marketing_url: urlSchema,
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
}, hosts(), integrations()))


function hosts () {
  let props = {}
  for (let key of HOST_KEYS) {
    props[key + '_host'] = subdomainHostSchema
  }
  return props
}


function integrations () {
  return {
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
    segment_io: alnum(10)
  }
}

function strictObject (props) {
  return {
    type: 'object',
    additionalProperties: false,
    required: Object.keys(props),
    properties: props
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
