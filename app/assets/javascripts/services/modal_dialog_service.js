'use strict';

angular.module('contentful').factory('modalDialog', ['$compile', '$q', function ($compile, $q) {
  var ESC_KEY = 27;
  var ENTER_KEY = 13;

  function Dialog(params) {
    this.params = _.extend(
      {
        template: 'modal_dialog',
        cancelLabel: 'Cancel',
        confirmLabel: 'OK'
      },
      _.pick(params, 'title', 'message', 'template', 'cancelLabel', 'confirmLabel')
    );
    this._deferred = $q.defer();
    this.promise = this._deferred.promise;
  }

  Dialog.prototype = {
    attach: function (scope) {
      var dialog = this;
      this.domElement = $(JST[this.params.template]()).appendTo('body');

      this.domElement.find('input').eq(0).focus();

      this.handleKeys = function(e) {
        scope.$apply(function(){
          if (e.keyCode === ESC_KEY) dialog.cancel();
          if (e.keyCode === ENTER_KEY) dialog.confirm();
        });
      };

      $(window).on('keyup', this.handleKeys);

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
      if(this.domElement){
        this.domElement.scope().$destroy();
        this.domElement.remove();
        $(window).off('keyup', this.handleKeys);
        this.domElement = this.scope = null;
      }
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
