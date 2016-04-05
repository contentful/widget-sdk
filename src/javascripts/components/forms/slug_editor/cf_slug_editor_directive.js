'use strict';

angular.module('contentful')
.directive('cfSlugEditor', ['$injector', function ($injector) {
  var slugUtils   = $injector.get('slug');
  var moment      = $injector.get('moment');
  var debounce    = $injector.get('debounce');
  var caretHelper = $injector.get('ui/caretHelper');

  return {
    restrict: 'E',
    scope: {},
    require: '^cfWidgetApi',
    template: JST['cf_slug_editor'](),
    link: function (scope, $el, attrs, widgetApi) {
      var field       = widgetApi.field;
      var entry       = widgetApi.entry;
      var space       = widgetApi.space;
      var locales     = widgetApi.locales;
      var contentType = widgetApi.contentType;

      var $inputEl    = $el.children('input');
      var updateInput = caretHelper.makeInputUpdater($inputEl);
      var title       = entry.fields[contentType.displayField];

      var debouncedPerformDuplicityCheck = debounce(performDuplicityCheck, 500);
      var useDefaultLocaleTitleForSlug = true;

      var detachOnSysChangeHandler = entry.onSysChanged(updateEntryData, true);
      var detachOnValueChangedHandler = field.onValueChanged(function (val) {
        // Might be `null` or `undefined` when value is not present
        val = val || '';
        updateInput(val);
        updateStateFromSlug(val);
      }, true);
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

      if (field.locale !== locales.default) {
        var detachDefaultLocaleTitleChangeHandler = title.onValueChanged(locales.default, function (title) {
          if (useDefaultLocaleTitleForSlug) {
            buildSlugUsingTitle(title);
          }
        });
        scope.$on('$destroy', detachDefaultLocaleTitleChangeHandler);
      }

      // remove attached handlers when element is evicted from dom
      scope.$on('$destroy', detachOnSysChangeHandler);
      scope.$on('$destroy', detachOnValueChangedHandler);
      scope.$on('$destroy', detachOnFieldDisabledHandler);
      scope.$on('$destroy', detachCurrentLocaleTitleChangeHandler);

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
          updateDivergedStatus(field.getValue());
          updateSlugFromTitle(title);
        }
      }

      function updateEntryData (sys) {
        scope.entry = {
          isPublished: !!sys.publishedVersion,
          id: sys.id,
          contentTypeId: sys.contentType.sys.id,
          createdAt: sys.createdAt
        };
      }

      function updateDisabledStatus (disabledStatus) {
        scope.isDisabled = disabledStatus;
        buildSlugUsingTitle(currentTitle());
      }

      function untitledSlug () {
        return slugUtils.slugify('Untitled entry ' + moment.utc(scope.entry.createdAt).format('YYYY MM DD [at] hh mm ss'), 'en-US');
      }

      /**
       * Checks if the slug and title have diverged, and stores
       * that in scope.hasDiverged.
       * If the slug is not the ID, and also not representative of the title,
       * then mark it as diverged.
       * If the entry is already published, then the slug should not be changed
       * automatically, hence that is also treated as divergence.
       */
      function updateDivergedStatus (value) {
        if (scope.entry.isPublished) {
          scope.hasDiverged = true;
        } else if (value &&
                   value !== untitledSlug() &&
                   value !== slugUtils.slugify(currentTitle(), field.locale)) {

          scope.hasDiverged = true;
        } else {
          scope.hasDiverged = false;
        }
      }

      /**
       * Resets the slug's uniqueness state to 'checking' and requests
       * information about uniqueness from the server.
       */
      function updateStateFromSlug (val) {
        delete scope.state;
        if (val) {
          scope.state = 'checking';
          debouncedPerformDuplicityCheck(val);
        }
        updateDivergedStatus(val);
      }

      /**
       * State machine for binding the slug to the entry's title. This
       * call is run whenever the title changes, and as long as the slug
       * has not already diverged:
       * 1. If no title is provided, the slug string is the entry's ID.
       * 2. If a title is provided, the slug is updated to match the current title.
       */
      function updateSlugFromTitle (currentTitle) {
        var slug;

        if (scope.hasDiverged) {
          return;
        }

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
          req['content_type'] = scope.entry.contentTypeId;
          req['fields.' + field.id] = value;
          req['sys.id[ne]'] = scope.entry.id;
          req['sys.publishedAt[exists]'] = true;
          space.getEntries(req).then(function (res) {
            scope.state = (res.total !== 0) ? 'duplicate' : 'unique';
          });
        }
      }
    }
  };
}]);
