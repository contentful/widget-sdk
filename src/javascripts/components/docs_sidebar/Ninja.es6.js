import {h} from 'ui/Framework';
import entries from 'components/docs_sidebar/Entries';
import intro from 'components/docs_sidebar/Intro';

export default function Ninja (data) {
  if (data.state.isHidden) {
    return h('div');
  } else {
    return data.state.isExpanded ? expanded(data) : minimized(data);
  }
}

function expanded (data) {
  return h('.docs-helper__bg', [
    h('.docs-helper__modal', [
      data.state.introCompleted ? getTemplate(data.state.view) : intro(data)
    ])
  ]);
}

function minimized ({actions, state}) {
  const ninja = h('.docs-helper__ninja__image', {
    onClick: actions.toggle,
    ariaLabel: 'Open docs sidebar'
  });

  const callout = h('.docs-helper__callout', [
    'Hello! I can show you around here! ',
    h('a.text-link--neutral-emphasis-low', {
      onClick: actions.toggle
    }, ['Show']),
    h('a.text-link--neutral-emphasis-low.sometest', {
      onClick: actions.dismissCallout
    }, ['Close'])
  ]);

  return h(
    '.docs-helper__ninja',
    state.calloutSeen ? [ninja] : [ninja, callout]
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
