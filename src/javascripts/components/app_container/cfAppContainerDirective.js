import { registerDirective } from 'NgRegistry';
import { h } from 'utils/legacy-html-hyperscript';

function appContainerTemplateDef() {
  return [
    h('cf-persistent-notification', {
      role: 'banner'
    }),
    h('div', {
      uiView: 'nav-bar'
    }),
    h('div.app-container__content', {
      uiView: 'content'
    })
  ].join('');
}

export default function register() {
  registerDirective('cfAppContainer', () => ({
    template: appContainerTemplateDef(),
    restrict: 'E'
  }));
}
