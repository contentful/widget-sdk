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
      refreshEntryTypes: function(scope) {
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
      },
      removeEntryType: function(entryType) {
        var index = _.indexOf(this.entryTypes, entryType);
        this.entryTypes.splice(index, 1);
      },
      typeForEntry: function(entry) {
        return this._entryTypesHash[entry.data.sys.entryType];
      },
      entryTitle: function(entry) {
        try {
          var displayField = this.typeForEntry(entry).data.displayField;
          if (!displayField) {
            return entry.data.sys.id;
          } else {
            return entry.data.fields[displayField][this.bucket.data.locales.default];
          }
        } catch (e) {
          return entry.data.sys.id;
        }
      }

    };

    return BucketContext;
});
