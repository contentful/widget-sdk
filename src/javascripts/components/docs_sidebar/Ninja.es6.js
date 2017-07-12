import {h} from 'ui/Framework';
import entries from 'components/docs_sidebar/Entries';
import intro from 'components/docs_sidebar/Intro';

export default function Ninja (state) {
  if (state.isHidden) {
    return h('div');
  } else {
    return state.isExpanded ? expanded(state) : minimized(state);
  }
}

function expanded (state) {
  return h('.docs-helper__bg', [
    h('.docs-helper__modal', [
      state.introCompleted ? getTemplate(state.view) : intro(state)
    ])
  ]);
}

function minimized ({toggle, dismissCallout, calloutSeen}) {
  const ninja = h('.docs-helper__ninja__image', {
    onClick: toggle,
    ariaLabel: 'Open docs sidebar'
  });

  const callout = h('.docs-helper__callout', [
    'Hello! I can show you around here! ',
    h('a.text-link--neutral-emphasis-low', {
      onClick: toggle
    }, ['Show']),
    h('a.text-link--neutral-emphasis-low.sometest', {
      onClick: dismissCallout
    }, ['Close'])
  ]);

  return h(
    '.docs-helper__ninja',
    calloutSeen ? [ninja] : [ninja, callout]
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
