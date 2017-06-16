import {h} from 'utils/hyperscript';

export default function () {
  return h('header.workbench-header.x--with-nav', [
    h('nav.workbench-nav__tabs', [
      h('a', {
        role: 'tab',
        dataTestId: '{{tab.testId}}',
        cfSref: 'tab.state',
        ngRepeat: 'tab in nav.tabs track by $index',
        ariaSelected: '{{tab.selected}}'
      }, ['{{tab.name}}'])
    ])
  ]);
}
