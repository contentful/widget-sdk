angular.module('contentful').factory('SpaceContext', ['TabList', '$rootScope', '$q', '$parse', 'sentry', 'notification', 'PromisedLoader',
                                     function(TabList, $rootScope, $q, $parse, sentry, notification, PromisedLoader){
  'use strict';

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

      publishLocales: [],
      defaultLocale: null,
      localeStates: {},
      activeLocales: [],

      refreshLocales: function () {
        if (this.space) {
          this.publishLocales = this.space.getPublishLocales();
          this.defaultLocale  = this.space.getDefaultLocale();
          this.localeStates[this.defaultLocale.code] = true;
        } else {
          this.publishLocales = [];
          this.defaultLocale  = null;
        }
        this.refreshActiveLocales();
      },

      refreshActiveLocales: function () {
        var newLocaleStates = {}, newActiveLocales = [];
        _.each(this.publishLocales, function (locale) {
          if (this.localeStates[locale.code]) {
            newLocaleStates[locale.code] = true;
            newActiveLocales.push(locale);
          }
        }, this);
        this.localeStates = newLocaleStates;
        this.activeLocales = _.uniq(newActiveLocales, function(locale){return locale.code;});
      },

      getPublishLocale: function(code) {
        return _.find(this.publishLocales, {'code': code});
      },

      refreshContentTypes: function() {
        if (this.space) {
          var spaceContext = this;
          return this._contentTypeLoader.loadCallback(this.space, 'getContentTypes', {order: 'name', limit: 1000})
          .then(function (contentTypes) {
            contentTypes = _.reject(contentTypes, function (ct) { return ct.isDeleted(); });
            contentTypes.sort(function (a,b) {
              return a.getName().localeCompare(b.getName());
            });
            spaceContext.contentTypes = contentTypes;
            return spaceContext.refreshPublishedContentTypes().then(function () {
              return contentTypes;
            });
          });
        } else {
          this.contentTypes = [];
          this.publishedContentTypes = [];
          this._publishedContentTypesHash = {};
          return $q.when(this.contentTypes);
        }
      },

      refreshPublishedContentTypes: function() {
        var spaceContext = this;
        return this._publishedContentTypeLoader.loadCallback(this.space, 'getPublishedContentTypes')
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
          if(err && err.body && err.body.message)
            notification.warn(err.body.message);
          else
            notification.serverError('Could not get published Content Types', { data: err });
        });
      },

      registerPublishedContentType: function (publishedContentType) {
        if (!_.contains(this.publishedContentTypes, publishedContentType)) {
          this.publishedContentTypes.push(publishedContentType);
          this._publishedContentTypesHash[publishedContentType.getId()] = publishedContentType;
          $rootScope.$broadcast('newContentTypePublished', publishedContentType);
        }
      },

      unregisterPublishedContentType: function (publishedContentType) {
        var index = _.indexOf(this.publishedContentTypes, publishedContentType);
        if (index === -1) return;

        this.publishedContentTypes.splice(index, 1);
        this._publishedContentTypesHash = _.omit(this._publishedContentTypesHash, function (ct) {
          return ct === publishedContentType;
        });
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
