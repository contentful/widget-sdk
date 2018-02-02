import {getCurrentVariation} from 'utils/LaunchDarkly';
import contentfulClient from 'contentfulClient';
import * as environment from 'environment';
import {runTask} from 'utils/Concurrent';
import logger from 'logger';
import _ from 'lodash';

const contentfulConfig = environment.settings.contentful;

let client;
const spaceClients = {};

export function getTemplatesList () {
  return runTask(function* () {
    if (!client) client = getSpaceTemplatesClient();
    const fetchTemplatesPromise = client.entries({'content_type': contentfulConfig.spaceTemplateEntryContentTypeId});
    const tesFeatureFlagPromise = getCurrentVariation('feature-ps-01-2018-tes-in-webapp-as-example-space');
    const [templates, tesInWebAppFeatureFlag] = yield Promise.all([fetchTemplatesPromise, tesFeatureFlagPromise]);

    const orderedTemplates = _.sortBy(templates,
      template => _.isFinite(template.fields.order) ? template.fields.order : 99
    );

    return orderedTemplates.filter(template => {
      if (tesInWebAppFeatureFlag) {
        return true;
      } else {
        // if this feature is disabled, hide the example space
        // template from the example spaces list show in the
        // space creation modal
        return template.fields.spaceId !== contentfulConfig.TEASpaceId;
      }
    });
  });
}

export function getTemplate (templateInfo) {
  const spaceClient = getSpaceClient(templateInfo);
  return getSpaceContents(spaceClient)
          .then(parseSpaceContents)
          .then(createApiKeyObjects(templateInfo));
}

function getSpaceTemplatesClient () {
  return contentfulClient.newClient(getClientParams(
    contentfulConfig.space,
    contentfulConfig.accessToken,
    contentfulConfig.previewAccessToken
  ));
}

function getSpaceClient (templateInfo) {
  const spaceId = templateInfo.spaceId;
  if (spaceId in spaceClients) {
    return spaceClients[spaceId];
  }

  spaceClients[spaceId] = contentfulClient.newClient({
    host: contentfulConfig.cdaApiUrl,
    space: spaceId,
    accessToken: templateInfo.spaceApiKey
  });
  return spaceClients[spaceId];
}

function getClientParams (space, accessToken, previewAccessToken) {
  const isProduction = environment.env === 'production';
  const params = {
    space: space,
    accessToken: isProduction ? accessToken : previewAccessToken,
    host: isProduction ? contentfulConfig.cdaApiUrl : contentfulConfig.previewApiUrl
  };
  return params;
}

function getSpaceContents (spaceClient) {
  return Promise.all([
    // we rely on having locales later, but CDA calls by default
    // return only one locale, so we add parameter to fetch all of them
    spaceClient.contentTypes({ locale: '*' }),
    spaceClient.entries({ locale: '*' }),
    spaceClient.assets({ locale: '*' })
  ])
  .then(([contentTypes, entries, assets]) => ({ contentTypes, entries, assets }));
}

function parseSpaceContents (contents) {
  return {
    contentTypes: parseContentTypes(contents.contentTypes),
    entries: sortEntries(parseEntries(contents.entries)),
    assets: parseAssets(contents.assets)
  };
}

function parseContentTypes (contentTypes) {
  return _.map(contentTypes, function (contentType) {
    return {
      name: contentType.name,
      displayField: contentType.displayField,
      sys: {id: _.get(contentType, 'sys.id')},
      fields: contentType.fields
    };
  });
}

function sortEntries (entries) {
  const linkedEntries = getLinkedEntries(entries);

  linkedEntries.sort(entry => {
    const hli = hasLinkedIndexesInFront(entry);
    return hli ? -1 : 1;
  });

  return linkedEntries.map(linkInfo => entries[linkInfo.index]);

  function hasLinkedIndexesInFront (item) {
    if (hasLinkedIndexes(item)) {
      return item.linkIndexes.some(index => index > item.index);
    }
  }

  function hasLinkedIndexes (item) {
    return item.linkIndexes.length > 0;
  }
}

function getLinkedEntries (entries) {
  return entries.map(function (entry) {
    const entryIndex = entries.indexOf(entry);
    const rawLinks = Object.keys(entry.fields).map(function (fieldId) {
      const rawField = entry.fields[fieldId];
      const field = _.values(rawField)[0];
      if (isEntryLink(field)) {
        return getFieldEntriesIndex(field, entries);
      } else if (isEntityArray(field) && isEntryLink(field[0])) {
        return field.map(function (item) {
          return getFieldEntriesIndex(item, entries);
        });
      }
    });

    const links = _.flatten(rawLinks).filter(index => index >= 0);

    return {
      index: entryIndex,
      linkIndexes: links
    };
  });
}

function getFieldEntriesIndex (field, entries) {
  const id = _.get(field, 'sys.id');
  return entries.findIndex(entry => entry.sys.id === id);
}

function parseEntries (entries) {
  return entries.map(function (entry) {
    return {
      sys: {
        id: _.get(entry, 'sys.id'),
        contentType: {
          sys: {
            id: _.get(entry, 'sys.contentType.sys.id')
          }
        }
      },
      fields: parseEntryFields(entry.fields)
    };
  });
}

function parseEntryFields (fields) {
  return _.mapValues(fields, function (field) {
    return _.mapValues(field, function (localizedField) {
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
    });
  });
}

function parseEntityArray (item) {
  if (isEntryLink(item)) {
    return parseEntryLink(item);
  }
  if (isAssetLink(item)) {
    return parseAssetLink(item);
  }
}

function parseEntryLink (field) {
  return {
    sys: {
      id: _.get(field, 'sys.id'),
      type: 'Link',
      linkType: _.get(field, 'sys.type')
    }
  };
}

function parseAssetLink (field) {
  return {
    sys: {
      id: _.get(field, 'sys.id'),
      type: 'Link',
      linkType: _.get(field, 'sys.type')
    }
  };
}

function parseAssets (assets) {
  return assets.map(function (asset) {
    return {
      sys: {id: _.get(asset, 'sys.id')},
      fields: parseAssetFields(asset.fields)
    };
  });
}

function parseAssetFields (fields) {
  return _.mapValues(fields, function (field, fieldName) {
    return _.mapValues(field, function (localizedField) {
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
            exp: exp,
            localizedField: localizedField,
            field: field,
            fieldName: fieldName
          }
        });
      }
      return localizedField;
    });
  });
}

function createApiKeyObjects (templateInfo) {
  return function appendApiKeyObjects (contents) {
    contents.apiKeys = (templateInfo.templateDeliveryApiKeys || []).map(function (apiKey) {
      return {
        name: apiKey.fields.name,
        description: apiKey.fields.description
      };
    });
    return contents;
  };
}

function isEntryLink (item) {
  return _.get(item, 'sys.type') === 'Entry' ||
          _.get(item, 'sys.linkType') === 'Entry';
}

function isAssetLink (item) {
  return _.get(item, 'sys.type') === 'Asset' ||
          _.get(item, 'sys.linkType') === 'Asset';
}

function isEntityArray (item) {
  return Array.isArray(item) && item.length > 0 && typeof item[0].sys === 'object';
}
