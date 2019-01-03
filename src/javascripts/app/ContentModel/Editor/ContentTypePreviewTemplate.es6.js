import { h } from 'utils/legacy-html-hyperscript/index.es6';

export default function() {
  return h('div.ct-editor-json', [
    h(
      'div',
      {
        ngIf: 'isNew'
      },
      [
        h(
          'div.note-box--info',
          {
            style: {
              marginBottom: '2em'
            }
          },
          [
            h('p', [
              'We will show you a preview once the content type has been saved.',
              h(
                'button.btn-inline',
                {
                  uiCommand: 'actions.save'
                },
                ['Save now and get preview']
              )
            ])
          ]
        ),
        h('code.ct-editor-json__code--unsaved', [h('pre', ['{{preview | json}}'])])
      ]
    ),
    h(
      'div',
      {
        ngIf: '!isNew'
      },
      [
        h(
          'div.loader__container',
          {
            ngIf: 'isLoading',
            style: {
              height: '200px'
            }
          },
          [
            h('react-component', {
              name: '@contentful/forma-36-react-components/Spinner',
              props: '{size: "large", style: {display: "block"}}'
            }),
            h(
              'div',
              {
                style: {
                  marginLeft: '5px'
                }
              },
              ['Loading JSON preview']
            )
          ]
        ),
        h(
          'div',
          {
            ngShow: '!isLoading'
          },
          [
            h(
              'div.note-box--info',
              {
                style: {
                  marginBottom: '2em'
                },
                ngShow: 'contentTypeForm.$dirty'
              },
              [
                h('p', [
                  'You have unsaved changes.',
                  h(
                    'button.btn-inline',
                    {
                      uiCommand: 'actions.save'
                    },
                    ['Save now and get preview']
                  )
                ])
              ]
            ),
            h('code.ct-editor-json__code', [h('pre', ['{{preview | json}}'])])
          ]
        )
      ]
    )
  ]);
}
