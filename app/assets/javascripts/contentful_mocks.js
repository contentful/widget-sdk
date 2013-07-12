'use strict';

window.createMockEntity = function (id, contentType) {
  return {
    getId: function () {
      return id;
    },
    // mock for api keys
    getName: function () {
      return id;
    },
    data: {
      sys: {
        id: id
      },
      displayField: 'title',
      fields: {
        title: {
          'en-US': 'the title'
        }
      }
    },
    delete: function (fn) {
      fn(null, this);
    },
    getContentTypeId: function () {
      return contentType;
    }
  };
};

window.createMockSpace = function (id) {
  var entity = window.createMockEntity(id);
  entity.getPublishLocales = function(){
    return [
      {name: 'en-US', code: 'en-US'},
      {name: 'en-GB', code: 'en-GB'},
      {name: 'pt-PT', code: 'pt-PT'},
      {name: 'pt-BR', code: 'pt-BR'}
    ];
  };
  entity.getDefaultLocale  = function(){
    return {name: 'en-US', code: 'en-US'};
  };

  return entity;
};

angular.module('contentful/mocks', []).provider('ShareJS', function () {
  function FakeShareJSClient() {
  }

  FakeShareJSClient.prototype = {
    open: function (entity, callback) {
      _.defer(callback, null, new FakeShareJSDoc(entity));
    }
  };

  function FakeShareJSDoc(entity) {
    this.entity = entity;
    this.snapshot = entity.data;
  }

  FakeShareJSDoc.prototype = {
    removeListener: angular.noop,
    addListener: angular.noop
  };

  this.token = function () { };
  this.url = function () { };

  this.$get = function () {
    return new FakeShareJSClient();
  };
});

