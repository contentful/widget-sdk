angular.module('contentful/classes').factory('BucketContext', function(TabList, $rootScope){
  'use strict';

  function BucketContext(bucket){
    this.tabList = new TabList();
    this.bucket = bucket;
  }

  BucketContext.prototype = {
      tabList: null,
      bucket: null,

      entryTypes: [],
      publishedEntryTypes: [],
      _publishedEntryTypesHash: {},

      publishLocales: [],
      defaultLocale: null,
      localesActive: {},
      activeLocales: [],

      refreshLocales: function () {
        if (this.bucket) {
          this.publishLocales = this.bucket.getPublishLocales();
          this.defaultLocale  = this.bucket.getDefaultLocale();
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

      refreshEntryTypes: function() {
        if (this.bucket) {
          var bucketContext = this;
          this.bucket.getEntryTypes({order: 'sys.id', limit: 1000}, function(err, entryTypes) {
            if (err) return;
            $rootScope.$apply(function() {
              bucketContext.entryTypes = entryTypes;
              bucketContext.refreshPublishedEntryTypes();
            });
          });
        } else {
          this.entryTypes = [];
          this.publishedEntryTypes = [];
          this._publishedEntryTypesHash = {};
          return;
        }
      },
      refreshPublishedEntryTypes: function() {
        var self = this;
        this.bucket.getPublishedEntryTypes(function (err, entryTypes) {
          if (err) {
            console.error('Could not get published entry types', err);
          } else {
            $rootScope.$apply(function () {
              self.publishedEntryTypes = _(entryTypes)
                // TODO this union will lead to problems if we ever allow deletion of published entry Types
                // because entryTypes that entered the list once will never get out again
                .union(self.publishedEntryTypes)
                .sortBy(function(et) { return et.data.name.trim().toLowerCase(); })
                .value();
              self._publishedEntryTypesHash = _(entryTypes).map(function(et) {
                return [et.data.sys.id, et];
              }).object().valueOf();
            });
          }
        });
      },
      registerPublishedEntryType: function (publishedEntryType) {
        if (!_.contains(this.publishedEntryTypes, publishedEntryType)) {
          this.publishedEntryTypes.push(publishedEntryType);
        }
      },
      removeEntryType: function(entryType) {
        var index = _.indexOf(this.entryTypes, entryType);
        if (index === -1) return;
        this.entryTypes.splice(index, 1);
        this.refreshPublishedEntryTypes();
      },
      publishedTypeForEntry: function(entry) {
        return this._publishedEntryTypesHash[entry.getEntryTypeId()];
      },
      entryTitle: function(entry, localeCode) {
        var defaultTitle = 'Untitled';

        localeCode = localeCode || this.bucket.getDefaultLocale().code;

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

    return BucketContext;
});
