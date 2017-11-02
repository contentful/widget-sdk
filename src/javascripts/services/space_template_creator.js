'use strict';

angular.module('contentful').factory('spaceTemplateCreator', ['require', function (require) {
  var $q = require('$q');
  var $rootScope = require('$rootScope');
  var $timeout = require('$timeout');
  var contentPreview = require('contentPreview');
  var Analytics = require('analytics/Analytics');

  var ASSET_PROCESSING_TIMEOUT = 60000;
  var PUBLISHING_WAIT = 5000;

  function TemplateCreator (spaceContext) {
    this.spaceContext = spaceContext;
    this.handledItems = {};
  }

  TemplateCreator.prototype = {

    /*
     * This method fires all the actions for creating Content Types, Assets,
     * Entries, API Keys and it returns a promise when everything is done.
     *
     * Each created item will call the custom success/error handlers and
     * notify the provided user callbacks, so the user can do things like
     * update the status on the UI.
     *
     * This method does not return the promise from the chain itself
     * but instead handles it separately as we do not want the errors
     * on the creation calls to stop the whole chain of events.
     */
    create: function (template) {
      var deferred = $q.defer();
      var self = this;
      self.creationErrors = [];

      // content types
      $q.all(_.map(template.contentTypes, _.bind(self.createContentType, self)))
      .then(_.bind(self.publishContentTypes, self))
      // editing interfaces
      .then(function () {
        return $q.all(_.map(template.editingInterfaces, _.bind(self.createEditingInterface, self)));
      })
      // assets
      .then(function () {
        var assets = setDefaultLocale(template.assets, self._getDefaultLocale());
        return $q.all(_.map(assets, _.bind(self.createAsset, self)));
      })
      .then(_.bind(self.processAssets, self))
      .then(_.bind(self.publishAssets, self))
      // entries
      .then(function () {
        var entries = setDefaultLocale(template.entries, self._getDefaultLocale());
        return $q.all(_.map(entries, _.bind(self.createEntry, self)));
      })
      .then(_.bind(self.publishEntries, self))
      // api keys
      .then($q.all(_.map(template.apiKeys, _.bind(self.createApiKey, self))))
      // preview environment
      .then(function () {
        return self.createPreviewEnvironment(template.contentTypes);
      })
      // end it
      .then(function () {
        if (self.creationErrors.length > 0) {
          deferred.reject({
            errors: self.creationErrors,
            template: template
          });
        } else {
          deferred.resolve();
        }
      });

      return deferred.promise;
    },

    handleItem: function (item, actionData, response) {
      var itemKey = generateItemId(item, actionData);
      if (!(itemKey in this.handledItems)) {
        this.handledItems[itemKey] = {
          performedActions: [],
          response: response
        };
      }
      if (!_.includes(this.handledItems[itemKey].performedActions, actionData.action)) {
        this.handledItems[itemKey].performedActions.push(actionData.action);
      }
    },

    itemIsHandled: function (item, actionData) {
      var itemKey = generateItemId(item, actionData);
      return itemKey in this.handledItems && _.includes(this.handledItems[itemKey].performedActions, actionData.action);
    },

    getHandledItemResponse: function (item, actionData) {
      var itemKey = generateItemId(item, actionData);
      return itemKey in this.handledItems ? this.handledItems[itemKey].response : null;
    },

    makeItemSuccessHandler: function (item, actionData) {
      var self = this;
      return function (response) {
        self.handleItem(item, actionData, response);
        self.itemHandlers.onItemSuccess(generateItemId(item, actionData), {
          item: item,
          actionData: actionData,
          response: response
        }, self.templateName);
        return response;
      };
    },

    makeItemErrorHandler: function (item, actionData) {
      var self = this;
      return function (error) {
        self.creationErrors.push({
          error: error,
          action: actionData.action,
          entityType: actionData.entity,
          entityId: getItemId(item)
        });
        self.itemHandlers.onItemError(generateItemId(item, actionData), {
          item: item,
          actionData: actionData,
          error: error
        });
        // not rejecting the promise (see comment on create method)
        return null;
      };
    },

    makeHandlers: function (item, action, entity) {
      var data = { action: action, entity: entity };
      item = item.data || item;
      return {
        success: this.makeItemSuccessHandler(item, data),
        error: this.makeItemErrorHandler(item, data),
        itemWasHandled: this.itemIsHandled(item, data),
        response: this.getHandledItemResponse(item, data)
      };
    },

    createContentType: function (contentType) {
      var handlers = this.makeHandlers(contentType, 'create', 'ContentType');
      if (handlers.itemWasHandled) {
        return $q.resolve(handlers.response);
      }
      return this.spaceContext.space.createContentType(contentType)
      .then(handlers.success)
      .catch(handlers.error);
    },

    publishContentTypes: function (contentTypes) {
      var self = this;
      return $q.all(_.map(_.filter(contentTypes), function (contentType) {
        if (contentType) {
          var handlers = self.makeHandlers(contentType, 'publish', 'ContentType');
          if (handlers.itemWasHandled) {
            return $q.resolve();
          }
          var version = _.get(contentType, 'data.sys.version');
          return contentType.publish(version)
          .then(handlers.success)
          .catch(handlers.error);
        }
      }));
    },

    createEditingInterface: function (editingInterface) {
      var handlers = this.makeHandlers(editingInterface, 'create', 'EditingInterface');
      if (handlers.itemWasHandled) {
        return $q.resolve(handlers.response);
      }
      var repo = this.spaceContext.editingInterfaces;
      // The content type has a default editor interface with version 1.
      editingInterface.data.sys.version = 1;
      return repo.save(editingInterface.contentType, editingInterface.data)
      .then(handlers.success, handlers.error);
    },

    createAsset: function (asset) {
      var handlers = this.makeHandlers(asset, 'create', 'Asset');
      if (handlers.itemWasHandled) {
        return $q.resolve();
      }
      return this.spaceContext.space.createAsset(asset)
      .then(handlers.success)
      .catch(handlers.error);
    },

    processAssets: function (assets) {
      var self = this;
      return $q.all(_.map(_.filter(assets), function (asset) {
        if (asset) {
          var handlers = self.makeHandlers(asset, 'process', 'Asset');
          if (handlers.itemWasHandled) {
            return $q.resolve();
          }
          var version = _.get(asset, 'data.sys.version');
          var locale = _.keys(_.get(asset, 'data.fields.file'))[0];
          return self.processAsset(asset, version, locale)
          .then(handlers.success)
          .catch(handlers.error);
        }
      }));
    },

    processAsset: function (asset, version, locale) {
      var destroyDoc;
      var deferred = $q.defer();

      var processingTimeout = $timeout(function () {
        if (destroyDoc) {
          destroyDoc();
        }
        deferred.reject({error: 'timeout processing'});
      }, ASSET_PROCESSING_TIMEOUT);

      // TODO: this is the only place where we use
      // docConnection outside of spaceContext. We
      // need to wait for assets to process in order
      // to publish them in the next step.
      this.spaceContext.docConnection.open(asset)
      .then(function (info) {
        destroyDoc = info.destroy;
        info.doc.on('remoteop', remoteOpHandler);
        asset.process(version, locale);
      }, function (err) {
        $timeout.cancel(processingTimeout);
        deferred.reject(err);
      });

      return deferred.promise;

      function remoteOpHandler (ops) {
        $rootScope.$apply(function () {
          $timeout.cancel(processingTimeout);
          var op = ops && ops.length > 0 ? ops[0] : null;
          if (op && op.p && op.oi) {
            var path = op.p;
            var inserted = op.oi;
            if (path[0] === 'fields' && path[1] === 'file' && 'url' in inserted) {
              destroyDoc();
              deferred.resolve(asset);
            }
          }
        });
      }
    },

    publishAssets: function (assets) {
      var self = this;
      return $q.all(_.map(assets, function (asset) {
        if (asset) {
          var handlers = self.makeHandlers(asset, 'publish', 'Asset');
          if (handlers.itemWasHandled) {
            return $q.resolve();
          }
          var version = _.get(asset, 'data.sys.version');
          return asset.publish(version + 1)
          .then(handlers.success)
          .catch(handlers.error);
        }
      }));
    },

    createEntry: function (entry) {
      var handlers = this.makeHandlers(entry, 'create', 'Entry');
      if (handlers.itemWasHandled) {
        return $q.resolve(handlers.response);
      }
      var contentTypeId = _.get(entry, 'sys.contentType.sys.id');
      delete entry.contentType;
      return this.spaceContext.space.createEntry(contentTypeId, entry)
      .then(handlers.success)
      .catch(handlers.error);
    },

    publishEntries: function (entries) {
      var self = this;
      var deferred = $q.defer();
      $timeout(function () {
        $q.all(_.map(_.filter(entries), function (entry) {
          if (entry) {
            var handlers = self.makeHandlers(entry, 'publish', 'Entry');
            if (handlers.itemWasHandled) {
              return $q.resolve();
            }
            var version = _.get(entry, 'data.sys.version');
            return entry.publish(version)
            .then(handlers.success)
            .catch(handlers.error);
          }
        })).then(deferred.resolve, deferred.reject);
      }, PUBLISHING_WAIT);
      return deferred.promise;
    },

    createApiKey: function (apiKey) {
      var handlers = this.makeHandlers(apiKey, 'create', 'ApiKey');
      if (handlers.itemWasHandled) {
        return $q.resolve(handlers.response);
      }
      return this.spaceContext.space.createDeliveryApiKey(apiKey)
      .then(handlers.success)
      .catch(handlers.error);
    },

    // Create the discovery app environment if there is an API key
    createPreviewEnvironment: function (contentTypes) {
      var baseUrl = 'https://discovery.contentful.com/entries/by-content-type/';
      var getKeys = this.spaceContext.space.getDeliveryApiKeys();
      var getContentPreview = contentPreview.getAll();
      var spaceId = this.spaceContext.space.getId();

      return $q.all([getKeys, getContentPreview]).then(function (responses) {
        var keys = responses[0];
        var envs = responses[1];

        function createConfig (ct, token) {
          return {
            contentType: ct.sys.id,
            url: baseUrl + ct.sys.id + '/{entry_id}/?space_id=' + spaceId + '&delivery_access_token=' + token,
            enabled: true,
            example: true
          };
        }

        // Create default environment if there is none existing, and an API key is present
        if (keys.length && !Object.keys(envs).length) {
          var accessToken = keys[0].data.accessToken;

          var env = {
            name: 'Discovery App',
            description: 'To help you get started, we\'ve added our own Discovery App to preview content.',
            configs: contentTypes.map(function (ct) {
              return createConfig(ct, accessToken);
            })
          };
          return contentPreview.create(env).then(function (env) {
            Analytics.track('content_preview:created', {
              name: env.name,
              id: env.sys.id,
              isDiscoveryApp: true
            });
          });
        } else {
          // Don't do anything
          $q.resolve();
        }
      });
    },

    _getDefaultLocale: function () {
      var locales = this.spaceContext.space.data.locales;
      return !_.isEmpty(locales) ? locales[0].internal_code : 'en-US';
    }
  };

  function generateItemId (item, actionData) {
    return actionData.entity + getItemId(item);
  }

  function getItemId (item) {
    return _.get(item, 'sys.id') || item.name;
  }

  function setDefaultLocale (entities, locale) {
    return _.map(_.clone(entities), function (entity) {
      entity.fields = _.mapValues(entity.fields, function (field) {
        var newField = {};
        newField[locale] = _.values(field)[0];
        return newField;
      });
      return entity;
    });
  }

  return {
    getCreator: function (spaceContext, itemHandlers, templateName) {
      var templateCreator = new TemplateCreator(spaceContext);
      templateCreator.itemHandlers = itemHandlers;
      templateCreator.templateName = templateName;
      return templateCreator;
    }
  };
}]);
