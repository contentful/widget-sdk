'use strict';

angular
  .module('contentful')
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
  .directive('cfSlugEditor', [
    'require',
    require => {
      const _ = require('lodash');
      const slugUtils = require('slug');
      const moment = require('moment');
      const debounce = require('debounce');
      const InputUpdater = require('ui/inputUpdater');
      const K = require('utils/kefir.es6');

      return {
        restrict: 'E',
        scope: {},
        require: '^cfWidgetApi',
        template: JST['cf_slug_editor'](),
        link: (scope, $el, _attrs, widgetApi) => {
          const { field, entry, space, locales, contentType } = widgetApi;

          const $inputEl = $el.find('input');
          const updateInput = InputUpdater.create($inputEl.get(0));
          const titleField = entry.fields[contentType.displayField];

          // The most recent value of the title field.
          // It is used to check if the slug is currently tracking the
          // title when the title field changes its value.
          let trackingTitle;

          // we don't want to show our custom error about uniqueness
          // in case of the API error for it. We also cannot just get
          // rid of it, because it will break existing functionality --
          // live update on the uniqueness of the slug editor
          //
          // technically we can just not fetch anything in case of the slug
          // editor in the background, but it will make it too complicated
          scope.hasUniqueValidationError = false;

          const debouncedPerformDuplicityCheck = debounce(performDuplicityCheck, 500);

          const disabledBus = K.createStreamBus();
          const titleBus = K.createStreamBus();

          // we need to update slug values from title only after
          // field becomes not disabled (sharejs connected)
          const titleUpdate$ = K.combine([disabledBus.stream, titleBus.stream]).filter(
            ([disabled]) => disabled === false
          );

          K.onValueScope(scope, titleUpdate$, ([, title]) => {
            const slug = field.getValue();
            if (
              !_.isEmpty(trackingTitle) &&
              !_.isEmpty(slug) &&
              slug !== slugUtils.slugify(trackingTitle, field.locale)
            ) {
              // We don't want to overwrite the slug if the user has provided
              // a custom one.
              return;
            } else {
              const val = makeSlug(title);
              updateInput(val);
              field.setValue(val);
            }
          });

          const detachOnFieldDisabledHandler = field.onPermissionChanged(disabledStatus => {
            scope.isDisabled = !!disabledStatus.disabled;
            disabledBus.emit(!!disabledStatus.denied);
          });

          const offSchemaErrorsChanged = field.onSchemaErrorsChanged(errors => {
            if (errors) {
              scope.hasErrors = errors.length > 0;
              scope.hasUniqueValidationError = errors.some(
                error => error && error.name === 'unique'
              );
            }
          });

          const detachOnValueChangedHandler = field.onValueChanged(val => {
            val = val || '';
            updateInput(val);
          });

          // The content type’s display field might not exist.
          if (titleField) {
            const detachLocaleTitleChangeHandler = titleField.onValueChanged(
              field.locale,
              setTitle
            );
            scope.$on('$destroy', detachLocaleTitleChangeHandler);

            if (field.locale !== locales.default) {
              const detachDefaultLocaleTitleChangeHandler = titleField.onValueChanged(
                locales.default,
                titleValue => {
                  if (!titleField.getValue(field.locale)) {
                    setTitle(titleValue);
                  }
                }
              );
              scope.$on('$destroy', detachDefaultLocaleTitleChangeHandler);
            }
          }

          function setTitle(title) {
            if (isTracking()) {
              titleBus.emit(title);
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
          function isTracking() {
            const isPublished = entry.getSys().publishedVersion;
            const value = $inputEl.val();
            return !isPublished && (value === makeSlug(trackingTitle) || !value);
          }

          // remove attached handlers when element is evicted from dom
          scope.$on('$destroy', detachOnValueChangedHandler);
          scope.$on('$destroy', detachOnFieldDisabledHandler);
          scope.$on('$destroy', offSchemaErrorsChanged);

          scope.$watch('state', state => {
            field.setInvalid(state === 'duplicate');
          });

          scope.$watch(
            () => $inputEl.val(),
            val => {
              updateStateFromSlug(val);
              if (!scope.isDisabled) {
                field.setValue(val);
              }
            }
          );

          $inputEl.on(
            'input change',
            debounce(() => {
              scope.$apply();
            }, 200)
          );

          /**
           * Resets the slug's uniqueness state to 'checking' and requests
           * information about uniqueness from the server.
           */
          function updateStateFromSlug(val) {
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
          function performDuplicityCheck(value) {
            const req = {};

            if (value) {
              req['content_type'] = entry.getSys().contentType.sys.id;
              req['fields.' + field.id] = value;
              req['sys.id[ne]'] = entry.getSys().id;
              req['sys.publishedAt[exists]'] = true;
              space.getEntries(req).then(res => {
                scope.state = res.total !== 0 ? 'duplicate' : 'unique';
              });
            }
          }

          function makeSlug(title) {
            return title ? slugUtils.slugify(title, field.locale) : untitledSlug();
          }

          function untitledSlug() {
            const createdAt = entry.getSys().createdAt;
            const createdAtFormatted = moment.utc(createdAt).format('YYYY MM DD [at] hh mm ss');
            return slugUtils.slugify('Untitled entry ' + createdAtFormatted, 'en-US');
          }
        }
      };
    }
  ]);
