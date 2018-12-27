import { registerService } from 'NgRegistry.es6';
import _ from 'lodash';
import { urlRegex } from 'utils/StringUtils.es6';

/**
 * This module translates between serialized validations that are send
 * to the backend and the front end validation views.
 */
registerService('validationViews', () => {
  /**
   * Map from validation types to input views.
   */
  const sizeViews = [
    { name: 'min-max', label: 'Between' },
    { name: 'min', label: 'At least' },
    { name: 'max', label: 'Not more than' }
  ];

  const views = {
    size: sizeViews,
    assetFileSize: sizeViews,
    range: [
      { name: 'min-max', label: 'Between' },
      { name: 'min', label: 'Greater or equal than' },
      { name: 'max', label: 'Less or equal than' }
    ],
    regexp: [
      { name: 'custom', label: 'Custom' },
      {
        name: 'email',
        label: 'E-Mail',
        pattern: /^\w[\w.-]*@([\w-]+\.)+[\w-]+$/.source
      },
      {
        name: 'url',
        label: 'URL',
        pattern: urlRegex.source
      },
      {
        name: 'date-us',
        label: 'Date (US)',
        pattern: /^(0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?\d\d$/.source
      },
      {
        name: 'date-eu',
        label: 'Date (European)',
        pattern: /^(0?[1-9]|[12][0-9]|3[01])[- /.](0?[1-9]|1[012])[- /.](19|20)?\d\d$/.source
      },
      {
        name: '12h-time',
        label: '12h Time',
        pattern: /^(0?[1-9]|1[012]):[0-5][0-9](:[0-5][0-9])?\s*[aApP][mM]$/.source
      },
      {
        name: '24h-time',
        label: '24h Time',
        pattern: /^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.source
      },
      {
        name: 'us-phone',
        label: 'US phone number',
        pattern: /^\d[ -.]?\(?\d\d\d\)?[ -.]?\d\d\d[ -.]?\d\d\d\d$/.source
      },
      {
        name: 'us-zip-code',
        label: 'US zip code',
        pattern: /^\d{5}$|^\d{5}-\d{4}$}/.source
      }
    ],
    assetImageDimensions: [
      { name: 'min', label: 'Minimum' },
      { name: 'max', label: 'Maximum' },
      { name: 'min-max', label: 'Between' },
      { name: 'exact', label: 'Exactly' }
    ]
  };

  function findViewByName(views, name) {
    return _.find(views, v => v.name === name);
  }

  /**
   * Adapt `validation.settings` to the validation's current view.
   */
  function updateSettings(validation) {
    const viewName = validation.currentView;
    const type = validation.type;
    if (type === 'size' || type === 'range' || type === 'assetFileSize') {
      if (viewName === 'min') {
        delete validation.settings.max;
      }
      if (viewName === 'max') {
        delete validation.settings.min;
      }
    } else if (validation.type === 'regexp') {
      const view = findViewByName(validation.views, viewName);
      if (view.pattern) {
        validation.settings = { pattern: view.pattern };
      }
    }
  }

  /**
   * Returns the name of a view appropriate for the current
   * validation settings.
   *
   * If the view could not be determined by the heuristics it
   * returns the validations current view.
   */
  function getInitialView(validation) {
    const type = validation.type;
    const settings = validation.settings;
    if (type === 'size' || type === 'range' || type === 'assetFileSize') {
      const hasMin = typeof settings.min === 'number';
      const hasMax = typeof settings.max === 'number';
      if (hasMin && hasMax) {
        return 'min-max';
      }
      if (hasMin) {
        return 'min';
      }
      if (hasMax) {
        return 'max';
      }
    } else if (type === 'regexp') {
      const view = _.find(validation.views, view => view.pattern === settings.pattern);
      if (view) {
        return view.name;
      } else {
        return 'custom';
      }
    }

    return validation.currentView;
  }

  return {
    get: function(type) {
      return views[type];
    },
    updateSettings: updateSettings,
    getInitial: getInitialView
  };
});
