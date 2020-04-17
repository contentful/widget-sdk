import { registerDirective } from 'core/NgRegistry';

export default function register() {
  registerDirective('cfAppContainer', () => ({
    template: `
      <cf-persistent-notification role="banner"></cf-persistent-notification>
      <div ui-view="nav-bar"></div>
      <div ui-view="content" class="app-container__content"></div>
    `,
    restrict: 'E',
  }));
}
