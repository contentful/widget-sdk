import { h } from 'utils/legacy-html-hyperscript';

export default function template() {
  return h('.workbench', [
    h('cf-api-key-nav'),
    h('.workbench-main', [
      h('.workbench-main__content', [h('cf-component-store-bridge', { component: 'component' })]),
      h('.workbench-main__sidebar', [
        h('.entity-sidebar', [
          h('h2.entity-sidebar__heading', ['Documentation']),
          h('.entity-sidebar__text-profile', [
            h('p', [
              `The Content Management API, unlike the Content Delivery API,
              provides read and write access to your Contentful spaces. This
              enables integrating content management to your development
              workflow, perform automation operations…`
            ]),
            h('ul', [
              h('li', [
                h('react-component', {
                  name: 'components/shared/knowledge_base_icon/KnowledgeBase.es6',
                  props:
                    '{target: "management_api", text: "Content Management API reference", inlineText: "true"}'
                })
              ]),
              h('li', [
                h('react-component', {
                  name: 'components/shared/knowledge_base_icon/KnowledgeBase.es6',
                  props:
                    '{target: "content_apis", text: "Other Contentful APIs", inlineText: "true"}'
                })
              ])
            ])
          ])
        ])
      ])
    ])
  ]);
}
