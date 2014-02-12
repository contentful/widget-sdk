'use strict';

angular.module('contentful').factory('modalDialog', ['$compile', '$q', 'keycodes', function ($compile, $q, keycodes) {

  function Dialog(params) {
    this.scope = params.scope.$new();
    this.params = _.extend(
      {
        template: 'modal_dialog',
        cancelLabel: 'Cancel',
        confirmLabel: 'OK',
        noBackgroundClose: false,
        deactivateConfirmKey: false,
        deactivateCancelKey: false
      },
      _.pick(params,
             'title', 'message', 'template',
             'cancelLabel', 'confirmLabel', 'deactivateConfirmKey', 'deactivateCancelKey',
             'noBackgroundClose')
    );
    this._deferred = $q.defer();
    this.promise = this._deferred.promise;
    this.invalid = undefined;
  }

  Dialog.prototype = {

    attach: function () {
      var scope = this.scope;
      this.domElement = $(JST[this.params.template]()).appendTo('body');

      this.domElement.find('input').eq(0).focus();

      $(window).on('keyup', _.bind(this._handleKeys, this));

      scope.dialog = _.extend(this, this.params);
      $compile(this.domElement)(scope);

      this.domElement.on('click', _.bind(this._closeOnBackground, this));
    },

    setInvalid: function (state) {
      this.invalid = !!state;
    },

    _closeOnBackground: function (ev) {
      var target = $(ev.target);
      if(target.hasClass('modal-background') &&
         _.isUndefined(target.attr('no-background-close')) &&
         !this.params.noBackgroundClose
        ){
        this.cancel();
      }
    },

    _handleKeys: function(ev) {
      var dialog = this;
      dialog.scope.$apply(function(){
        if (ev.target.tagName.toLowerCase() == 'select') return;
        if (!dialog.params.deactivateCancelKey && ev.keyCode === keycodes.ESC)
          dialog.cancel();
        if (!dialog.params.deactivateConfirmKey && dialog.invalid !== true && ev.keyCode === keycodes.ENTER)
          dialog.confirm();
      });
    },

    confirm: function () {
      this._deferred.resolve();
      this._cleanup();
      return this;
    },

    cancel: function () {
      this._deferred.reject();
      this._cleanup();
      return this;
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
    // Available params: template, cancelLabel, confirmLabel, title, message, scope, noBackgroundClose
    open: function (params) {
      var dialog = new Dialog(params);
      dialog = _.extend(dialog, dialog.promise);
      dialog.attach();
      return dialog;
    }
  };
}]);
