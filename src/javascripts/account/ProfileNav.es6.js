import {h} from 'utils/hyperscript';

export default function () {
  return h('header.workbench-header.x--with-nav', [
    h('cf-breadcrumbs'),
    h('div.page-header', [
      h('h1.workbench-header__title', ['User Profile'])
    ]),
    h('nav.workbench-nav__tabs', [
      h('a', {
        role: 'tab',
        dataTestId: '{{tab.testId}}',
        uiSref: '{{tab.state}}',
        ngRepeat: 'tab in nav.tabs track by $index',
        ariaSelected: '{{tab.selected}}'
      }, ['{{tab.name}}'])
    ])
  ]);
}
