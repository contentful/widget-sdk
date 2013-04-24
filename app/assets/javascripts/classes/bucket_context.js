angular.module('contentful/classes').factory('BucketContext', function(TabList){
  'use strict';

  function BucketContext(scope){
    this.tabList = new TabList(scope);
  }

  BucketContext.prototype = {
      tabList: null,
      bucket: null,

      entryTypes: [],
      _entryTypesHash: {},
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

      refreshEntryTypes: function(scope) {
        if (this.bucket) {
          var bucketContext = this;
          this.bucket.getEntryTypes({order: 'sys.id', limit: 1000}, function(err, entryTypes) {
            if (err) return;
            scope.$apply(function() {
              bucketContext.entryTypes = entryTypes;
              bucketContext._entryTypesHash = _(entryTypes).map(function(et) {
                return [et.data.sys.id, et];
              }).object().valueOf();
              bucketContext.refreshPublishedEntryTypes();
            });
          });
        } else {
          this.entryTypes = [];
          this._entryTypesHash = {};
          this.publishedEntryTypes = [];
          return;
        }
      },
      refreshPublishedEntryTypes: function() {
        var self = this;
        this.bucket.getPublishedEntryTypes(function (err, entryTypes) {
          if (err) {
            console.error('Could not get published entry types', err);
          } else {
            self.publishedEntryTypes = _(entryTypes)
              .sortBy(function(et) { return et.data.name.trim().toLowerCase(); })
              .value();
            self._publishedEntryTypesHash = _(entryTypes).map(function(et) {
              return [et.data.sys.id, et];
            }).object().valueOf();
          }
        });
      },
      removeEntryType: function(entryType) {
        var index = _.indexOf(this.entryTypes, entryType);
        if (index === -1) return;
        this.entryTypes.splice(index, 1);
        this.refreshPublishedEntryTypes();
      },
      typeForEntry: function(entry) {
        return this._entryTypesHash[entry.getEntryTypeId()];
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
