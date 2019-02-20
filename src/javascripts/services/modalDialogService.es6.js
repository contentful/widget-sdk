import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import $ from 'jquery';
import { h } from 'utils/legacy-html-hyperscript/index.es6';
import keycodes from 'utils/keycodes.es6';
import * as logger from 'services/logger.es6';

export default function register() {
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
   *   setTimeout(function() {
   *     console.log('going to close ok');
   *     dialog.confirm();
   *   }, 3000);
   */
  registerFactory('modalDialog', [
    '$compile',
    '$q',
    '$window',
    '$rootScope',
    '$timeout',
    'defer',
    'debounce',
    ($compile, $q, $window, $rootScope, $timeout, defer, debounce) => {
      const opened = [];

      function Dialog(params) {
        this._handleKeys = _.bind(this._handleKeys, this);
        opened.push(this);
        let scope = params.scope;

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
            persistOnNavigation: false,
            disableAutoFocus: false
          },
          _.pick(params, [
            'title',
            'message',
            'messageTemplate',
            'template',
            'confirmLabel',
            'cancelLabel',
            'attachTo',
            'enterAction',
            'backgroundClose',
            'ignoreEnter',
            'ignoreEsc',
            'disableAutoFocus',
            'disableTopCloseButton',
            'persistOnNavigation'
          ])
        );

        if (params.controller) {
          params.controller(this.scope);
        }

        this._deferred = $q.defer();
        this.promise = this._deferred.promise;
      }

      Dialog.prototype = {
        attach: function() {
          const scope = this.scope;

          if (this.params.messageTemplate) {
            this.params.message = getTemplate(this.params.messageTemplate);
          }

          this.domElement = $(getTemplate(this.params.template));

          scope.dialog = _.extend(this, this.params);

          // Defer rendering to prevent positioning issues when firing dialogs
          // on page load
          defer(
            _.bind(function() {
              this.domElement.appendTo(this.params.attachTo);
              $compile(this.domElement)(scope);

              this.domElement.on('click', _.bind(this._closeOnBackground, this));
              this.open = true;

              // Make sure everything is rendered so that the dialog dimensions are
              // properly calculated
              scope.$apply();
              this._centerOnBackground();
              if (!this.params.disableAutoFocus) {
                if (this.domElement.find('input').length > 0) {
                  this.domElement
                    .find('input')
                    .eq(0)
                    .focus();
                } else {
                  $(':focus').blur();
                }
              }

              $($window).on('keyup', this._handleKeys);

              this.domElement.addClass('is-visible');
            }, this)
          );
        },

        reposition: function() {
          if (this.domElement) {
            const elem = this.domElement.find('.modal-dialog').first();
            const topOffset = Math.max(($window.innerHeight - elem.height()) / 2, 0);
            elem.css({ top: topOffset + 'px' });
          }
        },

        _centerOnBackground: function() {
          const elem = this.domElement.children('.modal-dialog');
          const reposition = this.reposition.bind(this);
          const debouncedReposition = debounce(reposition, 50);
          let destroyed = false;

          reposition();
          $($window).on('resize', debouncedReposition);

          const repositionOff = $rootScope.$on('centerOn:reposition', () => {
            if (!destroyed) {
              reposition();
            }
          });

          elem.on('$destroy', () => {
            destroyed = true;
            $($window).off('resize', debouncedReposition);
            repositionOff();
          });
        },

        _closeOnBackground: function(ev) {
          const target = $(ev.target);
          if (target.hasClass('modal-background') && this.params.backgroundClose) {
            this.cancel();
          }
        },

        _handleKeys: function(ev) {
          const dialog = this;
          dialog.scope.$apply(() => {
            if (ev.target.tagName.toLowerCase() === 'select') return;
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

        confirm: function(...args) {
          this._deferred.resolve.apply(this, args);
          this.destroy();
          removeFromOpened(this);
          return this;
        },

        cancel: function(...args) {
          this._deferred.reject.apply(this, args);
          this.destroy();
          removeFromOpened(this);
          return this;
        },

        destroy: function() {
          if (this._isDestroyed) {
            logger.logError('Cannot destroy modal dialog twice', {
              data: { template: this.params.template }
            });
            return;
          }
          this._isDestroyed = true;

          const self = this;
          $($window).off('keyup', this._handleKeys);
          function destroyModal() {
            if (self.domElement) {
              self.scope.$destroy();
              self.domElement.remove();
            }
            if (self.scope) self.scope.$destroy();
            self.domElement = self.scope = null;
            self.open = false;
          }
          this.domElement.removeClass('is-visible');
          $timeout(destroyModal, 250);
        }
      };

      return {
        open: openDialog,
        openConfirmDialog: openConfirmDialog,
        openConfirmDeleteDialog: openConfirmDeleteDialog,
        getOpened: getOpened,
        closeAll: closeAll,
        richtextLayout: richtextLayout
      };

      // Closes all modals with persistOnNaviagation = false
      function closeAll() {
        _.forEachRight(opened, dialog => {
          if (!dialog.persistOnNavigation) {
            dialog.cancel();
          }
        });
      }

      function getTemplate(nameOrTemplate) {
        const jstTemplate = JST[nameOrTemplate];
        return jstTemplate ? jstTemplate() : nameOrTemplate;
      }

      /**
       * @ngdoc method
       * @name modalDialog#open
       * @param {object} options
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
      function openDialog(params) {
        const dialog = new Dialog(params);
        dialog.attach();
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

        return openDialog(params).promise.then(
          () => ({
            confirmed: true,
            cancelled: false
          }),
          () => ({
            confirmed: false,
            cancelled: true
          })
        );
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
        const index = opened.indexOf(dialog);
        if (index > -1) {
          opened.splice(index, 1);
        }
      }

      /**
       * @ngdoc method
       * @name modalDialog#richtextLayout
       * @description
       * Generates HTML of a richtext dialog window.
       *
       * @param {string}  title
       * @param {string}  richtextContent  HTML of content area
       * @param {string}  controls         HTML of controls area
       * @returns {string}
       */
      function richtextLayout(title, richtextContent, controls) {
        return h('.modal-background', [
          h('.modal-dialog', [
            h('header.modal-dialog__header', [h('h1', [title])]),
            richtextContent &&
              h('.modal-dialog__content', [h('.modal-dialog__richtext', richtextContent)]),
            controls && h('.modal-dialog__controls', controls)
          ])
        ]);
      }
    }
  ]);
}
