'use strict';

angular
  .module('contentful')
  /**
   * @ngdoc type
   * @name LocalesController
   * @description
   * This controller provides an interface for changing the active
   * locales in `TheLocaleStore`.
   */
  .controller('entityEditor/LocalesController', [
    'require',
    function (require) {
      var localeStore = require('TheLocaleStore');
      var modalDialog = require('modalDialog');

      var controller = this;
      var availableLocales = localeStore.getPrivateLocales();

      refreshActiveLocales();

      /**
       * @ngdoc property
       * @name LocalesController#changeActive
       * @type {Command}
       *
       * @description
       * Executing this command will open a dialog that allows the user to
       * select the active locales.
       */
      controller.changeActive = function () {
        var locales = getLocalesWithActiveFlag(availableLocales);
        modalDialog
          .open({
            template: 'locale_select_dialog',
            noBackgroundClose: true,
            scopeData: {
              locales: locales
            }
          })
          .promise.then(function () {
            var active = _.filter(locales, 'active');
            localeStore.setActiveLocales(active);
            refreshActiveLocales();
          });
      };

      /**
       * @ngdoc method
       * @name LocalesController#deactivate
       *
       * @param {API.Locale} locale
       */
      controller.deactivate = locale => {
        localeStore.deactivateLocale(locale);
        refreshActiveLocales();
      };

      /**
       * @ngdoc method
       * @name LocalesController#buildPillProps
       *
       * @param {API.Locale} locale
       */
      controller.buildPillProps = (locale) => ({
        label: locale.code,
        onClose: !locale.default
          ? function () { controller.deactivate(locale); }
          : undefined
      });

      /**
       * @ngdoc method
       * @name LocalesController#buildChangeLocaleProps
       *
       */
      controller.buildChangeLocaleProps = () => ({
        children: 'Change',
        onClick: controller.changeActive,
        extraClassNames: 'btn-link',
        testId: 'change-translation'
      });

      /**
       * @ngdoc property
       * @name LocalesController#active
       * @type {API.Locale[]}
       */
      function refreshActiveLocales () {
        controller.active = localeStore.getActiveLocales();
      }

      /**
       * Returns an array of copies of `locales` with an additional
       * `active` property.
       */
      function getLocalesWithActiveFlag (locales) {
        return _.map(locales, function (locale) {
          return _.extend(
            {
              active: localeStore.isLocaleActive(locale)
            },
            locale
          );
        });
      }
    }
  ]);
