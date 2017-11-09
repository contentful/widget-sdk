import { h } from 'utils/hyperscript';
import spinner from 'ui/Components/Spinner';
import { byName, genBoxShadow } from 'Styles/Colors';

export default function () {
  return h('.auto-create-space-modal.modal-background', [
    h('.modal-dialog', {
      style: {
        lineHeight: '1.5em',
        width: '750px',
        borderRadius: '3px'
      }
    }, [
      h('div', {
        style: {
          backgroundColor: '#FFB059',
          width: '100%',
          height: '125px',
          marginBottom: '40px'
        }
      }),
      h('.modal-dialog__content', {
        style: {
          padding: '20px',
          paddingBottom: '20px'
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
            spinner(32, {
              style: {
                display: 'block'
              },
              ngShow: 'isCreatingSpace'
            }),
            h('cf-icon', {
              name: 'checkmark',
              scale: '2',
              ngShow: '!isCreatingSpace && !spaceCreationFailed'
            })
          ]),
          h('p.modal-dialog__plaintext', {
            ngIf: '!chosenProjectStatus'
          }, ['We’re preparing your example project']),
          h('h2.modal-dialog__plaintext', {
            ngIf: '!chosenProjectStatus',
            style: {
              fontWeight: 'bold',
              marginTop: 0
            }
          }, ['Where would you like to start?'])
        ]),
        h('div', {
          ngIf: '!chosenProjectStatus',
          style: {
            padding: '40px 0',
            display: 'flex',
            justifyContent: 'space-around'
          }
        }, [
          projectStatusItem({
            title: 'Understand Contentful',
            bodyCopy: 'The basics about our flexible APIs and structured content',
            btnText: 'Start learning',
            btnId: 'project-status-see'
          }),
          projectStatusItem({
            title: 'Explore an example app',
            bodyCopy: 'Explore how an example project is structured',
            btnText: 'Start exploring',
            btnId: 'project-status-think'
          }),
          projectStatusItem({
            title: 'Start building',
            bodyCopy: 'The fast track to setting your own project up',
            btnText: 'Start building',
            btnId: 'project-status-do'
          })
        ]),
        h('div', {
          ngIf: 'chosenProjectStatus',
          style: {
            padding: '20px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }
        }, [
          h('div', {
            style: {
              width: '500px',
              height: '100px',
              display: 'flex',
              justifyContent: 'center'
            }
          }, [h('p', ['We need to decide on what goes here'])]),
          h('button.btn-action', {
            ngClick: 'dialog.confirm()'
          }, ['Close'])
        ])
      ])
    ])
  ]);
}


function projectStatusItem ({title, bodyCopy, btnText, btnId}) {
  return h('div', {
    style: {
      border: `1px solid ${byName.elementMid}`,
      padding: '20px 10px',
      width: '220px',
      justifyContent: 'space-around',
      boxShadow: genBoxShadow()
    }
  }, [
    h('p', {
      style: {
        fontWeight: 'bold',
        margin: 0,
        marginBottom: '8px',
        fontSize: '16px'
      }
    }, [title]),
    h('p', {
      style: {
        marginBottom: '40px'
      }
    }, [bodyCopy]),
    h('button.btn-action', {
      style: {
        width: '100%'
      },
      ngDisabled: 'isCreatingSpace',
      ngClick: `onProjectStatusSelect('${btnId}')`
    }, [btnText])
  ]);
}
