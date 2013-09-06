angular.module('contentful').factory('SpaceContext', function(TabList, $rootScope, $q, $parse){
  'use strict';

  function SpaceContext(space){
    this.tabList = new TabList();
    this.space = space;
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
      localesActive: {},
      activeLocales: [],

      refreshLocales: function () {
        if (this.space) {
          this.publishLocales = this.space.getPublishLocales();
          this.defaultLocale  = this.space.getDefaultLocale();
          this.localesActive[this.defaultLocale.code] = true;
        } else {
          this.publishLocales = [];
          this.defaultLocale  = null;
        }
        this.refreshActiveLocales();
      },

      refreshActiveLocales: function () {
        var newLocaleStates = {}, newActiveLocales = [];
        _.each(this.publishLocales, function (locale) {
          if (this.localesActive[locale.code]) {
            newLocaleStates[locale.code] = true;
            newActiveLocales.push(locale);
          }
        }, this);
        this.localesActive = newLocaleStates;
        this.activeLocales = newActiveLocales;
      },

      getPublishLocale: function(code) {
        return _.find(this.publishLocales, {'code': code});
      },

      refreshContentTypes: function() {
        if (this.space) {
          var deferred = $q.defer();
          var spaceContext = this;
          this.space.getContentTypes({order: 'name', limit: 1000}, function(err, contentTypes) {
            $rootScope.$apply(function() {
              if (err) return deferred.reject(err);
              contentTypes.sort(function (a,b) {
                return a.getName().localeCompare(b.getName());
              });
              spaceContext.contentTypes = contentTypes;
              spaceContext.refreshPublishedContentTypes().then(function () {
                deferred.resolve(contentTypes);
              });
            });
          });
          return deferred.promise;
        } else {
          this.contentTypes = [];
          this.publishedContentTypes = [];
          this._publishedContentTypesHash = {};
          return $q.when(this.contentTypes);
        }
      },

      refreshPublishedContentTypes: function() {
        var deferred = $q.defer();
        var self = this;
        this.space.getPublishedContentTypes(function (err, contentTypes) {
          $rootScope.$apply(function () {
            if (err) {
              console.error('Could not get published content types', err);
              deferred.reject(err);
            } else {
                self.publishedContentTypes = _(contentTypes)
                  .reject(function (ct) { return ct.isDeleted(); })
                  .union(self.publishedContentTypes)
                  .sortBy(function(ct) { return ct.getName().trim().toLowerCase(); })
                  .value();
                self._publishedContentTypesHash = _(self.publishedContentTypes).map(function(ct) {
                  return [ct.data.sys.id, ct];
                }).object().valueOf();
                _.each(self._publishedContentTypesHash, function (val, id) {
                  self._publishedContentTypeIsMissing[id] = false;
                });
                deferred.resolve(self.publishedContentTypes);
            }
          });
        });
        return deferred.promise;
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
        var contentType   = this._publishedContentTypesHash[contentTypeId];

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
});
