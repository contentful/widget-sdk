import {h} from 'ui/Framework';
import entries from 'components/docs_sidebar/Entries';
import intro from 'components/docs_sidebar/Intro';
import icon from 'svg/help-bot-icon';

export default function Ninja (data) {
  if (data.state.isHidden) {
    return h('div');
  } else {
    return data.state.isExpanded ? expanded(data) : minimized(data);
  }
}

function expanded (data) {
  return h('.docs-sidebar__bg', [
    h('.docs-sidebar__modal', [
      header(data.actions.toggle),
      h('.docs-sidebar__body', [
        data.state.introCompleted ? getTemplate(data.state.view) : intro(data)
      ])
    ])
  ]);
}

function header (toggle) {
  return h('.docs-sidebar__header', [
    icon,
    h('span', {style: {marginLeft: '10px', flexGrow: 1}}, ['Contentful help']),
    h('button.close', {onClick: toggle}, ['X'])
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
    'Hello! I can show you around here! ',
    h('a.text-link--neutral-emphasis-low', {
      onClick: actions.toggle
    }, ['Show']),
    h('a.text-link--neutral-emphasis-low.sometest', {
      onClick: actions.dismissCallout
    }, ['Close'])
  ]);

  return h(
    '.docs-sidebar__ninja',
    state.calloutSeen ? [button] : [button, callout]
  );
}

function getTemplate (route) {
  const views = {
    'spaces.detail.entries.list': entries()
  };

  return views[route] || empty();
}


function empty () {
  return h('div', ['Sorry, I don\'t have any tips for you right now.']);
}
