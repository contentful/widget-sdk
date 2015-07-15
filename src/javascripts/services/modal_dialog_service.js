'use strict';

/**
 * @ngdoc service
 * @name modalDialog
 * @description
 * Open a modal dialog on the page and return a `Dialog` instance.
 *
 * @usage[js]
 *   var dialog = modalDialog.open({
 *     scope: myScope,
 *     template: 'jade_template_name'
 *   })
 *
 *   dialog.promise.then(function() {
 *     console.log('dialog closed ok');
 *   }, function() {
 *     console.log('dialog canceled');
 *   });
 *
 *   dialog.confirm();
 */
angular.module('contentful').factory('modalDialog', ['$injector', function ($injector) {
  var $compile   = $injector.get('$compile');
  var $q         = $injector.get('$q');
  var $window    = $injector.get('$window');
  var keycodes   = $injector.get('keycodes');
  var defer      = $injector.get('defer');
  var track      = $injector.get('analytics').track;
  var $rootScope = $injector.get('$rootScope');

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
        ignoreEsc: false,
        disableTopCloseButton: false,
        className: ''
      },
      _.pick(params,
             'title', 'message', 'html', 'template',
             'cancelLabel', 'confirmLabel', 'className', 'disableTopCloseButton',
             'noBackgroundClose', 'attachTo', 'ignoreEnter', 'ignoreEsc')
    );
    this._deferred = $q.defer();
    this.promise = this._deferred.promise;
  }

  Dialog.prototype = {

    attach: function () {
      var scope = this.scope;
      this.domElement = $(JST[this.params.template]());

      if(this.domElement.find('input').length > 0)
        this.domElement.find('input').eq(0).focus();
      else
        $(':focus').blur();

      $($window).on('keyup', this._handleKeys);

      scope.dialog = _.extend(this, this.params);

      // Defer rendering to prevent positioning issues when firing dialogs
      // on page load
      defer(_.bind(function () {
        this.domElement.appendTo(this.params.attachTo);
        $compile(this.domElement)(scope);
        this.domElement.on('click', _.bind(this._closeOnBackground, this));
        this.open = true;
        scope.$apply();
      }, this));
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
        if (!dialog.params.ignoreEsc && ev.keyCode === keycodes.ESC)
          dialog.cancel();
        if (!dialog.params.ignoreEnter && ev.keyCode === keycodes.ENTER)
          dialog.confirm();
      });
    },

    confirm: function () {
      this._deferred.resolve.apply(this, arguments);
      this.destroy();
      trackConfirmed(this);
      return this;
    },

    cancel: function () {
      this._deferred.reject.apply(this, arguments);
      this.destroy();
      trackCanceled(this);
      return this;
    },

    destroy: function () {
      if(this.domElement){
        this.domElement.scope().$destroy();
        this.domElement.remove();
        $($window).off('keyup', this._handleKeys);
      }
      if(this.scope) this.scope.$destroy();
      this.domElement = this.scope = null;
      this.open = false;
    }
  };

  return {
    open:              openDialog,
    notify:            notify,
    confirmDeletion:   confirmDeletion,
    openConfirmDialog: openConfirmDialog
  };

  /**
   * @ngdoc method
   * @name modalDialog#open
   * @param {{}} options
   * @param {string}   options.title
   * @param {string}   options.message
   * @param {string}   options.cancelLabel
   * @param {string}   options.confirmLabel
   * @param {string}   options.template
   * @param {Scope}    options.scope
   * @param {boolean}  options.noBackgrounClose
   * @param {boolean}  options.ignoreEnter
   * @param {boolean}  options.ignoreEscape
   * @param {boolean}  options.disableTopCloseButton
   */
  function openDialog (params) {
    var dialog = new Dialog(params);
    dialog.attach();
    trackOpened(dialog);
    return dialog;
  }

  /**
   * @ngdoc method
   * @name modalDialog#confirmDeletion
   * @description
   * Shows a dialog that asks the user to click a button to confirm
   * deletion of an item. Uses "openConfirmDialog" internally.
   *
   * @param {string} message
   * @param {string?} hint
   * @return {Promise<object>}
   */
  function confirmDeletion (message, hint) {
    var scope = _.extend($rootScope.$new(), {
      message: message,
      hint: hint
    });

    return openConfirmDialog({
      template: 'dialog_confirm_deletion',
      attachTo: '.client',
      scope: scope
    });
  }

  /**
   * @ngdoc method
   * @name modalDialog#notify
   * @description
   * Show a message in a dialog with a single 'OK' button.
   *
   * The returned promise is resolved when the user clicks 'OK', clicks
   * on the background or hits 'Enter' or 'Escape'.
   *
   * @param {string} message
   * @returns {Promise<void>}
   */
  function notify (message, confirmLabel) {
    var scope = _.extend($rootScope.$new(), {
      message: message,
      confirmLabel: confirmLabel || 'OK'
    });

    return openConfirmDialog({
      template: 'dialog_notification',
      attachTo: '.client',
      scope: scope,
      ignoreEnter: false,
      ignoreEsc: false,
      noBackgroundClose: false
    }).then(function () {
      return;
    }, function () {
      // Hitting Escape rejects the promsise
      return;
    });
  }

  /**
   * @ngdoc method
   * @name modalDialog#openConfirmDialog
   * @description
   * Generic method for opening confirmation dialogs. It has sensible
   * defaults (no accidental closing actions) and always returns promise.
   * This promise will be resolved with object containing two properties:
   * "confirmed" and "cancelled" when user interacts with dialog.
   *
   * @param {object} params
   * @returns {Promise<object>}
   */
  function openConfirmDialog(params) {
    params = _.defaults(params || {}, {
      ignoreEnter: true,
      ignoreEsc: true,
      noBackgroundClose: true
    });

    return openDialog(params)
      .promise.then(function() {
        return { confirmed: true,  cancelled: false };
      }, function() {
        return { confirmed: false, cancelled: true  };
      });
  }

  function trackDialog (eventName, dialog) {
    track(eventName, {
      title: dialog.params.title,
      message: dialog.params.message
    });
  }

  /**
   * @ngdoc analytics-event
   * @name Dialog Opened
   * @param title
   * @param message
   */
  function trackOpened(dialog) {
    trackDialog('Dialog Opened', dialog);
  }

  /**
   * @ngdoc analytics-event
   * @name Dialog Canceled
   * @param title
   * @param message
   */
  function trackCanceled(dialog) {
    trackDialog('Dialog Canceled', dialog);
  }

  /**
   * @ngdoc analytics-event
   * @name Dialog Confirmed
   * @param title
   * @param message
   */
  function trackConfirmed(dialog) {
    trackDialog('Dialog Confirmed', dialog);
  }
}]);
