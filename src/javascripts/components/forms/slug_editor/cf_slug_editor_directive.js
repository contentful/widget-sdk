'use strict';

angular.module('contentful')
.directive('cfSlugEditor', ['$injector', function ($injector) {
  var slugUtils = $injector.get('slug');
  var moment = $injector.get('moment');
  var debounce = $injector.get('debounce');
  var caretHelper = $injector.get('ui/caretHelper');

  return {
    restrict: 'E',
    scope: {},
    require: '^cfWidgetApi',
    template: JST['cf_slug_editor'](),
    link: function (scope, $el, _attrs, widgetApi) {
      var field = widgetApi.field;
      var entry = widgetApi.entry;
      var space = widgetApi.space;
      var locales = widgetApi.locales;
      var contentType = widgetApi.contentType;

      var $inputEl = $el.find('input');
      var updateInput = caretHelper.makeInputUpdater($inputEl);
      var title = entry.fields[contentType.displayField];

      var debouncedPerformDuplicityCheck = debounce(performDuplicityCheck, 500);

      var useDefaultLocaleTitleForSlug = true;

      // Is set to false when entry is published or the initial slug is
      // not the slugified version of the title.
      var updateFromTitle = true;

      var detachOnValueChangedHandler = field.onValueChanged(function (val) {
        // Might be `null` or `undefined` when value is not present
        val = val || '';
        updateInput(val);
      });
      // call handler when the disabled status of the field changes
      var detachOnFieldDisabledHandler = field.onDisabledStatusChanged(updateDisabledStatus);
      var detachCurrentLocaleTitleChangeHandler = title.onValueChanged(field.locale, function (titleField) {
        if (!titleField) {
          useDefaultLocaleTitleForSlug = true;

          if (field.locale !== locales.default) {
            titleField = title.getValue(); // get value for entry title in default locale
          }
        } else {
          useDefaultLocaleTitleForSlug = false;
        }

        buildSlugUsingTitle(titleField);
      });

      var offSchemaErrorsChanged = field.onSchemaErrorsChanged(function (errors) {
        scope.hasErrors = errors && errors.length > 0;
      });

      if (field.locale !== locales.default) {
        var detachDefaultLocaleTitleChangeHandler = title.onValueChanged(locales.default, function (title) {
          if (useDefaultLocaleTitleForSlug) {
            buildSlugUsingTitle(title);
          }
        });
        scope.$on('$destroy', detachDefaultLocaleTitleChangeHandler);
      }

      // remove attached handlers when element is evicted from dom
      scope.$on('$destroy', detachOnValueChangedHandler);
      scope.$on('$destroy', detachOnFieldDisabledHandler);
      scope.$on('$destroy', detachCurrentLocaleTitleChangeHandler);
      scope.$on('$destroy', offSchemaErrorsChanged);

      scope.$watch('state', function (state) {
        field.setInvalid(state === 'duplicate');
      });

      scope.$watch(function () {
        return $inputEl.val();
      }, function (val) {
        updateStateFromSlug(val);
        field.setString(val);
      });

      $inputEl.on('input change', debounce(function () {
        scope.$apply();
      }, 200));

      function buildSlugUsingTitle (title) {
        if (!scope.isDisabled) {
          updateFrozenState(field.getValue());
          updateSlugFromTitle(title);
        }
      }

      function updateDisabledStatus (disabledStatus) {
        scope.isDisabled = disabledStatus;
        buildSlugUsingTitle(currentTitle());
      }

      function untitledSlug () {
        var createdAt = entry.getSys().createdAt;
        var createdAtFormatted =
          moment.utc(createdAt)
          .format('YYYY MM DD [at] hh mm ss');
        return slugUtils.slugify('Untitled entry ' + createdAtFormatted, 'en-US');
      }

      function updateFrozenState (value) {
        if (entry.getSys().publishedVersion) {
          updateFromTitle = false;
        } else if (value &&
                   value !== untitledSlug() &&
                   value !== slugUtils.slugify(currentTitle(), field.locale)) {

          updateFromTitle = false;
        } else {
          updateFromTitle = true;
        }
      }

      /**
       * Resets the slug's uniqueness state to 'checking' and requests
       * information about uniqueness from the server.
       */
      function updateStateFromSlug (val) {
        if (val) {
          scope.state = 'checking';
          debouncedPerformDuplicityCheck(val);
        } else {
          scope.state = null;
        }
        updateFrozenState(val);
      }

      /**
       * State machine for binding the slug to the entry's title. This
       * call is run whenever the title changes, and as long as the slug
       * has not already diverged:
       * 1. If no title is provided, the slug string is the entry's ID.
       * 2. If a title is provided, the slug is updated to match the current title.
       */
      function updateSlugFromTitle (currentTitle) {
        if (!updateFromTitle) {
          return;
        }

        var slug;
        if (!currentTitle) {
          slug = untitledSlug();
        } else {
          slug = slugUtils.slugify(currentTitle, field.locale);
        }

        field.setString(slug);
        $inputEl.val(slug);
      }

      /**
       * Returns the title of the entry in the current scope. If a title in the
       * current locale is unavailable, the default locale is tried. If no
       * title exists, null is returned.
       */
      function currentTitle () {
        return title.getValue(field.locale) || title.getValue();
      }

      /**
       * Check the uniqueness of the slug in the current space.
       * The slug is unique if there is no published entry other than the
       * current one, with the same slug.
       * TODO: Currently for searches, we use the API Name of the field,
       * but this is an anti-pattern and will likely change in the future.
       */
      function performDuplicityCheck (value) {
        var req = {};

        if (value) {
          req['content_type'] = entry.getSys().contentType.sys.id;
          req['fields.' + field.id] = value;
          req['sys.id[ne]'] = entry.getSys().id;
          req['sys.publishedAt[exists]'] = true;
          space.getEntries(req).then(function (res) {
            scope.state = (res.total !== 0) ? 'duplicate' : 'unique';
          });
        }
      }
    }
  };
}]);
