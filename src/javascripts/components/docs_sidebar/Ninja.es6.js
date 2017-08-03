import {h} from 'ui/Framework';
import entries from 'components/docs_sidebar/Entries';
import contentTypes from './ContentTypes';
import apiDetail from './ApiDetail';
import apisList from './ApisList';
import intro from './Intro';
import noContent from './NoContent';
import icon from 'svg/help-bot-icon';
import { byName as colorByName } from 'Styles/Colors';


export default function Ninja (data) {
  if (data === null || data.state.isHidden) {
    return h('div');
  } else {
    const modal = data.state.isExpanded ? expanded(data) : minimized(data);

    return h('div.docs-sidebar__main-container', {
      style: {
        zIndex: 1000
      }
    }, modal.concat(helpButton(data.actions)));
  }
}

function helpButton (actions) {
  return h('button.docs-sidebar__button', {
    onClick: actions.toggle,
    ariaLabel: 'Open docs sidebar'
  }, [
    icon,
    h('.docs-sidebar__button-text', ['Help'])
  ]);
}

function expanded (data) {
  return [
    h('.docs-sidebar__modal', {
      style: {
        color: colorByName.textMid,
        boxShadow: '0 5px 40px 1px rgba(0, 0, 0, 0.16)'
      }
    }, [
      header(data.actions.toggle),
      h('.docs-sidebar__body', [
        data.state.introCompleted ? getTemplate(data.state.view)(data) : intro(data)
      ])
    ])
  ];
}

function minimized ({actions, state}) {
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

  return state.calloutSeen ? [] : [callout];
}

function header (toggle) {
  return h('.docs-sidebar__header', [
    icon,
    h('span', {style: {marginLeft: '10px', flexGrow: 1}}, ['Onboarding tour']),
    h('button.close', {onClick: toggle}, ['×'])
  ]);
}

function getTemplate (route) {
  const views = {
    'spaces.detail.entries.list': entries,
    'spaces.detail.content_types.list': contentTypes,
    'spaces.detail.api.keys.detail': apiDetail,
    'spaces.detail.api.keys.list': apisList
  };

  return views[route] || noContent;
}
