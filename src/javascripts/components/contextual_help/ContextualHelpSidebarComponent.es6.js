import {h} from 'ui/Framework';
import entries from 'components/contextual_help/Entries';
import contentTypes from './ContentTypes';
import apiDetail from './ApiDetail';
import apisList from './ApisList';
import intro from './Intro';
import noContent from './NoContent';
import icon from 'svg/help-bot-icon';
import { byName as colorByName } from 'Styles/Colors';


export default function (data) {
  if (data === null) {
    return h('div');
  } else {
    const isHelpHidden = data.state.isHidden ? '.contextual-help__main-container--hidden' : '';

    return h(
      `div.contextual-help__main-container${isHelpHidden}`,
      {
        style: {
          zIndex: 1
        }
      }, [
        minimized(data),
        expanded(data),
        helpButton(data.actions)
      ]
    );
  }
}

function helpButton ({ toggle }) {
  return h('div.contextual-help__button', {
    style: {
      zIndex: 2
    },
    onClick: toggle,
    ariaLabel: 'Open docs sidebar',
    role: 'button'
  }, [
    icon,
    h('.contextual-help__button-text', ['Help'])
  ]);
}

function expanded (data) {
  return h(
    `.contextual-help__modal${data.state.isExpanded ? '.contextual-help__modal--fade-in' : ''}`, {
      style: {
        zIndex: 2
      }
    }, [
      header(data.actions.toggle),
      h('.contextual-help__body', [
        data.state.introCompleted ? getTemplate(data.state.view)(data) : intro(data)
      ])
    ]
  );
}

function minimized ({actions, state}) {
  return h(`.contextual-help__callout${state.calloutSeen ? '.contextual-help__callout--hide' : ''}`, {
    style: {
      zIndex: 2
    }
  }, [
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
    }, ['👋 Hi! I am here to help you learn about Contentful and to make your first API call.']),
    h('a.text-link--neutral-emphasis-low', {
      onClick: actions.toggle
    }, ['See tour'])
  ]);
}

function header (toggle) {
  return h('.contextual-help__header', [
    icon,
    h('span', {style: {marginLeft: '10px', flexGrow: 1}}, ['Onboarding tour']),
    h('button.close', {onClick: toggle}, ['×'])
  ]);
}

function getTemplate (stateName) {
  const views = {
    'spaces.detail.entries.list': entries,
    'spaces.detail.content_types.list': contentTypes,
    'spaces.detail.api.keys.detail': apiDetail,
    'spaces.detail.api.keys.list': apisList,
    'spaces.detail.api.cma_tokens': apisList
  };

  return views[stateName] || noContent;
}
