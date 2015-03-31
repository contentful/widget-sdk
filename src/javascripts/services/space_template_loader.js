'use strict';

angular.module('contentful').factory('spaceTemplateLoader', ['$injector', function ($injector) {


  var contentfulClient = $injector.get('contentfulClient');
  var $q               = $injector.get('$q');
  var environment      = $injector.get('environment');
  var mergeSort        = $injector.get('mergeSort');

  var contentfulConfig = environment.settings.contentful;

  var client;
  var spaceClients = {};

  return {
    getTemplatesList: function () {
      if(!client) client = getSpaceTemplatesClient();
      return client.entries({'content_type': contentfulConfig.spaceTemplateEntryContentTypeId})
             .then(function (entries) {
               _.each(entries, function (entry) {
                 entry.fields.order = _.isFinite(entry.fields.order) ? entry.fields.order : 99;
               });
               return mergeSort(entries, function (a, b) {
                 return a.fields.order > b.fields.order;
               });
             });
    },

    getTemplate: function (templateInfo) {
      var spaceClient = getSpaceClient(templateInfo);
      return getSpaceContents(spaceClient)
             .then(parseSpaceContents)
             .then(createApiKeyObjects(templateInfo));
    }
  };

  function getSpaceTemplatesClient() {
    return contentfulClient.newClient(getClientParams(
      contentfulConfig.space,
      contentfulConfig.accessToken,
      contentfulConfig.previewAccessToken
    ));
  }

  function getSpaceClient(templateInfo) {
    var spaceId = templateInfo.spaceId;
    if(spaceId in spaceClients)
      return spaceClients[spaceId];

    spaceClients[spaceId] = contentfulClient.newClient({
      host: contentfulConfig.apiUrl,
      space: spaceId,
      accessToken: contentfulConfig.spaceTemplatesUserReadOnlyToken
    });
    return spaceClients[spaceId];
  }

  function getClientParams(space, accessToken, previewAccessToken) {
    var isProduction = environment.env == 'production';
    var params = {
      space: space,
      accessToken: isProduction ?  accessToken : previewAccessToken,
      host: isProduction ? contentfulConfig.cdaApiUrl : contentfulConfig.previewApiUrl
    };
    return params;
  }

  function getSpaceContents(spaceClient) {
    return $q.all({
      contentTypes: spaceClient.contentTypes(),
      entries: spaceClient.entries(),
      assets: spaceClient.assets()
    }).then(getEditingInterfaces(spaceClient));
  }

  function getEditingInterfaces(spaceClient) {
    return function (spaceContents) {
      return $q.all(_.map(spaceContents.contentTypes, function (contentType) {
        return spaceClient.editingInterface(contentType.sys.id, 'default')
               .catch(function () {
                 return $q.when(null);
               });
      })).then(function (editingInterfaces) {
        spaceContents.editingInterfaces = _.filter(editingInterfaces);
        return spaceContents;
      });
    };
  }

  function parseSpaceContents(contents) {
    return {
      contentTypes: parseContentTypes(contents.contentTypes),
      entries: sortEntries(parseEntries(contents.entries)),
      assets: parseAssets(contents.assets),
      editingInterfaces: parseEditingInterfaces(contents.editingInterfaces)
    };
  }

  function parseContentTypes(contentTypes) {
    return _.map(contentTypes, function (contentType) {
      return {
        name: contentType.name,
        displayField: contentType.displayField,
        sys: {id: dotty.get(contentType, 'sys.id')},
        fields: contentType.fields
      };
    });
  }

  function sortEntries(entries) {
    var linkedEntries = getLinkedEntries(entries);

    linkedEntries = mergeSort(linkedEntries, function (a) {
      var hli = hasLinkedIndexesInFront(a);
      if(hli) return -1;
      if(!hli) return 1;
      if(!hasLinkedIndexes(a)) return -1;
    });

    return _.map(linkedEntries, function (linkInfo) {
      return entries[linkInfo.index];
    });

    function hasLinkedIndexesInFront(item) {
      if(hasLinkedIndexes(item)){
        return _.some(item.linkIndexes, function (index) {
          return index > item.index;
        });
      }
    }

    function hasLinkedIndexes(item) {
      return item.linkIndexes.length > 0;
    }
  }

  function getLinkedEntries(entries) {
    return _.map(entries, function (entry) {
      var entryIndex = entries.indexOf(entry);

      var rawLinks = _.map(entry.fields, function (field) {
        field = _.values(field)[0];
        if(isEntryLink(field)){
          return getFieldEntriesIndex(field, entries);
        } else if(isEntityArray(field) && isEntryLink(field[0])){
          return _.map(field, function (item) {
            return getFieldEntriesIndex(item, entries);
          });
        }
      });

      var links = _.filter(_.flatten(rawLinks), function (index) { return index >= 0; });

      return {
        index: entryIndex,
        linkIndexes: links
      };
    });
  }

  function getFieldEntriesIndex(field, entries) {
    var id = dotty.get(field, 'sys.id');
    return _.findIndex(entries, function (entry) { return entry.sys.id === id; });
  }

  function parseEntries(entries) {
    return _.map(entries, function (entry) {
      return {
        sys: {
          id: dotty.get(entry, 'sys.id'),
          contentType: {
            sys: {
              id: dotty.get(entry, 'sys.contentType.sys.id')
            }
          }
        },
        fields: parseEntryFields(entry.fields)
      };
    });
  }

  function parseEntryFields(fields) {
    return _.mapValues(fields, function (field) {
      return _.mapValues(field, function (localizedField) {
        if(isEntryLink(localizedField))
          return parseEntryLink(localizedField);
        if(isAssetLink(localizedField))
          return parseAssetLink(localizedField);
        if(isEntityArray(localizedField)){
          return _.map(localizedField, parseEntityArray);
        }
        return localizedField;
      });
    });
  }

  function parseEntityArray(item) {
    if(isEntryLink(item))
      return parseEntryLink(item);
    if(isAssetLink(item))
      return parseAssetLink(item);
  }

  function parseEntryLink(field) {
    return {
      sys: {
        id: dotty.get(field, 'sys.id'),
        type: 'Link',
        linkType: dotty.get(field, 'sys.type')
      }
    };
  }

  function parseAssetLink(field) {
    return {
      sys: {
        id: dotty.get(field, 'sys.id'),
        type: dotty.get(field, 'sys.type'),
        linkType: dotty.get(field, 'sys.linkType')
      }
    };
  }

  function parseAssets(assets) {
    return _.map(assets, function (asset) {
      return {
        sys: {id: dotty.get(asset, 'sys.id')},
        fields: parseAssetFields(asset.fields)
      };
    });
  }

  function parseAssetFields(fields) {
    return _.mapValues(fields, function (field, fieldName) {
      return _.mapValues(field, function (localizedField) {
        if(fieldName == 'file'){
          return {
            fileName: localizedField.fileName,
            contentType: localizedField.contentType,
            upload: 'http:'+localizedField.url
          };
        }
        return localizedField;
      });
    });
  }

  function createApiKeyObjects(templateInfo) {
    return function appendApiKeyObjects(contents) {
      contents.apiKeys = _.map(templateInfo.templateDeliveryApiKeys || [], function (apiKey) {
        return {
          name: apiKey.fields.name,
          description: apiKey.fields.description
        };
      });
      return contents;
    };
  }

  function parseEditingInterfaces(editingInterfaces) {
    return _.map(editingInterfaces, function (editingInterface) {
      return {
        title: editingInterface.title,
        contentTypeId: editingInterface.contentTypeId,
        widgets: editingInterface.widgets,
        sys: {
          id: editingInterface.sys.id,
          type: editingInterface.sys.type,
          contentType: editingInterface.sys.contentType
        }
      };
    });
  }

  function isEntryLink(item) {
    return dotty.get(item, 'sys.type') == 'Entry' ||
           dotty.get(item, 'sys.linkType') == 'Entry';
  }

  function isAssetLink(item) {
    return dotty.get(item, 'sys.type') == 'Asset' ||
           dotty.get(item, 'sys.linkType') == 'Asset';
  }

  function isEntityArray(item) {
    return _.isArray(item) && item.length > 0 && dotty.exists(item[0], 'sys');
  }


}]);
