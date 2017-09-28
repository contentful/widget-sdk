import {h} from 'ui/Framework';
import InputWithCopy from 'components/contextual_help/InputWithCopy';
import backIcon from 'svg/breadcrumbs-icon-back';

export const prefix = 'cli-description-onboard';

export function render (props, applyRender) {
  return h('section.home-section', [
    renderTitle(props),
    h(`.${prefix}__columns`, [
      h(`.${prefix}__column.x--left`, [
        renderSteps(props, applyRender),
        renderContinueButton(props)
      ]),
      h(`.${prefix}__column.x--right`, [
        renderDescription()
      ])
    ])
  ]);
}

function renderDescription () {
  return h(`.${prefix}__description`, [
    'The Contentful CLI will guide you to:',
    h(`ul.${prefix}__list`, [
      h(`li.${prefix}__list_item`, [
        'Create a ',
        renderTooltip({
          text: 'space',
          tooltip: `All content and assets in Contentful belong to a space.
                    You will generally have at least one space for a project,
                    but use separate spaces for testing or staging.`
        }),
        ' to hold your content;'
      ]),
      h(`li.${prefix}__list_item`, [
        'Create a ',
        renderTooltip({
          text: 'content model',
          tooltip: `Defining a content type is a fundamental step in powering your applications
                    with Contentful. A content type consists of a set of fields and other
                    information, read this guide to learn more about modelling your content.`
        }),
        ' and ',
        renderTooltip({
          text: 'entries',
          tooltip: `Entries are where you create and manage your written content. You can
                    customize the fields of an entry by changing the content type it belongs to.`
        }),
        ';'
      ]),
      h(`li.${prefix}__list_item`, [
        'Preview your content with a sample blog.'
      ])
    ]),
    `At the end of it, you will be able to run a sample blog, which is a simple JavaScript
    client app that displays your content.`
  ]);
}

function renderTitle (props) {
  return h('div', [
    h(`div.back_button.${prefix}__back`, {
      onClick: props.back
    }, [
      backIcon
    ]),
    h(`h2.${prefix}__title`, ['Using the command line'])
  ]);
}

function renderSteps (props, applyRender) {
  const installStep = h('li', [
    h(`h4.${prefix}__instruction`, [
      'Install and run the Contentful CLI'
    ]),
    InputWithCopy({
      text: 'npm install -g contentful-cli',
      children: ['npm install -g contentful-cli']
    }, applyRender),
    h(`a.${prefix}__node`, {
      onClick: props.handleMissingNode
    }, [
      'Having trouble installing this?'
    ])
  ]);

  const runStep = h('li', [
    h(`h4.${prefix}__instruction`, [
      'Run the guide and follow the steps'
    ]),
    InputWithCopy({
      text: 'contentful guide',
      children: ['contentful guide']
    }, applyRender)
  ]);

  const appStep = h('li', [
    h(`.${prefix}__continue_explanation`, [
      'To continue, complete the Contentful CLI guide'
    ])
  ]);

  return h('ul', [
    installStep,
    runStep,
    appStep
  ]);
}

function renderContinueButton (props) {
  return h('div', [
    h(`button.btn-action.${prefix}__continue_button`, {
      disabled: !props.complete,
      onClick: () => props.navigateToCreatedSpace()
    }, ['Start exploring the content'])
  ]);
}

function renderTooltip ({ text, tooltip }) {
  return h(`span.${prefix}__tooltip_container`, [
    h(`span.${prefix}__tooltip_text`, [
      text
    ]),
    h(`.${prefix}__tooltip_wrapper`, [
      h('div', [
        h(`.${prefix}__tooltip`, [tooltip])
      ])
    ])
  ]);
}
