import { registerDirective } from 'NgRegistry.es6';

export default function register() {
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
  registerDirective('cfSlugEditor', [
    () => ({
      restrict: 'E',
      scope: {},
      require: '^cfWidgetApi',
      template: JST['cf_slug_editor'](),
      controller: 'SlugEditorController'
    })
  ]);
}
