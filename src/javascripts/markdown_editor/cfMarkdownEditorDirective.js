import React from 'react';
import { registerDirective } from 'NgRegistry';
import _ from 'lodash';
import throttle from 'lodash/throttle';
import * as K from 'utils/kefir';
import * as LazyLoader from 'utils/LazyLoader';
import { detect as detectBrowser } from 'detect-browser';
import { getVariation } from 'LaunchDarkly';
import { BREAK_IE11 } from 'featureFlags';

import TheLocaleStore from 'services/localeStore';
import { trackMarkdownEditorAction } from 'analytics/MarkdownEditorActions';
import { isRtlLocale } from 'utils/locales';
import makePreview from 'markdown_editor/PreviewGenerator';
import * as actions from 'markdown_editor/markdown_actions';
import * as MarkdownEditor from 'markdown_editor/markdown_editor';
import { Button, Tooltip, Icon } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

import markdownEditorTemplate from './templates/cf_markdown_editor.html';

function browserIsIE11() {
  return detectBrowser().name === 'ie';
}

const styles = {
  buttonIcon: css({
    marginTop: '8px'
  })
};

export default function register() {
  registerDirective('cfMarkdownEditor', [
    '$timeout',
    'spaceContext',
    ($timeout, spaceContext) => {
      const EDITOR_DIRECTIONS = {
        LTR: 'ltr',
        RTL: 'rtl'
      };

      return {
        restrict: 'E',
        template: markdownEditorTemplate,
        scope: {},
        require: '^cfWidgetApi',
        link: function(scope, el, _attrs, api) {
          const field = api.field;
          const textarea = el.find('textarea').get(0);
          const preview = el.find('.markdown-preview').first();
          let currentMode = 'md';
          let editor = null;
          let childEditor = null;

          // Markdown editor should't work in IE11
          if (browserIsIE11()) {
            getVariation(BREAK_IE11, {
              organizationId: spaceContext.getData('organization.sys.id'),
              spaceId: spaceContext.space.getId()
            }).then(enabled => {
              if (enabled) {
                scope.hasCrashed = true;
              }
            });
          }

          // eslint-disable-next-line
          scope.tooltipComponent = ({ isDisabled, isActive }) => (
            <Tooltip content="More actions…">
              <Button
                disabled={isDisabled}
                testId="markdown-more-actions"
                onClick={() => {
                  toggleMinorActions();
                  scope.$applyAsync();
                }}
                isActive={isActive}
                buttonType="naked"
                size="small">
                <Icon icon="MoreHorizontal" color="secondary" className={styles.buttonIcon} />
              </Button>
            </Tooltip>
          );

          // @todo find a better way of hiding header in Zen Mode
          const editorHeader = el
            .closest('.workbench-main')
            .siblings('.workbench-header')
            .first();

          scope.preview = {};
          scope.zen = false;
          scope.setMode = setMode;
          scope.inMode = inMode;
          scope.canEdit = canEdit;
          scope.toggleMinorActions = toggleMinorActions;

          // By default, the markdown editor should be displayed as LTR unless the
          // RTL support feature flag is enabled.
          scope.direction = EDITOR_DIRECTIONS.LTR;

          const constraints =
            _(field.validations)
              .map('size')
              .filter()
              .first() || {};

          scope.constraints = constraints;

          // simple bus that is used to synchronize between Zen Mode and main editor
          scope.zenApi = {
            syncToParent: syncFromChildToParent,
            registerChild: registerChildEditor,
            getParent: function() {
              return editor;
            },
            getLocale: _.constant(field.locale),
            toggle: toggleZenMode
          };

          initEditorOrRenderError();

          // No need to handle response:
          // 1. embedly integration is optional
          // 2. loading it even after elements are added to DOM works just fine
          LazyLoader.get('embedly');

          if (isRtlLocale(field.locale)) {
            scope.isReady = false;
            scope.direction = EDITOR_DIRECTIONS.RTL;
            initEditorOrRenderError();
          }

          function toggleMinorActions() {
            const { minorActionsShown, zen } = scope;
            const newMinorActionsShown = !minorActionsShown;
            trackMarkdownEditorAction('toggleMinorActions', {
              fullscreen: zen,
              newValue: newMinorActionsShown
            });
            scope.minorActionsShown = newMinorActionsShown;
          }

          function initEditorOrRenderError() {
            // offloading initialization of the MD editor from the main thread
            window.requestAnimationFrame(() => {
              try {
                initEditor();
              } catch (e) {
                scope.hasCrashed = true;
              }
            });
          }

          function initEditor() {
            const isReinit = !!editor;
            if (isReinit) {
              editor.destroy();
            }
            editor = MarkdownEditor.create(textarea, {
              direction: scope.direction
            });
            const defaultLocale = TheLocaleStore.getDefaultLocale();

            const locales = TheLocaleStore.getLocales();
            const locale = locales.find(locale => locale.code === field.locale);
            scope.actions = actions.create(editor, locale, defaultLocale.code, { zen: false });
            scope.history = editor.history;

            const preview$ = makePreview(field.value$);
            K.onValueScope(scope, preview$, updatePreview);

            editor.events.onChange(throttle(handleEditorChange, 200, { leading: false }));

            scope.isReady = true;

            editor.events.onPaste(editor => {
              const characterCountSelection = window.getSelection().toString().length;
              const characterCountBefore = editor.getValue().length;
              setTimeout(() => {
                const characterCountAfter = editor.getValue().length;
                trackMarkdownEditorAction('paste', {
                  characterCountAfter,
                  characterCountBefore,
                  characterCountSelection,
                  fullscreen: scope.zen
                });
              });
            });

            if (!isReinit) {
              setupDestructorJobs();
            }
          }

          function setupDestructorJobs() {
            const detachValueHandler = field.onValueChanged(handleFieldChange);
            const detachStateHandler = field.onIsDisabledChanged(handleStateChange);
            scope.$on('$destroy', () => {
              detachValueHandler();
              detachStateHandler();
              editor.destroy();
            });
          }

          function handleEditorChange(value) {
            // do not emit initial value
            // @todo maybe handle it in `setValue`
            if (value !== field.getValue()) {
              field.setValue(value);
            }
          }

          function handleFieldChange(value) {
            editor.setContent(value);
            if (scope.zen && childEditor) {
              childEditor.setContent(value);
            }
          }

          function handleStateChange(isDisabled) {
            // to avoid unwanted flips to the editor mode
            // we ignore if the value has not changed
            if (scope.isDisabled === isDisabled) {
              return;
            }
            scope.isDisabled = isDisabled;
            if (isDisabled) {
              setMode('preview');
              if (scope.zen) {
                scope.zenApi.toggle();
              }
            } else {
              setMode('md');
            }
          }

          /**
           * Receives the content of the preview property and applies it to
           * the scope. It is used by the `cfMarkdownPriewview` directive
           * and generated by the `PreviewGenerator` module.
           */
          function updatePreview(data) {
            if (data.error) {
              scope.preview.hasCrashed = true;
            } else if (data.preview) {
              scope.preview = _.assign(
                {
                  field: scope.field
                },
                data.preview
              );
            }
          }

          function inMode(mode) {
            return currentMode === mode;
          }

          function canEdit() {
            return inMode('md') && !scope.isDisabled;
          }

          function setMode(mode) {
            const areas = el.find('.markdown-areas');

            // change mode
            let nextMode = 'preview';
            if (mode === 'md' && !scope.isDisabled) {
              nextMode = 'md';
            }

            if (nextMode === currentMode) {
              if (currentMode === 'md') {
                setAutoHeight();
              }
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

            function setAutoHeight() {
              $timeout(() => {
                areas.height('auto');
              });
            }
          }

          function syncFromChildToParent(value) {
            // it only changes field value
            // main editor will be updated when leaving Zen Mode
            if (childEditor) {
              field.setValue(value);
            }
          }

          function registerChildEditor(editor) {
            childEditor = editor;
            childEditor.setContent(field.getValue());
          }

          function toggleZenMode() {
            const newZen = !scope.zen;
            scope.zen = newZen;
            trackMarkdownEditorAction('toggleFullscreenMode', {
              fullscreen: !newZen,
              newValue: newZen
            });

            if (scope.zen) {
              // hide leftovers from the previous screen
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
    }
  ]);
}
