'use strict';

angular.module('contentful').factory('modalDialog', ['$injector', function ($injector) {
  var $compile = $injector.get('$compile');
  var $q       = $injector.get('$q');
  var $window  = $injector.get('$window');
  var keycodes = $injector.get('keycodes');

  function Dialog(params) {
    this._handleKeys = _.bind(this._handleKeys, this);
    this.scope = params.scope.$new();
    this.params = _.extend(
      {
        template: 'modal_dialog',
        cancelLabel: 'Cancel',
        confirmLabel: 'OK',
        noBackgroundClose: false,
        attachTo: '.client',
        ignoreEnter: false,
      },
      _.pick(params,
             'title', 'message', 'html', 'template',
             'cancelLabel', 'confirmLabel',
             'noBackgroundClose', 'attachTo', 'ignoreEnter')
    );
    this._deferred = $q.defer();
    this.promise = this._deferred.promise;
  }

  Dialog.prototype = {

    attach: function () {
      var scope = this.scope;
      this.domElement = $(JST[this.params.template]()).prependTo(this.params.attachTo);

      this.domElement.find('input').eq(0).focus();

      $($window).on('keyup', this._handleKeys);

      scope.dialog = _.extend(this, this.params);
      $compile(this.domElement)(scope);

      this.domElement.on('click', _.bind(this._closeOnBackground, this));
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
        if (ev.keyCode === keycodes.ESC)
          dialog.cancel();
        if (!dialog.params.ignoreEnter && ev.keyCode === keycodes.ENTER)
          dialog.confirm();
      });
    },

    confirm: function () {
      this._deferred.resolve.apply(this, arguments);
      this._cleanup();
      return this;
    },

    cancel: function () {
      this._deferred.reject.apply(this, arguments);
      this._cleanup();
      return this;
    },

    _cleanup: function () {
      if(this.domElement){
        this.domElement.scope().$destroy();
        this.domElement.remove();
        $($window).off('keyup', this._handleKeys);
        this.domElement = this.scope = null;
      }
    }
  };

  return {
    // Available params: template, cancelLabel, confirmLabel, title, message, scope, noBackgroundClose
    open: function (params) {
      var dialog = new Dialog(params);
      dialog.attach();
      return dialog;
    }
  };
}]);
