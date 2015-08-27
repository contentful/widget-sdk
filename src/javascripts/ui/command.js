'use strict';

angular.module('cf.ui')

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
.factory('command', ['$injector', function ($injector) {
  var createSignal = $injector.get('signal');
  var $q = $injector.get('$q');

  /**
   * @ngdoc property
   * @name command#executions
   * @description
   * This signal is dispatched when ever a command is executed.
   *
   * It receives the command and the action promise as parameters.
   *
   * @type Signal<Command, Promise<any>>
   */
  var executions = createSignal();

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
    var command = new Command(run, options, executions);
    return _.extend(command, extension);
  }

  /**
   * @ngdoc type
   * @module cf.ui
   * @name Command
   */
  function Command (run, opts, executions) {
    if (!_.isFunction(run)) {
      throw new Error('Expected a function');
    }
    this._run = run;
    this._executions = executions;

    opts = _.defaults(opts || {}, {
      available: _.constant(true),
      disabled: _.constant(false),
    });

    this.isAvailable = opts.available;
    this._isDisabled = opts.disabled;
  }

  /**
   * @ngdoc method
   * @module cf.ui
   * @name Command#execute
   * @returns {Promise<void>}
   */
  Command.prototype.execute = function () {
    if (this._inProgress) {
      return this._inProgress;
    }

    var self = this;
    this._inProgress = (this._run() || $q.reject())
    .finally(function () {
      self._inProgress = null;
    });

    if (this._executions) {
      this._executions.dispatch(this, this._inProgress);
    }

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
  Command.prototype.isDisabled = function () {
    return !!(this._isDisabled() || this._inProgress || !this.isAvailable());
  };

  return {
    create: createCommand,
    executions: executions
  };
}])

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
 *   `command.isDisabled()` is true.
 * - The `command.execute()` method will be called when the element is
 *   clicked.
 *
 * [ui/command]: api/cf.ui/service/command
 */
.directive('uiCommand', [function () {
  return {
    restrict: 'A',
    transclude: true,
    scope: {
      command: '=uiCommand'
    },
    link: function (scope, element, attrs, ctrl, transclude) {
      var content = transclude(scope);
      element.append(content);

      if (!scope.command) {
        throw new Error('uiCommand directive requires a command');
      }

      if (element.is('button') && !element.attr('type')) {
        element.attr('type', 'button');
      }

      element.on('click', function () {
        scope.$apply(function () {
          scope.command.execute();
        });
      });


      scope.$watch('command.isAvailable()', function (isAvailable) {
        element.toggleClass('ng-hide', !isAvailable);
      });

      scope.$watch('command.isDisabled()', function (isDisabled) {
        element.prop('disabled', isDisabled);
      });

    }
  };
}]);
