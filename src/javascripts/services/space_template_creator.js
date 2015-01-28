'use strict';

angular.module('contentful').factory('spaceTemplateCreator', ['$injector', function ($injector) {

  var $q = $injector.get('$q');
  var $rootScope = $injector.get('$rootScope');
  var $timeout = $injector.get('$timeout');
  var ShareJS = $injector.get('ShareJS');

  var ASSET_PROCESSING_TIMEOUT = 40000;
  var PUBLISHING_WAIT = 5000;

  function TemplateCreator(spaceContext) {
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
    create: function(template) {
      var deferred = $q.defer();
      var self = this;
      self.creationErrors = [];

      // content types
      $q.all(_.map(template.contentTypes, self.createContentType, self))
      .then(_.bind(self.publishContentTypes, self))
      // editing interfaces
      .then(function () {
        return $q.all(_.map(template.editingInterfaces, self.createEditingInterface, self));
      })
      // assets
      .then(function () {
        return $q.all(_.map(template.assets, self.createAsset, self));
      })
      .then(_.bind(self.processAssets, self))
      .then(_.bind(self.publishAssets, self))
      // entries
      .then(function () {
        return $q.all(_.map(template.entries, self.createEntry, self));
      })
      .then(_.bind(self.publishEntries, self))
      // api keys
      .then($q.all(_.map(template.apiKeys, self.createApiKey, self)))
      // end it
      .then(function () {
        if(self.creationErrors.length > 0)
          deferred.reject({
            errors: self.creationErrors,
            template: template
          });
        else deferred.resolve();
      });

      return deferred.promise;
    },

    handleItem: function (item, actionData, response) {
      var itemKey = generateItemId(item, actionData);
      if(!(itemKey in this.handledItems))
        this.handledItems[itemKey] = {
          performedActions: [],
          response: response
        };
      if(!_.contains(this.handledItems[itemKey].performedActions, actionData.action))
        this.handledItems[itemKey].performedActions.push(actionData.action);
    },

    itemIsHandled: function (item, actionData) {
      var itemKey = generateItemId(item, actionData);
      return itemKey in this.handledItems && _.contains(this.handledItems[itemKey].performedActions, actionData.action);
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
        });
        return response;
      };
    },

    makeItemErrorHandler: function (item, actionData) {
      var self = this;
      return function (error) {
        self.creationErrors.push(error);
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

    createContentType: function(contentType) {
      var handlers = this.makeHandlers(contentType, 'create', 'ContentType');
      if(handlers.itemWasHandled) return $q.when(handlers.response);
      return this.spaceContext.space.createContentType(contentType)
      .then(handlers.success)
      .catch(handlers.error);
    },

    publishContentTypes: function (contentTypes) {
      var self = this;
      return $q.all(_.map(_.filter(contentTypes), function (contentType) {
        if(contentType) {
          var handlers = self.makeHandlers(contentType, 'publish', 'ContentType');
          if(handlers.itemWasHandled) return $q.when();
          var version = dotty.get(contentType, 'data.sys.version');
          return contentType.publish(version)
          .then(handlers.success)
          .catch(handlers.error);
        }
      }));
    },

    createEditingInterface: function(editingInterface) {
      var handlers = this.makeHandlers(editingInterface, 'create', 'EditingInterface');
      if(handlers.itemWasHandled) return $q.when(handlers.response);
      return this.spaceContext.space.createEditingInterface(editingInterface)
      .then(handlers.success)
      .catch(handlers.error);
    },

    createAsset: function(asset) {
      var handlers = this.makeHandlers(asset, 'create', 'Asset');
      if(handlers.itemWasHandled) return $q.when();
      return this.spaceContext.space.createAsset(asset)
      .then(handlers.success)
      .catch(handlers.error);
    },

    processAssets: function (assets) {
      var self = this;
      return $q.all(_.map(_.filter(assets), function (asset) {
        if(asset) {
          var handlers = self.makeHandlers(asset, 'process', 'Asset');
          if(handlers.itemWasHandled) return $q.when();
          var version = dotty.get(asset, 'data.sys.version');
          var locale = _.keys(dotty.get(asset, 'data.fields.file'))[0];
          return self.processAsset(asset, version, locale)
          .then(handlers.success)
          .catch(handlers.error);
        }
      }));
    },

    processAsset: function (asset, version, locale) {
      var listener, doc;
      var deferred = $q.defer();

      var processingTimeout = $timeout(function () {
        if(listener && doc) doc.removeListener(listener);
        deferred.reject({error: 'timeout processing'});
      }, ASSET_PROCESSING_TIMEOUT);

      ShareJS.open(asset, function (err, _doc) {
        $rootScope.$apply(function () {
          if(err) {
            $timeout.cancel(processingTimeout);
            return deferred.reject(err);
          }
          doc = _doc;
          listener = doc.on('remoteop', remoteOpHandler);
          asset.process(version, locale);
        });
      });

      return deferred.promise;

      function remoteOpHandler(ops) {
        $rootScope.$apply(function () {
          $timeout.cancel(processingTimeout);
          var op = ops && ops.length > 0 ? ops[0] : null;
          if(op && op.p && op.oi){
            var path = op.p;
            var inserted = op.oi;
            if (path[0] == 'fields' && path[1] == 'file' && 'url' in inserted){
              doc.removeListener(listener);
              doc.close();
              deferred.resolve(asset);
            }
          }
        });
      }

    },

    publishAssets: function (assets) {
      var self = this;
      return $q.all(_.map(assets, function (asset) {
        if(asset) {
          var handlers = self.makeHandlers(asset, 'publish', 'Asset');
          if(handlers.itemWasHandled) return $q.when();
          var version = dotty.get(asset, 'data.sys.version');
          return asset.publish(version+1)
          .then(handlers.success)
          .catch(handlers.error);
        }
      }));
    },

    createEntry: function(entry) {
      var handlers = this.makeHandlers(entry, 'create', 'Entry');
      if(handlers.itemWasHandled) return $q.when(handlers.response);
      var contentTypeId = dotty.get(entry, 'sys.contentType.sys.id');
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
          if(entry) {
            var handlers = self.makeHandlers(entry, 'publish', 'Entry');
            if(handlers.itemWasHandled) return $q.when();
            var version = dotty.get(entry, 'data.sys.version');
            return entry.publish(version)
            .then(handlers.success)
            .catch(handlers.error);
          }
        })).then(deferred.resolve, deferred.reject);
      }, PUBLISHING_WAIT);
      return deferred.promise;
    },

    createApiKey: function(apiKey) {
      var handlers = this.makeHandlers(apiKey, 'create', 'ApiKey');
      if(handlers.itemWasHandled) return $q.when(handlers.response);
      return this.spaceContext.space.createDeliveryApiKey(apiKey)
      .then(handlers.success)
      .catch(handlers.error);
    }
  };

  function generateItemId(item, actionData) {
    return actionData.entity + (dotty.get(item, 'sys.id') || item.name);
  }

  return {
    getCreator: function (spaceContext, itemHandlers) {
      var templateCreator = new TemplateCreator(spaceContext);
      templateCreator.itemHandlers = itemHandlers;
      return templateCreator;
    }
  };

}]);
