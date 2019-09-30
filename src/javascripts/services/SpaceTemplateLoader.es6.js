import _ from 'lodash';
import * as Config from 'Config.es6';
import * as logger from 'services/logger.es6';
import { newClient as newContentfulClient } from 'services/contentfulClient.es6';

const contentfulConfig = Config.services.contentful;

let client = null;
let spaceClients = {};

/**
 * Only used in tests as singletons and caches are super weird to test
 */
export function _resetGlobals() {
  client = null;
  spaceClients = {};
}

export async function getTemplatesList() {
  if (!client) {
    client = newContentfulClient(getClientParams({ env: Config.env, ...contentfulConfig }));
  }

  const templates = await client.entries({
    content_type: contentfulConfig.spaceTemplateEntryContentTypeId
  });

  // each template has a order field that determines its place
  // in the list when shown in the space creation wizard.
  // Here we sort by it.
  const orderedTemplates = _.sortBy(templates, template =>
    _.isFinite(template.fields.order) ? template.fields.order : 99
  );

  return orderedTemplates;
}

export function getTemplate(templateInfo) {
  const spaceClient = getSpaceClient(templateInfo);
  return getSpaceContents(spaceClient)
    .then(parseSpaceContents)
    .then(createApiKeyObjects(templateInfo));
}

function getSpaceClient(templateInfo) {
  const spaceId = templateInfo.spaceId;
  if (spaceId in spaceClients) {
    return spaceClients[spaceId];
  }

  spaceClients[spaceId] = newContentfulClient({
    host: contentfulConfig.cdaApiUrl,
    space: spaceId,
    accessToken: templateInfo.spaceApiKey
  });
  return spaceClients[spaceId];
}

export function getClientParams({
  env,
  space,
  accessToken,
  previewAccessToken,
  cdaApiUrl,
  previewApiUrl
}) {
  const isProduction = env === 'production';
  const params = {
    space,
    accessToken: isProduction ? accessToken : previewAccessToken,
    host: isProduction ? cdaApiUrl : previewApiUrl
  };
  return params;
}

function getSpaceContents(spaceClient) {
  return Promise.all([
    // we rely on having locales later, but CDA calls by default
    // return only one locale, so we add parameter to fetch all of them
    spaceClient.contentTypes({ locale: '*' }),
    spaceClient.entries({ locale: '*' }),
    spaceClient.assets({ locale: '*' }),
    // we need to fetch space for list of locales
    // so we can copy content in all corresponding locales
    spaceClient.space()
  ]).then(([contentTypes, entries, assets, space]) => ({ contentTypes, entries, assets, space }));
}

function parseSpaceContents(contents) {
  return {
    contentTypes: parseContentTypes(contents.contentTypes),
    entries: sortEntries(parseEntries(contents.entries)),
    assets: parseAssets(contents.assets),
    space: contents.space
  };
}

function parseContentTypes(contentTypes) {
  return _.map(contentTypes, contentType => ({
    name: contentType.name,
    displayField: contentType.displayField,
    sys: { id: _.get(contentType, 'sys.id') },
    fields: contentType.fields
  }));
}

function sortEntries(entries) {
  const linkedEntries = getLinkedEntries(entries);

  linkedEntries.sort(entry => {
    const hli = hasLinkedIndexesInFront(entry);
    return hli ? -1 : 1;
  });

  return linkedEntries.map(linkInfo => entries[linkInfo.index]);

  function hasLinkedIndexesInFront(item) {
    if (hasLinkedIndexes(item)) {
      return item.linkIndexes.some(index => index > item.index);
    }
  }

  function hasLinkedIndexes(item) {
    return item.linkIndexes.length > 0;
  }
}

function getLinkedEntries(entries) {
  return entries.map(entry => {
    const entryIndex = entries.indexOf(entry);
    const rawLinks = Object.keys(entry.fields).map(fieldId => {
      const rawField = entry.fields[fieldId];
      const field = _.values(rawField)[0];
      if (isEntryLink(field)) {
        return getFieldEntriesIndex(field, entries);
      } else if (isEntityArray(field) && isEntryLink(field[0])) {
        return field.map(item => getFieldEntriesIndex(item, entries));
      }
    });

    const links = _.flatten(rawLinks).filter(index => index >= 0);

    return {
      index: entryIndex,
      linkIndexes: links
    };
  });
}

function getFieldEntriesIndex(field, entries) {
  const id = _.get(field, 'sys.id');
  return entries.findIndex(entry => entry.sys.id === id);
}

function parseEntries(entries) {
  return entries.map(entry => ({
    sys: {
      id: _.get(entry, 'sys.id'),
      contentType: {
        sys: {
          id: _.get(entry, 'sys.contentType.sys.id')
        }
      }
    },

    fields: parseEntryFields(entry.fields)
  }));
}

function parseEntryFields(fields) {
  return _.mapValues(fields, field =>
    _.mapValues(field, localizedField => {
      if (isEntryLink(localizedField)) {
        return parseEntryLink(localizedField);
      }
      if (isAssetLink(localizedField)) {
        return parseAssetLink(localizedField);
      }
      if (isEntityArray(localizedField)) {
        return localizedField.map(parseEntityArray);
      }
      return localizedField;
    })
  );
}

function parseEntityArray(item) {
  if (isEntryLink(item)) {
    return parseEntryLink(item);
  }
  if (isAssetLink(item)) {
    return parseAssetLink(item);
  }
}

function parseEntryLink(field) {
  return {
    sys: {
      id: _.get(field, 'sys.id'),
      type: 'Link',
      linkType: _.get(field, 'sys.type')
    }
  };
}

function parseAssetLink(field) {
  return {
    sys: {
      id: _.get(field, 'sys.id'),
      type: 'Link',
      linkType: _.get(field, 'sys.type')
    }
  };
}

function parseAssets(assets) {
  return assets.map(asset => ({
    sys: { id: _.get(asset, 'sys.id') },
    fields: parseAssetFields(asset.fields)
  }));
}

function parseAssetFields(fields) {
  return _.mapValues(fields, (field, fieldName) =>
    _.mapValues(field, localizedField => {
      try {
        if (fieldName === 'file') {
          return {
            fileName: localizedField.fileName,
            contentType: localizedField.contentType,
            upload: 'http:' + localizedField.url
          };
        }
      } catch (exp) {
        logger.logError('No localizedField available', {
          data: {
            exp,
            localizedField,
            field,
            fieldName
          }
        });
      }
      return localizedField;
    })
  );
}

function createApiKeyObjects(templateInfo) {
  return function appendApiKeyObjects(contents) {
    contents.apiKeys = (templateInfo.templateDeliveryApiKeys || []).map(apiKey => ({
      name: apiKey.fields.name,
      description: apiKey.fields.description
    }));
    return contents;
  };
}

function isEntryLink(item) {
  return _.get(item, 'sys.type') === 'Entry' || _.get(item, 'sys.linkType') === 'Entry';
}

function isAssetLink(item) {
  return _.get(item, 'sys.type') === 'Asset' || _.get(item, 'sys.linkType') === 'Asset';
}

function isEntityArray(item) {
  return Array.isArray(item) && item.length > 0 && typeof item[0].sys === 'object';
}
