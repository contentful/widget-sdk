import {h, renderString} from 'ui/Framework';
import InputWithCopy from 'components/contextual_help/InputWithCopy';
import backIcon from 'svg/breadcrumbs-icon-back';

const classPrefix = 'cli-description-onboard';

export function render (props, actions) {
  return h('section.home-section', [
    renderTitle(props, actions),
    h(`.${classPrefix}__columns`, [
      h(`.${classPrefix}__column.x--left`, [
        renderSteps(props, actions),
        renderContinueButton(props, actions)
      ]),
      h(`.${classPrefix}__column.x--right`, [
        renderDescription()
      ])
    ])
  ]);
}

function renderDescription () {
  return h(`.${classPrefix}__description`, [
    'The Contentful CLI will guide you to:',
    h(`ul.${classPrefix}__list`, [
      h(`li.${classPrefix}__list_item`, [
        'Create a ',
        renderTooltip({
          text: 'space',
          tooltip: `All content and assets in Contentful belong to a space.
                    You will generally have at least one space for a project,
                    but use separate spaces for testing or staging.`
        }),
        ' to hold your content;'
      ]),
      h(`li.${classPrefix}__list_item`, [
        'Create a ',
        renderTooltip({
          text: 'content model',
          tooltip: `Defining a content type is a fundamental step in powering your applications
                    with Contentful. A content type consists of a set of fields and other
                    meta information.`
        }),
        ' and ',
        renderTooltip({
          text: 'entries',
          tooltip: `Entries are where you create and manage your written content. You can
                    customize the fields of an entry by changing the content type it belongs to.`
        }),
        ';'
      ]),
      h(`li.${classPrefix}__list_item`, [
        'Preview your content with a sample blog.'
      ])
    ]),
    `At the end of it, you will be able to run a sample blog, which is a simple JavaScript
    client app that displays your content.`
  ]);
}

function renderTitle (_props, actions) {
  return h('div', [
    h(`div.back_button.${classPrefix}__back`, {
      onClick: actions.back
    }, [
      backIcon
    ]),
    h(`h2.${classPrefix}__title`, ['Using the command line'])
  ]);
}

function renderSteps (_props, actions) {
  const installStep = h('li', [
    h(`h4.${classPrefix}__instruction`, [
      'Install and run the Contentful CLI'
    ]),
    InputWithCopy({
      text: 'npm install -g contentful-cli',
      children: ['npm install -g contentful-cli']
    }, actions.render),
    h(`a.${classPrefix}__node`, {
      onClick: actions.handleMissingNode
    }, [
      'Having trouble installing this?'
    ])
  ]);

  const runStep = h('li', [
    h(`h4.${classPrefix}__instruction`, [
      'Run the guide and follow the steps'
    ]),
    InputWithCopy({
      text: 'contentful guide',
      children: ['contentful guide']
    }, actions.render)
  ]);

  const appStep = h('li', [
    h(`.${classPrefix}__continue_explanation`, [
      'To continue, complete the Contentful CLI guide'
    ])
  ]);

  return h('ul', [
    installStep,
    runStep,
    appStep
  ]);
}

function renderContinueButton (props, actions) {
  const loadingClassName = props.updatingSpaces ? '.is-loading' : '';
  return h('div', [
    h(`button.btn-action.${classPrefix}__continue_button${loadingClassName}`, {
      disabled: !props.complete,
      onClick: actions.navigateToSpace
    }, ['Start exploring the content'])
  ]);
}

function renderTooltip ({ text, tooltip }) {
  return h(`span.${classPrefix}__tooltip_container`, [
    h(`span.${classPrefix}__tooltip_text`, [
      text
    ]),
    h(`.${classPrefix}__tooltip_wrapper`, [
      h('div', [
        h(`.${classPrefix}__tooltip`, [tooltip])
      ])
    ])
  ]);
}

export function renderMissingNodeModal () {
  const VDOMtemplate = h('.modal-background', [
    h(`.modal-dialog.${classPrefix}__modal-container`, [
      h('header.modal-dialog__header', [
        h('h1', [
          'Having trouble installing the CLI?'
        ]),
        h('button.modal-dialog__close', {
          ngClick: 'dialog.confirm()'
        })
      ]),
      h('.modal-dialog__content', [
        h('div', [
          'To install and run the Contentful command line tool, node.js is required.'
        ]),
        h(`ul.${classPrefix}__modal-list`, [
          h(`li.${classPrefix}__modal-elem`, [
            'Get node.js from ',
            h('a', {
              href: 'https://nodejs.org',
              target: '_blank'
            }, ['nodejs.org'])
          ]),
          h(`li.${classPrefix}__modal-elem`, [
            'Then come here and continue the process.'
          ])
        ]),
        h(`.${classPrefix}__modal-note`, [
          `Node.js® is a JavaScript runtime built on Chrome’s V8 JavaScript engine.
           Node.js uses an event-driven, non-blocking I/O model that makes it lightweight
           and efficient. Node.js’ package ecosystem, npm, is the largest ecosystem of
           open source libraries in the world.`
        ]),
        h(`button.btn-action.${classPrefix}__modal-btn`, {
          ngClick: 'dialog.confirm()'
        }, [
          'Done'
        ])
      ])
    ])
  ]);

  return renderString(VDOMtemplate);
}
