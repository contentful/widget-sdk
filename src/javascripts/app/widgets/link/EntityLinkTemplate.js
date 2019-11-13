import { h } from 'utils/legacy-html-hyperscript';

/**
 * Creates the template for entity links used by the `cfEntityLink`
 * directives.
 */

export default function() {
  return h('div', [entityCard(), entityCardMinimized(), entityCardMissing()]);
}

function entityCardMissing() {
  return h('article.ReferenceCard.ReferenceCard--missing', { ngIf: 'missing' }, [
    h(
      'a.ReferenceCard__wrapper',
      {
        dataTestId: 'entity-link-content',
        cfSref: 'stateRef',
        ngClick: 'onClick($event)'
      },
      [
        h(
          'header.ReferenceCard__header',
          { ngClass: '!(actions | isEmpty) && "ReferenceCard__header--has-actions"' },
          [
            h('div.ReferenceCard__title', { dataTestId: 'entity-link-title' }, [
              '{{ (title | truncate:255) || "Entity missing or inaccessible" }}'
            ])
          ]
        )
      ]
    )
  ]);
}

function entityCardMinimized() {
  return h(
    'article.ReferenceCard.ReferenceCard--minimized',
    {
      ngIf: 'config.minimized && !missing'
    },
    [
      h('a.ReferenceCard__wrapper', { dataTestId: 'entity-link-content' }, [
        h('header.ReferenceCard__header', [
          h('div.ReferenceCard__title', { dataTestId: 'entity-link-title' }, [
            '{{(title | truncate:255) || "Untitled"}}'
          ]),
          h('react-component', {
            name: '@contentful/forma-36-react-components/Tag',
            props: 'tagProps'
          })
        ])
      ])
    ]
  );
}

function entityCard() {
  return h('article.ReferenceCard', { ngIf: '!config.minimized && !missing' }, [
    h(
      'a.ReferenceCard__wrapper',
      {
        dataTestId: 'entity-link-content',
        cfSref: 'stateRef',
        ngClick: 'onClick($event)'
      },
      [
        h(
          'header.ReferenceCard__header',
          { ngClass: '!(actions | isEmpty) && "ReferenceCard__header--has-actions"' },
          [
            h('div.ReferenceCard__content-type', { ngIf: 'contentTypeName' }, [
              '{{contentTypeName}}'
            ]),
            h('react-component', {
              name: '@contentful/forma-36-react-components/Tag',
              props: 'tagProps'
            })
          ]
        ),
        h('div.ReferenceCard__content', [
          h('div.ReferenceCard__text', [
            h(
              'div.ReferenceCard__title',
              {
                dataTestId: 'entity-link-title',
                ngAttrTitle: '{{ title.length > 255 ? title : "" }}'
              },
              ['{{ (title | truncate:255) || "Untitled" }}']
            ),
            h(
              'div.ReferenceCard__description',
              {
                ngIf: 'description'
              },
              ['{{ description | truncate:127 }}']
            )
          ]),
          h(
            'div.ReferenceCard__image.ReferenceCard__image--thumbnail',
            {
              ngIf: 'image'
            },
            [h('cf-thumbnail', { file: 'image', size: '70', fit: 'thumb' })]
          )
        ])
      ]
    )
  ]);
}
