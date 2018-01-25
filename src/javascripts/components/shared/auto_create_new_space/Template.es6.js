import { h } from 'utils/hyperscript';
import spinner from 'ui/Components/Spinner';

export default function () {
  return h('.auto-create-space-modal.modal-background', [
    h('.modal-dialog', {
      style: {
        lineHeight: '1.5em',
        width: '750px',
        borderRadius: '3px'
      }
    }, [
      h('.modal-dialog__content', {
        style: {
          paddingBottom: '30px'
        }
      }, [
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }
        }, [
          h('div', {
            style: {
              height: '28px',
              marginBottom: '20px'
            }
          }, [
            h('div', {ngShow: 'isCreatingSpace'}, [
              spinner({diameter: '32px', style: {display: 'block'}})
            ]),
            h('cf-icon', {
              name: 'checkmark',
              scale: '2',
              ngShow: '!isCreatingSpace'
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
            padding: '0 80px'
          }
        }, [
          overviewItem(
            'ct',
            'Flexible content and fields',
            'Easily customize the structure of your content fields using content types.'
          ),
          overviewItem(
            'content',
            'Versioned content',
            'Manage content in multiple languages which is automatically versioned.'
          ),
          overviewItem(
            'media',
            'Images, videos and more, in the cloud',
            'Manage assets such as images, videos while benefiting from our caching CDN.'
          ),
          overviewItem(
            'apis',
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
      marginTop: '30px'
    }
  }, [
    h('cf-icon', {
      name: `page-${type}`,
      style: {
        paddingRight: '20px'
      }
    }),
    h('div', {}, [
      h('h3', {
        style: {
          fontWeight: 'bold',
          margin: '0',
          marginBottom: '8px'
        }
      }, [`${heading}`]),
      h('p', {
        style: {
          marginBottom: '0'
        }
      }, [`${text}`])
    ])
  ]);
}
