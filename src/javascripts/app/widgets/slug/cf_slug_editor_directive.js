'use strict';

angular.module('contentful')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfSlugEditor
 *
 * A directive to create a slug editor. It is a usual editor, but
 * has one tricky point -- it has a custom check for the uniqueness,
 * but it is not enforced by the API (you can actually add uniqueness
 * constraint in the settings of the field in content type).
 * Because of this check, and due to the way we implement our error
 * streams, after initialization it erases initial error stream, and
 * in case of any API errors it becomes hidden after API request.
 *
 * Also, until publishing or until the title and slug mismatch occurs,
 * it tracks the title field and automatically adjusts its own text.
 * It means that in case of disabled field, it is not rendered, and
 * title text is not synced with the slug.
 *
 * In order to avoid that, we render this widget in the background,
 * so the value of the slug will be in sync with a title field.
 * Also, there is a field to track API errors for the uniqueness,
 * so we don't duplicate our API error and custom check inside this directive.
 */
.directive('cfSlugEditor', ['require', function (require) {
  var slugUtils = require('slug');
  var moment = require('moment');
  var debounce = require('debounce');
  var InputUpdater = require('ui/inputUpdater');

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
      var updateInput = InputUpdater.create($inputEl.get(0));
      var titleField = entry.fields[contentType.displayField];

      // The most recent value of the title field.
      // It is used to check if the slug is currently tracking the
      // title when the title field changes it’s value.
      var trackingTitle;

      // we don't want to show our custom error about uniqueness
      // in case of the API error for it. We also can not just get
      // rid of it, because it will break existing functionality --
      // live update on the uniqueness of the slug editor
      //
      // technically we can just not fetch anything in case of the slug
      // editor in the background, but it will make it too complicated
      scope.hasUniqueValidationError = false;

      var debouncedPerformDuplicityCheck = debounce(performDuplicityCheck, 500);

      var detachOnFieldDisabledHandler = field.onIsDisabledChanged(function (disabledStatus) {
        scope.isDisabled = disabledStatus;
      });

      var offSchemaErrorsChanged = field.onSchemaErrorsChanged(function (errors) {
        if (errors) {
          scope.hasErrors = errors.length > 0;
          scope.hasUniqueValidationError = errors.some(function (error) {
            return error && error.name === 'unique';
          });
        }
      });

      var detachOnValueChangedHandler = field.onValueChanged(function (val) {
        val = val || '';
        updateInput(val);
      });

      // The content type’s display field might not exist.
      if (titleField) {
        var detachLocaleTitleChangeHandler = titleField.onValueChanged(field.locale, setTitle);
        scope.$on('$destroy', detachLocaleTitleChangeHandler);

        if (field.locale !== locales.default) {
          var detachDefaultLocaleTitleChangeHandler = titleField.onValueChanged(locales.default, function (titleValue) {
            if (!titleField.getValue(field.locale)) {
              setTitle(titleValue);
            }
          });
          scope.$on('$destroy', detachDefaultLocaleTitleChangeHandler);
        }
      }

      function setTitle (title) {
        if (isTracking()) {
          var val = makeSlug(title);
          updateInput(val);
          field.setValue(val);
        }
        trackingTitle = title;
      }

      /**
       * Returns true if we should update the field value with a new
       * value build from a title
       *
       * `false` if the entry is published
       * `true` if the current value is empty
       * `true` if the current value was built from the previous title
       */
      function isTracking () {
        var isPublished = entry.getSys().publishedVersion;
        var value = $inputEl.val();
        return !isPublished && (value === makeSlug(trackingTitle) || !value);
      }

      // remove attached handlers when element is evicted from dom
      scope.$on('$destroy', detachOnValueChangedHandler);
      scope.$on('$destroy', detachOnFieldDisabledHandler);
      scope.$on('$destroy', offSchemaErrorsChanged);

      scope.$watch('state', function (state) {
        field.setInvalid(state === 'duplicate');
      });

      scope.$watch(function () {
        return $inputEl.val();
      }, function (val) {
        updateStateFromSlug(val);
        field.setValue(val);
      });

      $inputEl.on('input change', debounce(function () {
        scope.$apply();
      }, 200));


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

      function makeSlug (title) {
        return title
          ? slugUtils.slugify(title, field.locale)
          : untitledSlug();
      }

      function untitledSlug () {
        var createdAt = entry.getSys().createdAt;
        var createdAtFormatted =
          moment.utc(createdAt)
          .format('YYYY MM DD [at] hh mm ss');
        return slugUtils.slugify('Untitled entry ' + createdAtFormatted, 'en-US');
      }
    }
  };
}]);
