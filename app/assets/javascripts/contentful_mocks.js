'use strict';

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
