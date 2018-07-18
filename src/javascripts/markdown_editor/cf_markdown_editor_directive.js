'use strict';

angular.module('contentful').directive('cfMarkdownEditor', ['require', require => {
  var RTL_SUPPORT_FEATURE_FLAG =
    'feature-at-03-2018-rtl-support';
  var EDITOR_DIRECTIONS = {
    LTR: 'ltr',
    RTL: 'rtl'
  };

  var $timeout = require('$timeout');
  var LazyLoader = require('LazyLoader');
  var MarkdownEditor = require('markdown_editor/markdown_editor');
  var actions = require('markdown_editor/markdown_actions');
  var makePreview = require('markdown_editor/PreviewGenerator').default;
  var notification = require('notification');
  var throttle = require('throttle');
  var LocaleStore = require('TheLocaleStore');
  var isRtlLocale = require('utils/locales').isRtlLocale;
  var K = require('utils/kefir');
  var LD = require('utils/LaunchDarkly');
  var Analytics = require('analytics/Analytics');

  return {
    restrict: 'E',
    template: JST['cf_markdown_editor'](),
    scope: {},
    require: '^cfWidgetApi',
    link: function (scope, el, _attrs, api) {
      var field = api.field;
      var textarea = el.find('textarea').get(0);
      var preview = el.find('.markdown-preview').first();
      var currentMode = 'md';
      var editor = null;
      var childEditor = null;

      // @todo find a better way of hiding header in Zen Mode
      var editorHeader = el.closest('.workbench-main').siblings('.workbench-header').first();

      scope.preview = {};
      scope.zen = false;
      scope.setMode = setMode;
      scope.inMode = inMode;
      scope.canEdit = canEdit;
      scope.toggleMinorActions = toggleMinorActions;

      // By default, the markdown editor should be displayed as LTR unless the
      // RTL support feature flag is enabled.
      scope.direction = EDITOR_DIRECTIONS.LTR;

      var constraints = _(field.validations).map('size').filter().first() || {};

      scope.constraints = constraints;

      // simple bus that is used to synchronize between Zen Mode and main editor
      scope.zenApi = {
        syncToParent: syncFromChildToParent,
        registerChild: registerChildEditor,
        getParent: function () { return editor; },
        getLocale: _.constant(field.locale),
        toggle: toggleZenMode
      };

      initEditorOrRenderError();

      // No need to handle response:
      // 1. embedly integration is optional
      // 2. loading it even after elements are added to DOM works just fine
      LazyLoader.get('embedly');

      LD.onFeatureFlag(scope, RTL_SUPPORT_FEATURE_FLAG, isEnabled => {
        if (isEnabled && isRtlLocale(field.locale)) {
          scope.isReady = false;
          scope.direction = EDITOR_DIRECTIONS.RTL;
          initEditorOrRenderError();
        }
      });

      function toggleMinorActions () {
        const { minorActionsShown, zen } = scope;
        const newMinorActionsShown = !minorActionsShown;
        Analytics.track(
          'markdown_editor:action',
          {
            action: 'toggleMinorActions',
            new_value: newMinorActionsShown,
            zen: !!zen
          }
        );
        scope.minorActionsShown = newMinorActionsShown;
      }

      function initEditorOrRenderError () {
        try {
          initEditor();
        } catch (e) {
          scope.hasCrashed = true;
        }
      }

      function initEditor () {
        var isReinit = !!editor;
        if (isReinit) {
          editor.destroy();
        }
        editor = MarkdownEditor.create(textarea, {
          direction: scope.direction
        });
        var defaultLocale = LocaleStore.getDefaultLocale();

        var locales = LocaleStore.getLocales();
        var locale = locales.find(locale => locale.code === field.locale);
        scope.actions = actions.create(editor, locale, defaultLocale.code, {zen: false});
        scope.history = editor.history;

        var preview$ = makePreview(field.value$);
        K.onValueScope(scope, preview$, updatePreview);

        editor.events.onChange(throttle(handleEditorChange, 200, {leading: false}));

        scope.isReady = true;

        if (!isReinit) {
          setupDestructorJobs();
        }
      }

      function setupDestructorJobs () {
        var detachValueHandler = field.onValueChanged(handleFieldChange);
        var detachStateHandler = field.onIsDisabledChanged(handleStateChange);
        scope.$on('$destroy', () => {
          detachValueHandler();
          detachStateHandler();
          editor.destroy();
        });
      }

      function handleEditorChange (value) {
        // do not emit initial value
        // @todo maybe handle it in `setValue`
        if (value !== field.getValue()) {
          field.setValue(value);
        }
      }

      function handleFieldChange (value) {
        editor.setContent(value);
        if (scope.zen && childEditor) {
          childEditor.setContent(value);
        }
      }

      function handleStateChange (isDisabled) {
        scope.isDisabled = isDisabled;
        if (isDisabled) {
          setMode('preview');
          if (scope.zen) { scope.zenApi.toggle(); }
        } else {
          setMode('md');
        }
      }

      /**
       * Receives the content of the preview property and applies it to
       * the scope. It is used by the `cfMarkdownPriewview` directive
       * and generated by the `PreviewGenerator` module.
       */
      function updatePreview (data) {
        if (data.error) {
          scope.preview.hasCrashed = true;
        } else if (data.preview) {
          scope.preview = _.assign({
            field: scope.field
          }, data.preview);
        }
      }

      function inMode (mode) {
        return currentMode === mode;
      }

      function canEdit () {
        return inMode('md') && !scope.isDisabled;
      }

      function setMode (mode) {
        var areas = el.find('.markdown-areas');

        // change mode
        var nextMode = 'preview';
        if (mode === 'md' && !scope.isDisabled) {
          nextMode = 'md';
        }

        if (nextMode === currentMode) {
          if (currentMode === 'md') { setAutoHeight(); }
          return;
        } else {
          currentMode = nextMode;
        }

        // when going to preview mode,tie preview position with editor
        if (currentMode === 'preview') {
          editor.tie.previewToEditor(preview);
        }

        // when in Markdown mode:
        if (currentMode === 'md') {
          // tie editor position with preview
          editor.tie.editorToPreview(preview);
          // set height to "auto" to allow auto-expanding
          setAutoHeight();
        }

        function setAutoHeight () {
          $timeout(() => {
            areas.height('auto');
          });
        }
      }

      function syncFromChildToParent (value) {
        // it only changes field value
        // main editor will be updated when leaving Zen Mode
        if (childEditor) { field.setValue(value); }
      }

      function registerChildEditor (editor) {
        childEditor = editor;
        childEditor.setContent(field.getValue());
      }

      function toggleZenMode () {
        const newZen = !scope.zen;
        scope.zen = newZen;
        Analytics.track(
          'markdown_editor:action',
          {
            action: 'toggleZenMode',
            new_value: newZen,
            zen: !newZen
          }
        );

        if (scope.zen) {
          // hide leftovers from the previous screen
          notification.clear();
          editorHeader.hide();
        } else {
          // leaving Zen Mode - update main editor
          editor.setContent(field.getValue());
          // show editor header again
          editorHeader.show();
        }
      }
    }
  };
}]);
