import _ from 'lodash';

function getDefaultConfig(ct) {
  return {
    name: ct.name || 'Untitled',
    contentType: ct.sys.id,
    url: '',
    enabled: false,
    contentTypeFields: _.map(ct.fields, field => _.pick(field, ['apiName', 'type']))
  };
}

/**
 * @param {object} external
 * @param {Array<ContentType>} contentTypes
 * @returns {object}
 *
 * @description
 * Converts a preview environment object from external to internal format.
 */
export function contentPreviewToInternal(external, contentTypes) {
  function getConfigs() {
    return contentTypes.map(ct => {
      const config = _.find(external.configurations, _.matches({ contentType: ct.sys.id })) || {};
      return _.defaults(config, getDefaultConfig(ct));
    });
  }

  return {
    name: external.name,
    description: external.description,
    configs: getConfigs(),
    version: external.sys.version,
    id: external.sys.id
  };
}
