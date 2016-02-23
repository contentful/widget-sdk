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
 *   setTimeout(function(){
 *     console.log('going to close ok');
 *     dialog.confirm();
 *   }, 3000);
 *
 */
angular.module('contentful').factory('modalDialog', ['$injector', function ($injector) {
  var $compile   = $injector.get('$compile');
  var $q         = $injector.get('$q');
  var $window    = $injector.get('$window');
  var keycodes   = $injector.get('keycodes');
  var defer      = $injector.get('defer');
  var analytics  = $injector.get('analytics');
  var $rootScope = $injector.get('$rootScope');
  var debounce   = $injector.get('debounce');
  var $timeout   = $injector.get('$timeout');
  var opened     = [];

  function Dialog(params) {
    this._handleKeys = _.bind(this._handleKeys, this);
    opened.push(this);
    var scope = params.scope;

    if (!scope) {
      scope = _.extend($rootScope.$new(), params.scopeData);
    }

    if (params.noNewScope) {
      this.scope = scope;
    } else {
      this.scope = scope.$new();
    }

    this.params = _.extend(
      {
        template: 'modal_dialog',
        confirmLabel: 'OK',
        cancelLabel: 'Cancel',
        attachTo: '.client',
        backgroundClose: true,
        ignoreEnter: true,
        ignoreEsc: false,
        disableTopCloseButton: false,
        persistOnNavigation: false
      },
      _.pick(params,
        'title', 'message',
        'template', 'confirmLabel', 'cancelLabel',
        'attachTo', 'enterAction', 'backgroundClose',
        'ignoreEnter', 'ignoreEsc', 'disableTopCloseButton',
        'persistOnNavigation')
    );

    this._deferred = $q.defer();
    this.promise = this._deferred.promise;
  }

  Dialog.prototype = {

    attach: function () {
      var scope = this.scope;

      this.domElement = $(JST[this.params.template]());

      scope.dialog = _.extend(this, this.params);

      // Defer rendering to prevent positioning issues when firing dialogs
      // on page load
      defer(_.bind(function () {
        this.domElement.appendTo(this.params.attachTo);
        $compile(this.domElement)(scope);

        this.domElement.on('click', _.bind(this._closeOnBackground, this));
        this.open = true;
        scope.$apply();

        this._centerOnBackground();

        if(this.domElement.find('input').length > 0) {
          this.domElement.find('input').eq(0).focus();
        } else {
          $(':focus').blur();
        }

        $($window).on('keyup', this._handleKeys);

        this.domElement.addClass('is-visible');

      }, this));
    },

    _centerOnBackground: function () {
      var elem = this.domElement.children('.modal-dialog');
      var debouncedReposition = debounce(reposition, 50);
      var destroyed = false;

      reposition();
      $($window).on('resize', debouncedReposition);

      var repositionOff = $rootScope.$on('centerOn:reposition', function () {
        if (!destroyed) { reposition(); }
      });

      elem.on('$destroy', function () {
        destroyed = true;
        $($window).off('resize', debouncedReposition);
        repositionOff();
      });

      function reposition() {
        var topOffset = Math.max(($window.innerHeight-elem.height())/2, 0);
        elem.css({ top: topOffset + 'px' });
      }
    },

    _closeOnBackground: function (ev) {
      var target = $(ev.target);
      if(target.hasClass('modal-background') && this.params.backgroundClose) {
        this.cancel();
      }
    },

    _handleKeys: function(ev) {
      var dialog = this;
      dialog.scope.$apply(function(){
        if (ev.target.tagName.toLowerCase() == 'select') return;
        if (!dialog.params.ignoreEsc && ev.keyCode === keycodes.ESC) {
          dialog.cancel();
        }
        if (!dialog.params.ignoreEnter && ev.keyCode === keycodes.ENTER) {
          if (dialog.params.enterAction) {
            dialog.params.enterAction();
          } else {
            dialog.confirm();
          }
        }
      });
    },

    confirm: function () {
      this._deferred.resolve.apply(this, arguments);
      this.destroy();
      trackConfirmed(this);
      removeFromOpened(this);
      return this;
    },

    cancel: function () {
      this._deferred.reject.apply(this, arguments);
      this.destroy();
      trackCanceled(this);
      removeFromOpened(this);
      return this;
    },

    destroy: function () {
      var self = this;
      $($window).off('keyup', this._handleKeys);
      function destroyModal() {
        if(self.domElement){
          self.domElement.scope().$destroy();
          self.domElement.remove();
        }
        if(self.scope) self.scope.$destroy();
        self.domElement = self.scope = null;
        self.open = false;
      }
      this.domElement.removeClass('is-visible');
      $timeout(destroyModal, 250);
    }
  };

  return {
    open:                     openDialog,
    openConfirmDialog:        openConfirmDialog,
    openConfirmDeleteDialog:  openConfirmDeleteDialog,
    getOpened:                getOpened,
    closeAll:                 closeAll
  };

  // Closes all modals with persistOnNaviagation = false
  function closeAll () {
    _.forEachRight(opened, function(dialog) {
      if (!dialog.persistOnNavigation) {
        dialog.cancel();
      }
    });
  }

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
      ignoreEsc: true,
      backgroundClose: false
    });

    return openDialog(params)
      .promise.then(function() {
        return { confirmed: true,  cancelled: false };
      }, function() {
        return { confirmed: false, cancelled: true  };
      });
  }

  function openConfirmDeleteDialog(params) {
    params = _.defaults(params || {}, {
      template: 'modal_dialog_warning',
      confirmLabel: 'Delete'
    });
    return openDialog(params);
  }

  /**
   * @ngdoc method
   * @name modalDialog#getOpened
   * @returns Dialog[]
   */
  function getOpened() {
    return opened;
  }

  function removeFromOpened(dialog) {
    var index = opened.indexOf(dialog);
    if (index > -1) {
      opened.splice(index, 1);
    }
  }

  function trackDialog (eventName, dialog) {
    analytics.track(eventName, {
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
