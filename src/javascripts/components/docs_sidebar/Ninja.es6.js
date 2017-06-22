import {h} from 'ui/Framework';
import entries from 'components/docs_sidebar/Entries';
import intro from 'components/docs_sidebar/Intro';

export default function Ninja (state) {
  if (state.isVisible) {
    return state.isExpanded ? opened(state) : closed(state);
  } else {
    return h('div');
  }
}

function opened (state) {
  return h('.docs-helper__bg', [
    h('.docs-helper__modal', [
      state.intro.completed ? getTemplate(state.view) : intro(state)
    ])
  ]);
}

function closed ({toggle}) {
  return h(
    '.docs-helper__ninja', [
      h('.docs-helper__ninja__image', {
        onClick: toggle,
        ariaLabel: 'Open docs sidebar'
      })
    ]
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
