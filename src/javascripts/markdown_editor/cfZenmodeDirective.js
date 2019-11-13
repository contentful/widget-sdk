import { registerDirective } from 'NgRegistry';
import $ from 'jquery';
import keycodes from 'utils/keycodes';
import window from 'utils/ngCompat/window';

import TheLocaleStore from 'services/localeStore';
import * as actions from 'markdown_editor/markdown_actions';
import * as MarkdownEditor from 'markdown_editor/markdown_editor';

export default function register() {
  registerDirective('cfZenmode', [
    'modalDialog',
    modalDialog => {
      const win = $(window);

      // This is persisted accross Zen Mode instances
      let initialShowPreview = true;

      return {
        restrict: 'E',
        template: JST['cf_zenmode'](),
        scope: {
          zenApi: '=',
          preview: '=',
          direction: '='
        },
        link: function(scope, el) {
          const textarea = el.find('textarea').get(0);
          const preview = el.find('.markdown-preview').first();
          let editor = null;
          const opts = {
            height: '100%',
            fixedHeight: true,
            direction: scope.direction
          };
          const containers = {
            editor: el.find('.zenmode-editor').first(),
            preview: el.find('.zenmode-preview').first()
          };

          scope.showPreview = show => {
            scope.isPreviewActive = show;
            initialShowPreview = show;
          };

          scope.showPreview(initialShowPreview);

          scope.$watch('isPreviewActive', active => {
            if (active) {
              containers.editor.css('width', '50%');
              containers.preview.css('width', '50%');
            } else {
              containers.editor.css('width', '100%');
              containers.preview.css('width', '0%');
            }
          });

          initEditor(MarkdownEditor.create(textarea, opts));

          function initEditor(editorInstance) {
            editor = editorInstance;
            const defaultLocale = TheLocaleStore.getDefaultLocale();

            const locales = TheLocaleStore.getLocales();
            const fieldLocaleCode = scope.zenApi.getLocale();
            const locale = locales.find(locale => locale.code === fieldLocaleCode);

            scope.actions = actions.create(editor, locale, defaultLocale.code, { zen: true });
            scope.history = editor.history;

            scope.zenApi.registerChild(editorInstance);
            tieChildEditor();

            editor.events.onChange(scope.zenApi.syncToParent);
            editor.events.onScroll(handleScroll);
            win.on('keyup', handleEsc);

            scope.$on('$destroy', () => {
              tieParentEditor();
              win.off('keyup', handleEsc);
              editor.destroy();
            });
          }

          function tieChildEditor() {
            const parent = scope.zenApi.getParent();
            parent.tie.editorToEditor(editor);
          }

          function tieParentEditor() {
            editor.tie.editorToEditor(scope.zenApi.getParent());
          }

          function handleScroll() {
            editor.tie.previewToEditor(preview);
          }

          function handleEsc(e) {
            if (modalDialog.getOpened().length < 1 && e.keyCode === keycodes.ESC) {
              scope.zenApi.toggle();
            }
          }
        }
      };
    }
  ]);
}
