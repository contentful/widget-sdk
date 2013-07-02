'use strict';

angular.module('contentful').factory('modalDialog', ['$compile', '$q', function ($compile, $q) {

  function Dialog(params) {
    this.params = _.pick(params, 'title', 'message');
    this._deferred = $q.defer();
    this.promise = this._deferred.promise;
  }

  Dialog.prototype = {
    attach: function (scope) {
      var dialog = this;
      this.domElement = $(JST['modal_dialog']()).appendTo('body');
      scope.dialog = {
        cancel: function () { dialog.cancel(); },
        confirm: function () { dialog.confirm(); }
      };
      _.extend(scope.dialog, this.params);

      $compile(this.domElement)(scope);
    },

    confirm: function () {
      this._deferred.resolve();
      this._cleanup();
    },

    cancel: function () {
      this._deferred.reject();
      this._cleanup();
    },

    _cleanup: function () {
      this.domElement.scope().$destroy();
      this.domElement.remove();
      this.domElement = this.scope = null;
    }
  };

  return {
    open: function (params) {
      var dialog = new Dialog(params);
      dialog.attach(params.scope.$new());
      return dialog.promise;
    }
  };
}]);
