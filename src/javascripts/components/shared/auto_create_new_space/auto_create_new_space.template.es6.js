import { h } from 'utils/hyperscript';

export default function () {
  return h('.auto-create-space-modal.modal-background', [
    h('.modal-dialog', {
      style: {
        lineHeight: '1.5em',
        width: '750px',
        borderRadius: '3px'
      }
    }, [
      h('.modal-dialog__content', [
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }
        }, [
          h('div', {
            style: {
              marginBottom: '20px'
            }
          }, [
            h('.loader__spinner', {
              ngShow: 'isCreatingSpace'
            }),
            h('cf-icon', {
              name: 'checkmark',
              scale: '2',
              ngShow: '!isCreatingSpace && !autoSpaceCreationFailed'
            })
          ]),
          h('h2.modal-dialog__plaintext', {
            style: {
              fontWeight: 'bold',
              marginTop: 0
            }
          }, ['Hang on, we’re preparing your sample project!']),
          h('p.modal-dialog__plaintext', ['Here’s what you’ll find inside'])
        ]),
        h('.auto-create-space-modal__overview', {
          style: {
            padding: '0 80px',
            marginTop: '20px'
          }
        }, [
          getOverviewItem(
            'ct',
            'Flexible content and fields',
            'Easily customize the structure of your records with flexibly fields using content types.'
          ),
          getOverviewItem(
            'entries',
            'Localized and versioned content',
            'Create localized content which can be versioned. You have control over who sees what depending on their role.'
          ),
          getOverviewItem(
            'media',
            'Images, videos or any file type',
            'Store assets such as images, videos or any other file type and use them in the entries you have.'
          ),
          getOverviewItem(
            'api',
            'RESTful APIs',
            'Quickly manage, integrate, and deliver your content to any of the platforms you need to, using any of the four REST APIs.'
          )
        ])
      ]),
      h('.modal-dialog__controls', {
        style: {
          display: 'flex',
          justifyContent: 'center'
        }
      }, [
        h('button.btn-action', {
          ngDisabled: 'isCreatingSpace',
          ngClick: 'dialog.confirm()'
        }, ['Explore the sample project'])
      ])
    ])
  ]);
}

// valid types are ct, entries, media, api
function getOverviewItem (type, heading, text, noMargin) {
  return h('div', {
    style: {
      display: 'flex',
      marginBottom: noMargin ? '0' : '20px'
    }
  }, [
    h('cf-icon', {
      name: `page-${type}`,
      style: {
        paddingRight: '20px'
      }
    }),
    h('div', {}, [
      h('p', {
        style: {
          fontWeight: 'bold',
          marginBottom: '0'
        }
      }, [`${heading}`]),
      h('p', [`${text}`])
    ])
  ]);
}
