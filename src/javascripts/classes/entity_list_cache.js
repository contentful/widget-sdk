'use strict';
angular.module('contentful').factory('EntityListCache', ['$rootScope', '$q', 'logger', function($rootScope, $q, logger){

  // params:
  // - space
  // - entityType
  function EntityListCache(params){
    this.params = params;
    this.fetchMethod = getFetchMethod(params.entityType);
    this.locale = params.space.getDefaultLocale().code;
    this.missingIds = [];
    this.cache = {};
    this.queue = [];
    this.inProgress = false;
  }

  EntityListCache.prototype = {
    has: function (id) {
      return !!this.cache[id];
    },

    get: function (id) {
      return this.cache[id];
    },

    save: function (entity) {
      this.cache[getId(entity)] = entity;
    },

    setDisplayedFieldIds: function (displayedFieldIds) {
      this.displayedFieldIds = displayedFieldIds;
    },

    resolveLinkedEntities: function (entities, linkResolver) {
      linkResolver = linkResolver || $q.defer();
      if(this.inProgress){
        this.queue.push({
          linkResolver: linkResolver,
          entities: entities
        });
        return linkResolver.promise;
      }

      var self = this;
      this.inProgress = true;
      this.getLinkedEntities(entities).then(function () {
        linkResolver.resolve();
        self.inProgress = false;
        if(self.queue.length > 0){
          var nextRequest = self.queue.splice(0, 1)[0];
          self.resolveLinkedEntities(nextRequest.entities, nextRequest.linkResolver);
        }
      });

      return linkResolver.promise;
    },

    getLinkedEntities: function (entities) {
      var self = this;
      this.determineMissingEntityIds(entities);

      if(this.missingIds.length) {
        return this.params.space[this.fetchMethod]({
          'sys.id[in]': this.missingIds.join(','),
          limit: 250
        })
        .then(function(linkedEntities){
          self.missingIds = [];
          _.forEach(linkedEntities, self.save.bind(self));
        });
      } else {
        return $q.when();
      }
    },

    fieldIsDisplayed: function (fieldId) {
      return _.contains(this.displayedFieldIds, fieldId);
    },

    determineMissingEntityIds: function (entities) {
      var self = this;
      _.forEach(entities, function (entity) {
        if(_.isUndefined(entity.data)){
          logger.logError('Entity data is undefined', {
            data: {
              entities: entities
            }
          });
        } else {
          _.forEach(entity.data.fields, function (field, fieldId) {
            var locfield = field[self.locale];
            if(!self.fieldIsDisplayed(fieldId)) return;

            if(isLink(locfield))
              self.pushFieldId(locfield);
            if(isLinkArray(locfield)){
              var limit = locfield.length > self.params.limit ? self.params.limit : locfield.length;
              for(var i=0; i<limit; i++){
                self.pushFieldId(locfield[i]);
              }
            }
          });
        }
      });
    },

    pushFieldId: function (field) {
      if(field.sys.linkType == this.params.entityType &&
         !_.contains(this.missingIds, getId(field)) &&
         !this.get(getId(field))
        ) {
        this.missingIds.push(getId(field));
      }
    }

  };

  function isLink(field) {
    return field && field.sys && field.sys.type === 'Link';
  }

  function isLinkArray(field) {
    return _.isArray(field) && field.length > 0 && isLink(field[0]);
  }

  function getFetchMethod(type) {
    if(type == 'Entry')
      return 'getEntries';
    else if(type == 'Asset')
      return 'getAssets';
    else
      throw new Error('Specify an Entity type for the cache');
  }

  function getId(entity) {
    return (entity.sys ? entity.sys.id : entity.data.sys.id) || null;
  }

  return EntityListCache;
}]);
