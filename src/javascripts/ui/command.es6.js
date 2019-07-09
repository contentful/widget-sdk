import { registerFactory, registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';

export default function register() {
  /**
   * @ngdoc service
   * @module cf.ui
   * @name command
   *
   * @usage[js]
   * var cmd = create(function () {
   *   var promise = saveData()
   *   return promise
   * }, {
   *   available: function () {
   *     return permissions.canSaveData()
   *   },
   *   disabled: function () {
   *     return false;
   *   }
   * })
   */
  registerFactory('command', [
    '$q',
    $q => {
      /**
       * @ngdoc method
       * @module cf.ui
       * @name command#create
       *
       * @param {() => Promise<void>} run
       * @param {object} options
       * @param {() => boolean} options.available
       * @param {object} extension
       *
       * @returns {Command}
       */
      function createCommand(run, options, extension) {
        const command = new Command(run, options);
        return _.extend(command, extension);
      }

      /**
       * @ngdoc type
       * @module cf.ui
       * @name Command
       */
      function Command(run, opts) {
        if (!_.isFunction(run)) {
          throw new Error('Expected a function');
        }
        this._run = run;

        opts = _.defaults(opts || {}, {
          available: _.constant(true),
          disabled: _.constant(false),
          restricted: _.constant(false)
        });

        this.isAvailable = opts.available;
        this._isDisabled = opts.disabled;
        this._isRestricted = opts.restricted;
      }

      /**
       * @ngdoc method
       * @module cf.ui
       * @name Command#execute
       * @returns {Promise<void>}
       */
      Command.prototype.execute = function() {
        // TODO Reject if disabled

        if (this._inProgress) {
          return this._inProgress;
        }

        const self = this;
        const handleInProgress = () => {
          self._inProgress = null;
        };

        this._inProgress = (this._run() || $q.reject()).then(handleInProgress, handleInProgress);

        return this._inProgress;
      };

      /**
       * @ngdoc method
       * @module cf.ui
       * @name Command#isDisabled
       * @description
       * Returns `true` if either the command was set to disabled, it is
       * currently in progress or it is not available.
       *
       * @returns {boolean}
       */

      Command.prototype.inProgress = function() {
        return !!this._inProgress;
      };

      Command.prototype.isDisabled = function() {
        return !!(this._isDisabled() || this._inProgress || !this.isAvailable());
      };

      Command.prototype.isRestricted = function() {
        return this._isRestricted();
      };

      return {
        create: createCommand
      };
    }
  ]);

  /**
   * @ngdoc directive
   * @module cf.ui
   * @name uiCommand
   *
   * @usage[jade]
   * button(ui-command="mycommand") Run My Command
   *
   * @description
   * Links a `Command` instance to UI element. To create commands use the
   * [`command`][ui/command] service.
   *
   * The attribute value specifies the property name of the command on
   * the scope.
   *
   * - The element will be shown if and only if `command.isAvailable()` is
   *   true.
   * - The element will be set to disabled if and only if
   *   `command.isDisabled()` is true. This means that the
   *   `aria-disabled` property will be set to true if disabled and
   *   removed otherwise. For buttons the `disabled` property will also
   *   be sec accordingly.
   * - The `command.execute()` method will be called when the element is
   *   clicked.
   * - The `is-loading` class will be added when the
   *   `command.inProgress()` returns true.
   *
   * [ui/command]: api/cf.ui/service/command
   */
  registerDirective('uiCommand', [
    'uiCommandStateDirective',
    uiCommandStateDirectives => {
      const directive = uiCommandStateDirectives[0];

      return {
        restrict: 'A',
        scope: {
          command: '=uiCommand'
        },
        template: directive.template,
        link: function(scope, element) {
          directive.link(scope, element);

          element.on('click', () => {
            if (element.attr('aria-disabled') === 'true' || element.prop('disabled')) {
              return;
            }

            scope.$apply(() => {
              scope.command.execute();
            });
          });
        }
      };
    }
  ]);

  /**
   * @ngdoc directive
   * @module cf.ui
   * @name uiCommandState
   *
   * @usage[jade]
   * button(ui-command-state="mycommand")
   *   | Looks like my command
   *
   * @description
   * This works similarly to the `uiCommand` directive except that it
   * does not execute the command when clicked.
   *
   * This directive is currently only intended as a hack and only used in context menus.
   */
  registerDirective('uiCommandState', () => ({
    restrict: 'A',

    scope: {
      command: '=uiCommandState'
    },

    template: function(element) {
      return element.html();
    },

    link: function(scope, element) {
      if (!element.attr('role')) {
        element.attr('role', 'button');
      }

      if (element.is('button') && !element.attr('type')) {
        element.attr('type', 'button');
      }

      scope.$watch('command.isAvailable()', isAvailable => {
        element.toggleClass('ng-hide', !isAvailable);
        setDisabled(scope.command.isDisabled());
      });

      scope.$watch('command.isDisabled()', setDisabled);

      scope.$watch('command.inProgress()', inProgress => {
        element.toggleClass('is-loading', inProgress);
        if (inProgress) {
          element.attr('aria-busy', 'true');
        } else {
          element.removeAttr('aria-busy');
        }
      });

      function setDisabled(isDisabled) {
        if (element.is('button')) {
          element.prop('disabled', isDisabled);
        }

        if (isDisabled) {
          element.attr('aria-disabled', 'true');
        } else {
          element.removeAttr('aria-disabled');
        }
      }
    }
  }));
}
