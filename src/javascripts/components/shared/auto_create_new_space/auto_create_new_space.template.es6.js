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
          }, ['We’re preparing your sample e-commerce project']),
          h('p.modal-dialog__plaintext', ['Here’s what you can do with it'])
        ]),
        h('.auto-create-space-modal__overview', {
          style: {
            padding: '0 80px',
            marginTop: '20px'
          }
        }, [
          overviewItem(
            'ct',
            'Flexible content and fields',
            'Easily customize the structure of your content fields using content types.'
          ),
          overviewItem(
            'entries',
            'Versioned content',
            'Manage content in multiple languages which is automatically versioned.'
          ),
          overviewItem(
            'media',
            'Images, videos and more, in the cloud',
            'Manage assets such as images, videos while benefiting from our caching CDN.'
          ),
          overviewItem(
            'api',
            'RESTful APIs',
            'Quickly deliver your content to any of your platforms or update it programmatically using our APIs.'
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
function overviewItem (type, heading, text) {
  return h('div', {
    style: {
      display: 'flex',
      marginBottom: '20px'
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
