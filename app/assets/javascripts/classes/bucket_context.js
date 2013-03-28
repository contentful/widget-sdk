angular.module('contentful/classes').factory('BucketContext', function(TabList){
  'use strict';

  function BucketContext(scope){
    this.tabList = new TabList(scope);
  }

  BucketContext.prototype = {
      tabList: null,
      bucket: null,
      entryTypes: [],
      publishLocales: [],
      defaultLocale: null,
      _entryTypesHash: {},
      refreshLocales: function () {
        if (this.bucket) {
          this.publishLocales = this.bucket.getPublishLocales();
          this.defaultLocale  = this.bucket.getDefaultLocale();
        } else {
          this.publishLocales = [];
          this.defaultLocale  = null;
        }
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
            });
          });
        } else {
          this.entryTypes = [];
          this._entryTypesHash = {};
          return;
        }
      },
      removeEntryType: function(entryType) {
        var index = _.indexOf(this.entryTypes, entryType);
        this.entryTypes.splice(index, 1);
      },
      typeForEntry: function(entry) {
        return this._entryTypesHash[entry.data.sys.entryType];
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
