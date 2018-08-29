'use strict';

module.exports = function createMethods(constructor, path) {
  const methods = {
    getById: function(id) {
      if (!id) throw new Error('No id provided');

      return this.endpoint(path, id)
        .get()
        .then(this.childResourceFactory(constructor, path));
    },

    getAll: function() {
      return this.endpoint(path)
        .get()
        .then(this.childResourceFactory(constructor, path));
    },

    getByQuery: function(query) {
      return this.endpoint(path)
        .payload(query)
        .get()
        .then(this.childResourceFactory(constructor, path));
    },

    create: function(data, headers) {
      return methods.new.call(this, data).save(headers);
    },

    new: function(data) {
      return this.childResourceFactory(constructor, path)(data || {});
    }
  };
  return methods;
};
