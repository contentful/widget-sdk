import { h } from 'utils/legacy-html-hyperscript/index.es6';

export function template() {
  return h(
    'div.breadcrumbs-widget',
    {
      ngHide: 'shouldHide'
    },
    [
      h('div.breadcrumbs-container', [
        h('cf-icon.btn.btn__back', {
          ngIf: 'shouldShowBack',
          name: 'breadcrumbs-icon-back',
          role: 'button',
          ariaLabel: 'breadcrumbs-back-btn',
          dataTestId: 'breadcrumbs-back-btn'
        })
      ])
    ]
  );
}
