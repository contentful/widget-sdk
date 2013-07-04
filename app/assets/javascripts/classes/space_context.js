angular.module('contentful').factory('SpaceContext', function(TabList, $rootScope, $q){
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
            contentTypes.sort(function (a,b) {
              return a.getName().localeCompare(b.getName());
            });
            $rootScope.$apply(function() {
              if (err) return deferred.reject(err);
              spaceContext.contentTypes = contentTypes;
              spaceContext.refreshPublishedContentTypes();
              deferred.resolve(contentTypes);
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
        var self = this;
        this.space.getPublishedContentTypes(function (err, contentTypes) {
          if (err) {
            console.error('Could not get published content types', err);
          } else {
            $rootScope.$apply(function () {
              self.publishedContentTypes = _(contentTypes)
                // TODO this union will lead to problems if we ever allow deletion of published content Types
                // because contentTypes that entered the list once will never get out again
                .union(self.publishedContentTypes)
                .sortBy(function(ct) { return ct.getName().trim().toLowerCase(); })
                .value();
              self._publishedContentTypesHash = _(self.publishedContentTypes).map(function(ct) {
                return [ct.data.sys.id, ct];
              }).object().valueOf();
            });
          }
        });
      },
      registerPublishedContentType: function (publishedContentType) {
        if (!_.contains(this.publishedContentTypes, publishedContentType)) {
          this.publishedContentTypes.push(publishedContentType);
          this._publishedContentTypesHash[publishedContentType.getId()] = publishedContentType;
          $rootScope.$broadcast('newContentTypePublished', publishedContentType);
        }
      },
      removeContentType: function(contentType) {
        var index = _.indexOf(this.contentTypes, contentType);
        if (index === -1) return;
        this.contentTypes.splice(index, 1);
        this.refreshPublishedContentTypes();
      },
      publishedTypeForEntry: function(entry) {
        return this._publishedContentTypesHash[entry.getContentTypeId()];
      },
      entryTitle: function(entry, localeCode) {
        var defaultTitle = 'Untitled';

        localeCode = localeCode || this.space.getDefaultLocale().code;

        try {
          var displayField = this.publishedTypeForEntry(entry).data.displayField;
          if (!displayField) {
            return defaultTitle;
          } else {
            var title = entry.data.fields[displayField][localeCode];
            if (!title || title.match(/^\s*$/)) {
              return defaultTitle;
            } else {
              return title;
            }
          }
        } catch (e) {
          return defaultTitle;
        }
      }

    };

    return SpaceContext;
});
