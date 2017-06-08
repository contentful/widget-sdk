import {h} from 'utils/hyperscript';

export default function () {
  return h('header.workbench-header.x--with-nav', [
    h('cf-breadcrumbs'),
    h('div.page-header', [
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center'
        }
      }, [
        h('h1.workbench-header__title', {
          style: { marginRight: '2.5em' }
        }, ['Organizations & Billing']),
        h('div', ['Switch organization']),
        h('select.cfnext-select-box', {
          ngOptions: 'org.sys.id as org.name for org in nav.organizations',
          ngModel: 'nav.selectedOrganizationId',
          ngChange: 'nav.goToOrganization(nav.selectedOrganizationId)',
          style: { margin: '0 1.2em 0 0.8em' }
        }),
        h('a', {
          cfSref: '{ path: ["account", "organizations", "new"] }'
        }, ['Add new organization'])
      ])
    ]),
    h('nav.workbench-nav__tabs', [
      h('a', {
        role: 'tab',
        dataTestId: '{{tab.testId}}',
        cfSref: 'tab.state',
        ngRepeat: 'tab in nav.tabs track by $index',
        ariaSelected: '{{nav.isTabSelected(tab)}}'
      }, ['{{tab.name}}'])
    ])
  ]);
}
