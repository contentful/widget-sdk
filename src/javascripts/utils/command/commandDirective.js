import { registerDirective } from 'core/NgRegistry';
import _ from 'lodash';

export default function register() {
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
   * [`command`] service.
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

   */
  registerDirective('uiCommand', [
    'uiCommandStateDirective',
    (uiCommandStateDirectives) => {
      const directive = uiCommandStateDirectives[0];

      return {
        restrict: 'A',
        scope: {
          command: '=uiCommand',
        },
        template: directive.template,
        link: function (scope, element) {
          directive.link(scope, element);

          element.on('click', () => {
            if (element.attr('aria-disabled') === 'true' || element.prop('disabled')) {
              return;
            }

            scope.$apply(() => {
              scope.command.execute();
            });
          });
        },
      };
    },
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
      command: '=uiCommandState',
    },

    template: function (element) {
      return element.html();
    },

    link: function (scope, element) {
      if (!element.attr('role')) {
        element.attr('role', 'button');
      }

      if (element.is('button') && !element.attr('type')) {
        element.attr('type', 'button');
      }

      scope.$watch('command.isAvailable()', (isAvailable) => {
        element.toggleClass('ng-hide', !isAvailable);
        setDisabled(scope.command.isDisabled());
      });

      scope.$watch('command.isDisabled()', setDisabled);

      scope.$watch('command.inProgress()', (inProgress) => {
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
    },
  }));
}
