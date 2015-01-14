'use strict';

angular.module('contentful').factory('SpaceContext', ['$injector', function($injector){
  var $parse             = $injector.get('$parse');
  var $q                 = $injector.get('$q');
  var $rootScope         = $injector.get('$rootScope');
  var PromisedLoader     = $injector.get('PromisedLoader');
  var ReloadNotification = $injector.get('ReloadNotification');
  var TabList            = $injector.get('TabList');
  var notification       = $injector.get('notification');
  var logger             = $injector.get('logger');

  function SpaceContext(space){
    this.tabList = new TabList();
    this.space = space;
    this._contentTypeLoader = new PromisedLoader();
    this._publishedContentTypeLoader = new PromisedLoader();
    this.refreshLocales();
  }

  SpaceContext.prototype = {
      tabList: null,
      space: null,

      contentTypes: [],
      publishedContentTypes: [],
      _publishedContentTypesHash: {},

      privateLocales: [],
      defaultLocale: null,
      localeStates: {},
      activeLocales: [],

      refreshLocales: function () {
        if (this.space) {
          this.privateLocales = this.space.getPrivateLocales();
          this.defaultLocale  = this.space.getDefaultLocale();
          this.localeStates[this.defaultLocale.code] = true;
        } else {
          this.privateLocales = [];
          this.defaultLocale  = null;
        }
        this.refreshActiveLocales();
      },

      refreshActiveLocales: function () {
        var newLocaleStates = {}, newActiveLocales = [];
        _.each(this.privateLocales, function (locale) {
          if (this.localeStates[locale.code]) {
            newLocaleStates[locale.code] = true;
            newActiveLocales.push(locale);
          }
        }, this);
        this.localeStates = newLocaleStates;
        this.activeLocales = _.uniq(newActiveLocales, function(locale){return locale.code;});
      },

      getPrivateLocale: function(code) {
        return _.find(this.privateLocales, {'code': code});
      },

      refreshContentTypes: function() {
        if (this.space) {
          var spaceContext = this;
          return this._contentTypeLoader.loadPromise(function(){
            return spaceContext.space.getContentTypes({order: 'name', limit: 1000});
          })
          .then(function (contentTypes) {
            contentTypes = _.reject(contentTypes, function (ct) { return ct.isDeleted(); });
            contentTypes.sort(function (a,b) {
              return a.getName().localeCompare(b.getName());
            });
            spaceContext.contentTypes = contentTypes;
            return spaceContext.refreshPublishedContentTypes().then(function () {
              return contentTypes;
            });
          })
          .catch(ReloadNotification.apiErrorHandler);
        } else {
          this.contentTypes = [];
          this.publishedContentTypes = [];
          this._publishedContentTypesHash = {};
          return $q.when(this.contentTypes);
        }
      },

      refreshPublishedContentTypes: function() {
        var spaceContext = this;
        return this._publishedContentTypeLoader.loadPromise(function(){
          return spaceContext.space.getPublishedContentTypes();
        })
        .then(function (contentTypes) {
          spaceContext.publishedContentTypes = _(contentTypes)
            .reject(function (ct) { return ct.isDeleted(); })
            .union(spaceContext.publishedContentTypes)
            .sortBy(function(ct) { return ct.getName().trim().toLowerCase(); })
            .value();
          spaceContext._publishedContentTypesHash = _(spaceContext.publishedContentTypes).map(function(ct) {
            return [ct.getId(), ct];
          }).object().valueOf();
          _.each(spaceContext._publishedContentTypesHash, function (val, id) {
            spaceContext._publishedContentTypeIsMissing[id] = false;
          });
          return spaceContext.publishedContentTypes;
        }, function (err) {
          if (err === PromisedLoader.IN_PROGRESS) return;
          var message = dotty.get(err, 'body.message');
          if(message)
            notification.warn(message);
          else
            notification.warn('Could not get published Content Types');
            logger.logError('Could not get published Content Types', { data: err });
          return $q.reject(err);
        })
        .catch(ReloadNotification.apiErrorHandler);
      },

      registerPublishedContentType: function (publishedContentType) {
        if (!_.contains(this.publishedContentTypes, publishedContentType)) {
          this.publishedContentTypes.push(publishedContentType);
          this._publishedContentTypesHash[publishedContentType.getId()] = publishedContentType;
          $rootScope.$broadcast('contentTypePublished', publishedContentType);
        }
      },

      unregisterPublishedContentType: function (publishedContentType) {
        var index = _.indexOf(this.publishedContentTypes, publishedContentType);
        if (index === -1) return;

        this.publishedContentTypes.splice(index, 1);
        this._publishedContentTypesHash = _.omit(this._publishedContentTypesHash, function (ct) {
          return ct === publishedContentType;
        });
        $rootScope.$broadcast('contentTypeUnpublished', publishedContentType);
      },

      removeContentType: function(contentType) {
        var index = _.indexOf(this.contentTypes, contentType);
        if (index === -1) return;
        this.contentTypes.splice(index, 1);
        this.refreshPublishedContentTypes();
      },

      _publishedContentTypeIsMissing: {},

      publishedTypeForEntry: function(entry) {
        var contentTypeId = entry.getContentTypeId();
        return this.getPublishedContentType(contentTypeId);
      },

      getPublishedContentType: function (contentTypeId) {
        var contentType = this._publishedContentTypesHash[contentTypeId];

        if (!contentType && !this._publishedContentTypeIsMissing[contentTypeId]) {
          this._publishedContentTypeIsMissing[contentTypeId] = true;
          this.refreshContentTypes();
        }
        return contentType;
      },

      displayFieldForType: function (contentTypeId) {
        var ct = this.getPublishedContentType(contentTypeId);
        return ct && _.find(ct.data.fields, {id: ct.data.displayField});
      },

      localizedField: function(entity, path, locale) {
        var getField = $parse(path);
        var field = getField(entity);
        var defaultLocale = this.space.getDefaultLocale().code;
        locale = locale || defaultLocale;
        return (field && field[locale]) || field && field[defaultLocale];
      },

      entryTitle: function(entry, localeCode) {
        var defaultTitle = 'Untitled';

        try {
          var displayField = this.publishedTypeForEntry(entry).data.displayField;
          if (!displayField) {
            return defaultTitle;
          } else {
            var title = this.localizedField(entry, 'data.fields.'+displayField, localeCode);
            if (!title || title.match(/^\s*$/)) {
              return defaultTitle;
            } else {
              return title;
            }
          }
        } catch (e) {
          return defaultTitle;
        }
      },

      assetTitle: function (asset, localeCode) {
        var defaultTitle = 'Untitled';

        try {
          var title = this.localizedField(asset, 'data.fields.title', localeCode);
          if (!title || title.match(/^\s*$/)) {
            return defaultTitle;
          } else {
            return title;
          }
        } catch(e) {
          return defaultTitle;
        }
      }

    };

    return SpaceContext;
}]);
