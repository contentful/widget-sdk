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

      publishLocales: [],
      defaultLocale: null,
      localesActive: {},
      activeLocales: [],

      refreshLocales: function () {
        if (this.bucket) {
          this.publishLocales = this.bucket.getPublishLocales();
          this.defaultLocale  = this.bucket.getDefaultLocale();
          this.localesActive[this.defaultLocale.name] = true;
        } else {
          this.publishLocales = [];
          this.defaultLocale  = null;
        }
        this.refreshActiveLocales();
      },
      refreshActiveLocales: function () {
        var newLocaleStates = {}, newActiveLocales = [];
        _.each(this.publishLocales, function (locale) {
          if (this.localesActive[locale.name]) {
            newLocaleStates[locale.name] = true;
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
        this.publishedEntryTypes = _.filter(this.entryTypes, function(et) {
          return et.data && et.data.sys.publishedAt;
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
      entryTitle: function(entry, localeName) {
        localeName = localeName || this.bucket.getDefaultLocale().name;

        try {
          var displayField = this.typeForEntry(entry).data.displayField;
          if (!displayField) {
            return entry.data.sys.id;
          } else {
            var title = entry.data.fields[displayField][localeName];
            if (!title || title.match(/^\s*$/)) {
              return entry.data.sys.id;
            } else {
              return title;
            }
          }
        } catch (e) {
          return entry.data.sys.id;
        }
      }

    };

    return BucketContext;
});
