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
        }),
        h(
          'div.breadcrumbs-ancestor-container',
          {
            ngIf: 'shouldShowHierarchy'
          },
          [
            h('cf-icon.btn.btn__ancestor', {
              name: 'breadcrumbs-icon-ancestors',
              role: 'button',
              ariaLabel: 'breadcrumbs-ancestor-btn',
              dataTestId: 'breadcrumbs-ancestor-btn'
            }),
            h(
              'div.breadcrumbs-ancestor-list',
              {
                ariaLabel: 'breadcrumbs-ancestor-menu-container',
                dataTestId: 'breadcrumbs-ancestor-menu-container'
              },
              [
                h('div.breadcrumbs-ancestor-list__heading', [
                  h(
                    'p',
                    {
                      role: 'note'
                    },
                    ['Go back to:']
                  )
                ]),
                h(
                  'ul.breadcrumbs-ancestor-list__items',
                  {
                    role: 'menu',
                    ariaHidden: 'true',
                    ariaLabel: 'breadcrumbs-ancestor-menu',
                    dataTestId: 'breadcrumbs-ancestor-menu'
                  },
                  [
                    h(
                      'li',
                      {
                        ngRepeat: 'crumb in crumbs.slice(0, -1).reverse() track by crumb.id',
                        role: 'menuitem',
                        dataTestId: 'breadcrumbs-ancestor-menuitem'
                      },
                      [
                        h(
                          'a',
                          {
                            uiSref: '{{crumb.link.state}}({{crumb.link.params}})',
                            role: 'link',
                            dataTestId: 'breadcrumbs.crumb.{{crumb.id}}',
                            title: "{{crumb.getTitle().length > 20 ? crumb.getTitle() : ''}}"
                          },
                          [
                            h('cf-icon', {
                              name: 'breadcrumbs-icon-{{crumb.icon}}'
                            }),
                            '{{crumb.getTitle()}}'
                          ]
                        )
                      ]
                    )
                  ]
                )
              ]
            )
          ]
        )
      ])
    ]
  );
}
