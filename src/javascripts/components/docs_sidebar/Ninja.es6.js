import {h} from 'ui/Framework';
import entries from 'components/docs_sidebar/Entries';
import intro from 'components/docs_sidebar/Intro';
import icon from 'svg/help-bot-icon';
import { byName as colorByName } from 'Styles/Colors';

export default function Ninja (data) {
  if (data === null || data.state.isHidden) {
    return h('div');
  } else {
    return data.state.isExpanded ? expanded(data) : minimized(data);
  }
}

function expanded (data) {
  return h('.docs-sidebar__bg', [
    h('.docs-sidebar__modal', {
      style: {
        color: colorByName.textMid
      }
    }, [
      header(data.actions.toggle),
      h('.docs-sidebar__body', [
        data.state.introCompleted ? getTemplate(data.state.view)(data) : intro(data)
      ])
    ])
  ]);
}

function header (toggle) {
  return h('.docs-sidebar__header', [
    icon,
    h('span', {style: {marginLeft: '10px', flexGrow: 1}}, ['Onboarding tour']),
    h('button.close', {onClick: toggle}, ['×'])
  ]);
}

function minimized ({actions, state}) {
  const button = h('button.docs-sidebar__button', {
    onClick: actions.toggle,
    ariaLabel: 'Open docs sidebar'
  }, [
    icon,
    h('.docs-sidebar__button-text', ['Help'])
  ]);

  const callout = h('.docs-sidebar__callout', [
    h('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between'
      }
    }, [
      h('p', {
        style: { fontWeight: 'bold' }
      }, ['Onboarding tour']),
      h('p', {
        style: {
          fontSize: '2em',
          cursor: 'pointer',
          color: colorByName.textLight
        },
        onClick: actions.dismissCallout
      }, ['×'])
    ]),
    h('p', {
      style: {}
    }, ['👋 Hi! I am here to you learn about Contentful and to make your first API call.']),
    h('a.text-link--neutral-emphasis-low', {
      onClick: actions.toggle
    }, ['See tour'])
  ]);

  return h(
    '.docs-sidebar__ninja',
    state.calloutSeen ? [button] : [button, callout]
  );
}

function getTemplate (route) {
  const views = {
    'spaces.detail.entries.list': entries
  };

  return views[route] || empty;
}


function empty () {
  return h('div', {
    style: {
      padding: '20px 30px'
    }
  }, ['Sorry, I don\'t have any tips for you right now.']);
}
