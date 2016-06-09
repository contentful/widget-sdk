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
      var titleField = entry.fields[contentType.displayField];

      // The most recent value of the title field.
      // It is used to check if the slug is currently tracking the
      // title when the title field changes it’s value.
      var trackingTitle;

      var debouncedPerformDuplicityCheck = debounce(performDuplicityCheck, 500);

      var detachOnFieldDisabledHandler = field.onDisabledStatusChanged(function (disabledStatus) {
        scope.isDisabled = disabledStatus;
      });

      var offSchemaErrorsChanged = field.onSchemaErrorsChanged(function (errors) {
        scope.hasErrors = errors && errors.length > 0;
      });

      var detachOnValueChangedHandler = field.onValueChanged(function (val) {
        if (val === undefined) {
          setSlugFromCurrentTitle();
        } else {
          val = val || '';
          updateInput(val);
        }
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

      // TODO remove this once `onValueChanged` is called immediately
      // on registering the callback
      setSlugFromCurrentTitle();


      function setTitle (title) {
        if (isTracking()) {
          updateInput(makeSlug(title));
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
        field.setString(val);
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


      // TODO remove this once `onValueChanged` is called immediately
      // on registering the callback
      function setSlugFromCurrentTitle () {
        var title = titleField.getValue(field.locale) || titleField.getValue();
        setTitle(title);
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
