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
            h('div', {ngShow: 'isCreatingSpace'}, [
              spinner({diameter: '32px', style: {display: 'block'}})
            ]),
            h('cf-icon', {
              name: 'checkmark',
              scale: '2',
              ngShow: '!isCreatingSpace && !spaceCreationFailed'
            })
          ]),
          h('p.modal-dialog__plaintext', {
            ngIf: 'isCreatingSpace'
          }, ['We’re preparing your example project']),
          h('p.modal-dialog__plaintext', {
            ngIf: '!isCreatingSpace'
          }, ['Your example project is ready!']),
          h('h2.modal-dialog__plaintext', {
            ngIf: '!chosenProjectStatus',
            style: {
              fontWeight: 'bold',
              marginTop: 0
            }
          }, ['Where would you like to start?'])
        ]),
        h('div', {
          ngShow: '!chosenProjectStatus',
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
          ngShow: 'chosenProjectStatus',
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }
        }, [
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column'
            }
          }, [
            h('div.note-box--success', {
              style: {
                marginBottom: '20px'
              }
            }, [
              h('h3', ['Great! We’ll send you an email']),
              h('p', ['Check your email to view the relevant materials for what you need.'])
            ]),
            h('div', {
              style: {
                marginBottom: '40px'
              }
            }, [
              h('div', {
                ngShow: 'chosenProjectStatus === "project-status-see"'
              }, [
                h('iframe', {
                  width: '560',
                  height: '315',
                  src: 'https://www.youtube.com/embed/tVj0ZTS4WF4?rel=0&amp;showinfo=0&amp;start=50',
                  frameborder: '0',
                  allowfullscreen: ''
                })
              ]),
              h('div', {
                ngShow: 'chosenProjectStatus === "project-status-think"'
              }, ['Stuff for "Think" status']),
              h('div', {
                ngShow: 'chosenProjectStatus === "project-status-do"'
              }, ['Stuff for "Do" status'])
            ])
          ]),
          h('button.btn-action', {
            ngDisabled: 'isCreatingSpace',
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
      ngClick: `onProjectStatusSelect('${btnId}')`
    }, [btnText])
  ]);
}
