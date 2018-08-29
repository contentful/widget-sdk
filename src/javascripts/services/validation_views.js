'use strict';

/**
 * This module translates between serialized validations that are send
 * to the backend and the front end validation views.
 */
angular.module('contentful').service('validationViews', [
  'require',
  require => {
    var urlRegexp = require('urlUtils').regexp;

    /**
     * Map from validation types to input views.
     */
    var sizeViews = [
      { name: 'min-max', label: 'Between' },
      { name: 'min', label: 'At least' },
      { name: 'max', label: 'Not more than' }
    ];

    var views = {
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
          pattern: urlRegexp.source
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
      var viewName = validation.currentView;
      var type = validation.type;
      if (type === 'size' || type === 'range' || type === 'assetFileSize') {
        if (viewName === 'min') {
          delete validation.settings.max;
        }
        if (viewName === 'max') {
          delete validation.settings.min;
        }
      } else if (validation.type === 'regexp') {
        var view = findViewByName(validation.views, viewName);
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
      var type = validation.type;
      var settings = validation.settings;
      if (type === 'size' || type === 'range' || type === 'assetFileSize') {
        var hasMin = typeof settings.min === 'number';
        var hasMax = typeof settings.max === 'number';
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
        var view = _.find(validation.views, view => view.pattern === settings.pattern);
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
  }
]);
