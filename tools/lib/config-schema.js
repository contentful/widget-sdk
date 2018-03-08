/**
 * This module exports a JSON schema for the application configuration.
 *
 * Application configuration files reside in the `config` directory. To
 * check these files use `tools/bin/validate-config.js`.
 */

const domainPattern = '\\w[\\w-]*';

const subdomainHostSchema = {
  type: 'string',
  // Matches `sub.main.tld:1234` where the host part is optional
  pattern: `^(${domainPattern}\\.){2}(${domainPattern})(:\\d{2,4})?$`
};

const hostSchema = {
  type: 'string',
  // Matches `main.tld:1234` where the host part is optional
  pattern: `^(${domainPattern}\\.)(${domainPattern})(:\\d{2,4})?$`
};

// Matches protocol relative URLs, e.g. '//example.com'.
const urlSchema = {
  type: 'string',
  format: 'uri-reference'
};

// For each item 'x' we require a property 'xUrl' that has a URL format.
const URL_KEYS = [
  'auth', 'api', 'ot', 'asset', 'marketing', 'toolsService', 'mockApi'
];

module.exports = strictObject(Object.assign({
  environment: {type: 'string'},
  main_domain: hostSchema,
  contentful: strictObject({
    spaceTemplateEntryContentTypeId: alnumExact(22),
    cdaApiUrl: subdomainHostSchema,
    apiUrl: subdomainHostSchema,
    previewApiUrl: subdomainHostSchema,
    accessToken: hex(64),
    space: alnumExact(12),
    previewAccessToken: hex(64),
    TEASpaceId: alnumExact(12)
  })
}, hosts(), integrations()), {
  clientId: hex(64)
});


function hosts () {
  const props = {};
  for (const key of URL_KEYS) {
    props[key + 'Url'] = urlSchema;
  }
  return props;
}


function integrations () {
  return {
    launchDarkly: strictObject({
      envId: alnumExact(24)
    }),
    filepicker: strictObject({
      api_key: alnumExact(22),
      policy: filepickerPolicy(),
      signature: alnumExact(64)
    }),
    aviary: strictObject({
      api_key: hex(32)
    }),
    embedly: strictObject({
      api_key: hex(32)
    }),
    google: strictObject({
      maps_api_key: alnumExact(39)
    }),
    fonts_dot_com: strictObject({
      project_id: {type: 'string', format: 'uuid'}
    }),
    segment_io: alnumExact(10),
    snowplow: strictObject({
      collector_endpoint: {type: 'string'},
      app_id: {type: 'string'},
      buffer_size: {type: 'number'}
    })
  };
}

function strictObject (props, optional) {
  return {
    type: 'object',
    additionalProperties: false,
    required: Object.keys(props),
    properties: Object.assign(props, optional)
  };
}


function alnumExact (length) {
  return {
    type: 'string',
    pattern: `^[a-zA-Z0-9]{${length}}$`
  };
}


function filepickerPolicy () {
  return {
    type: 'string',
    pattern: `^[a-zA-Z0-9=]{1,256}$`
  };
}


function hex (length) {
  return {
    type: 'string',
    pattern: `^[0-9a-f]{${length}}$`
  };
}
