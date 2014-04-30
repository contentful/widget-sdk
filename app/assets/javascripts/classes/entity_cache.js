angular.module('contentful').factory('EntityCache', function($rootScope, $q){
  'use strict';

  // params:
  // - space
  // - entityType
  function EntityCache(params){
    this.params = params;
    this.fetchMethod = getFetchMethod(params.entityType);
    this.locale = params.space.getDefaultLocale().code;
    this.missingIds = [];
    this.cache = {};
    this.queue = [];
    this.inProgress = false;
  }

  EntityCache.prototype = {
    get: function (id) {
      return this.cache[id];
    },

    save: function (entity) {
      this.cache[getId(entity)] = entity;
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
        linkResolver.resolve(self.replaceMissingEntityIds(entities));
        self.inProgress = false;
        if(self.queue.length > 0){
          var nextRequest = self.queue.splice(0, 1)[0];
          self.resolveLinkedEntities(nextRequest.entities, nextRequest.linkResolver);
        }
      });

      return linkResolver.promise;
    },

    replaceMissingEntityIds: function (entities) {
      var self = this;
      _.forEach(entities, function (entity) {
        entity.data.fields = _.mapValues(entity.data.fields, function (field) {
          var resolvedField = {};
          var locfield = field[self.locale];
          if(isLink(locfield))
            resolvedField[self.locale] = self.get(getId(locfield)) || locfield;
          else if(isLinkArray(locfield))
            resolvedField[self.locale] = _.map(locfield, function (field) {
              return self.get(getId(field)) || field;
            });
          else
            return field;
          return resolvedField;
        });
      });
      return entities;
    },

    getLinkedEntities: function (entities) {
      var lookup = $q.defer();
      var self = this;
      this.determineMissingEntityIds(entities);

      if(!this.missingIds.length) lookup.resolve();

      this.params.space[this.fetchMethod]({'sys.id[in]': this.missingIds.join(',')}, function (err, linkedEntities) {
        $rootScope.$apply(function () {
          if (err) return lookup.reject(err);
          self.missingIds = [];
          _.forEach(linkedEntities, self.save.bind(self));
          lookup.resolve();
        });
      });

      return lookup.promise;
    },

    determineMissingEntityIds: function (entities) {
      var self = this;
      _.forEach(entities, function (entity) {
        _.forEach(entity.data.fields, function (field) {
          var locfield = field[self.locale];
          if(isLink(locfield))
            self.pushFieldId(locfield);
          if(isLinkArray(locfield)){
            var limit = locfield.length > self.params.limit ? self.params.limit : locfield.length;
            for(var i=0; i<limit; i++){
              self.pushFieldId(locfield[i]);
            }
          }
        });
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

  return EntityCache;
});
