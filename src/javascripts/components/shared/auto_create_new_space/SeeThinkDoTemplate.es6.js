import { h } from 'utils/hyperscript';
import spinner from 'ui/Components/Spinner.es6';
import { byName } from 'Styles/Colors.es6';
import { genBoxShadow } from 'Styles';
import { default as backgroundIcon } from 'svg/header-illustration-wide.es6';

export default function() {
  return h('.auto-create-space-modal.modal-background', [
    h(
      '.modal-dialog',
      {
        style: {
          lineHeight: '1.5em',
          width: '750px',
          borderRadius: '3px'
        }
      },
      [
        h(
          'div',
          {
            style: {
              width: '100%',
              height: '154px',
              marginBottom: '40px'
            }
          },
          [backgroundIcon]
        ),
        h(
          '.modal-dialog__content',
          {
            style: {
              padding: '20px',
              paddingBottom: '20px'
            }
          },
          [
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }
              },
              [
                h(
                  'div',
                  {
                    style: {
                      height: '28px',
                      marginBottom: '20px'
                    }
                  },
                  [
                    h('div', { ngShow: 'isCreatingSpace' }, [
                      spinner({ diameter: '32px', style: { display: 'block' } })
                    ]),
                    h('cf-icon', {
                      name: 'checkmark',
                      scale: '2',
                      ngShow: '!isCreatingSpace'
                    })
                  ]
                ),
                h(
                  'p.modal-dialog__plaintext',
                  {
                    ngIf: 'isCreatingSpace'
                  },
                  ['We’re preparing your example project']
                ),
                h(
                  'p.modal-dialog__plaintext',
                  {
                    ngIf: '!isCreatingSpace && chosenProjectStatus !== "project-status-see"'
                  },
                  ['Your example project is ready!']
                ),
                h(
                  'h2.modal-dialog__plaintext',
                  {
                    ngIf: '!chosenProjectStatus',
                    style: {
                      fontWeight: 'bold',
                      marginTop: 0
                    }
                  },
                  ['Where would you like to start?']
                )
              ]
            ),
            renderProjectStatusChoice(),
            renderChosenProjectStatus()
          ]
        )
      ]
    )
  ]);
}

function renderProjectStatusChoice() {
  return h(
    'div',
    {
      ngShow: '!chosenProjectStatus',
      style: {
        padding: '40px 0',
        display: 'flex',
        justifyContent: 'space-around'
      }
    },
    [
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
    ]
  );
}

function projectStatusItem({ title, bodyCopy, btnText, btnId }) {
  return h(
    'div',
    {
      style: {
        border: `1px solid ${byName.elementMid}`,
        padding: '24px 15px 20px',
        width: '220px',
        justifyContent: 'space-around',
        boxShadow: genBoxShadow()
      }
    },
    [
      h(
        'p',
        {
          style: {
            fontWeight: 'bold',
            margin: 0,
            marginBottom: '8px',
            fontSize: '16px'
          }
        },
        [title]
      ),
      h(
        'p',
        {
          style: {
            marginBottom: '40px'
          }
        },
        [bodyCopy]
      ),
      h(
        'button.btn-action',
        {
          style: {
            width: '100%'
          },
          ngClick: `onProjectStatusSelect('${btnId}')`
        },
        [btnText]
      )
    ]
  );
}

function renderChosenProjectStatus() {
  const titleStyle = {
    marginTop: '5px',
    textAlign: 'center'
  };
  return h(
    'div',
    {
      ngShow: 'chosenProjectStatus',
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }
    },
    [
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column'
          }
        },
        [
          h(
            'div',
            {
              style: {
                marginBottom: '40px'
              }
            },
            [
              h(
                'div',
                {
                  ngShow: 'chosenProjectStatus === "project-status-see"'
                },
                [
                  h(
                    'p',
                    {
                      ngShow: '!isCreatingSpace',
                      style: { textAlign: 'center' }
                    },
                    ["Example ready. Here's a video presentation of the platform."]
                  ),
                  h('h2', { style: titleStyle }, ['Five-minute introduction']),
                  h('iframe', {
                    width: '560',
                    height: '315',
                    src: 'https://www.youtube.com/embed/LOcSLS9T6NI?rel=0&showinfo=0',
                    frameborder: '0',
                    allowfullscreen: '',
                    style: {
                      marginTop: '15px'
                    }
                  })
                ]
              ),
              h(
                'div',
                {
                  ngShow: 'chosenProjectStatus === "project-status-think"'
                },
                [
                  h('h2', { style: titleStyle }, ['Get ready to explore an example app']),
                  chosenProjectList([
                    'See what a full setup looks like',
                    'Play with the sample content',
                    h('span', [
                      'Check out the source code ',
                      h(
                        'a',
                        {
                          target: '_blank',
                          href:
                            'https://github.com/contentful?utf8=%E2%9C%93&q=the-example-app&type=&language='
                        },
                        ['on GitHub']
                      )
                    ])
                  ])
                ]
              ),
              h(
                'div',
                {
                  ngShow: 'chosenProjectStatus === "project-status-do"'
                },
                [
                  h('h2', { style: titleStyle }, ['Dive right in and start building']),
                  chosenProjectList([
                    'Download a boilerplate in the API section',
                    'Add a blank space from the main menu',
                    'Make your first API call to fetch your content'
                  ])
                ]
              )
            ]
          )
        ]
      ),
      h(
        'button.btn-action',
        {
          ngDisabled: 'isCreatingSpace',
          ngClick: 'dialog.confirm()'
        },
        ['Continue']
      )
    ]
  );
}

function chosenProjectList(items) {
  return h('div', [
    h('div', {
      style: {
        height: '1px',
        margin: '15px auto',
        width: '350px',
        background: byName.elementLight
      }
    }),
    h(
      'ul',
      {
        style: {
          fontSize: '20px',
          // so bullet points do not look like too much to the left
          position: 'relative',
          left: '10px'
        }
      },
      items.map(item =>
        h(
          'li',
          {
            style: {
              listStyle: 'disc',
              lineHeight: '30px'
            }
          },
          [item]
        )
      )
    )
  ]);
}
