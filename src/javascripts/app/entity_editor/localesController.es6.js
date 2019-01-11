import { registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import React from 'react';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import LocaleSelectDialog from './LocaleSelectDialog.es6';

/**
 * @ngdoc type
 * @name LocalesController
 * @description
 * This controller provides an interface for changing the active
 * locales in `TheLocaleStore`.
 */
registerController('entityEditor/LocalesController', [
  'TheLocaleStore',
  function(localeStore) {
    const controller = this;
    const availableLocales = localeStore.getPrivateLocales();

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
    controller.changeActive = async function() {
      const locales = getLocalesWithActiveFlag(availableLocales);

      const onUpdate = locales => {
        const activeLocales = locales.filter(locale => locale.active);
        localeStore.setActiveLocales(activeLocales);
        refreshActiveLocales();
      };

      await ModalLauncher.open(({ onClose, isShown }) => (
        <LocaleSelectDialog
          initialLocales={locales}
          isShown={isShown}
          onClose={onClose}
          onUpdate={onUpdate}
        />
      ));
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
    controller.buildPillProps = locale => ({
      label: locale.code,
      onClose: !locale.default
        ? function() {
            controller.deactivate(locale);
          }
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
    function refreshActiveLocales() {
      controller.active = localeStore.getActiveLocales();
    }

    /**
     * Returns an array of copies of `locales` with an additional
     * `active` property.
     */
    function getLocalesWithActiveFlag(locales) {
      return _.map(locales, function(locale) {
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
