'use strict';
angular.module('contentful')

.factory('EntityListCache', ['require', require => {
  const $q = require('$q');
  const _ = require('lodash');
  const logger = require('logger');
  const TheLocaleStore = require('TheLocaleStore');

  // params:
  // - space
  // - entityType
  function EntityListCache (params) {
    this.params = params;
    this.fetchMethod = getFetchMethod(params.entityType);
    this.locale = TheLocaleStore.getDefaultLocale().internal_code;
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
      if (this.inProgress) {
        this.queue.push({
          linkResolver: linkResolver,
          entities: entities
        });
        return linkResolver.promise;
      }

      const self = this;
      this.inProgress = true;
      this.getLinkedEntities(entities).then(() => {
        linkResolver.resolve();
        self.inProgress = false;
        if (self.queue.length > 0) {
          const nextRequest = self.queue.splice(0, 1)[0];
          self.resolveLinkedEntities(nextRequest.entities, nextRequest.linkResolver);
        }
      });

      return linkResolver.promise;
    },

    getLinkedEntities: function (entities) {
      const self = this;
      this.determineMissingEntityIds(entities);

      if (this.missingIds.length) {
        return this.params.space[this.fetchMethod]({
          'sys.id[in]': this.missingIds.join(','),
          limit: 250
        })
        .then(linkedEntities => {
          self.missingIds = [];
          _.forEach(linkedEntities, self.save.bind(self));
        });
      } else {
        return $q.resolve();
      }
    },

    fieldIsDisplayed: function (fieldId) {
      return _.includes(this.displayedFieldIds, fieldId);
    },

    determineMissingEntityIds: function (entities) {
      const self = this;
      _.forEach(entities, entity => {
        if (_.isUndefined(entity.data)) {
          logger.logError('Entity data is undefined', {
            data: {
              entities: entities
            }
          });
        } else {
          _.forEach(entity.data.fields, (field, fieldId) => {
            if (!self.fieldIsDisplayed(fieldId)) return;
            const locfield = field && field[self.locale];

            if (isLink(locfield)) { self.pushFieldId(locfield); }
            if (isLinkArray(locfield)) {
              const limit = locfield.length > self.params.limit ? self.params.limit : locfield.length;
              for (let i = 0; i < limit; i++) {
                self.pushFieldId(locfield[i]);
              }
            }
          });
        }
      });
    },

    pushFieldId: function (field) {
      if (field.sys.linkType === this.params.entityType &&
         !_.includes(this.missingIds, getId(field)) &&
         !this.get(getId(field))
        ) {
        this.missingIds.push(getId(field));
      }
    }

  };

  function isLink (field) {
    return field && field.sys && field.sys.type === 'Link';
  }

  function isLinkArray (field) {
    return _.isArray(field) && field.length > 0 && isLink(field[0]);
  }

  function getFetchMethod (type) {
    if (type === 'Entry') { return 'getEntries'; } else if (type === 'Asset') { return 'getAssets'; } else { throw new Error('Specify an Entity type for the cache'); }
  }

  function getId (entity) {
    return (entity.sys ? entity.sys.id : entity.data.sys.id) || null;
  }

  return EntityListCache;
}]);
