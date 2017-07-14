import {h} from 'ui/Framework';

export default function template ({state, toggle}) {
  const currentStep = state.introProgress;
  const allContent = content(toggle);
  const prompt = h(
    'p.docs-helper__prompt',
    {ariaLabel: 'Next'},
    ['[ Press space to continue ]']
  );

  const storyContent = allContent.slice(0, currentStep).map((step) => {
    return h('div.docs-helper__line', step);
  });

  if (currentStep < allContent.length) {
    storyContent.push(prompt);
  }

  return h('div', storyContent);
}

function content (toggle) {
  return [
    [h('h3', ['Hello fellow Content-Ninja!'])],
    ['Welcome to the Contentful Jungle.'],
    ['My name is Misao and I\'m here to guide Contentful developers along the way.'],
    ['First I want to give you something useful.'],
    ['Here is an ', h('strong', ['API token']), '. You will need it to fetch your data.'],
    token(),
    curl(),
    ['This curl command GETs all the entries that belong to this space.'],
    docs(),
    summon(toggle)
  ];
}

function token () {
  return [
    h('.docs-helper__token-line', [
      h('.docs-helper__key-icon'),
      h('.cfnext-form__input-group.docs-helper__token', [
        h('input.cfnext-form__input--full-size', {type: 'text', value: 'SUPERTOKENHERENOW'}),
        h('button.cfnext-form__icon-suffix.x--input-suffix.fa.fa-copy', {tooltip: 'Take Token!'})
      ])
    ])
  ];
}

function curl () {
  return [
    h('p', ['Now you can do things like this:']),
    h('code', [
      'curl https://cdn.contentful.com/spaces/{{spaceContext.getId()}}?access_token=SUPERTOKENHERENOW'
    ])
  ];
}

function docs () {
  return [
    'Visit the ',
    h(
      'a.text-link',
      {href: 'https://www.contentful.com/developers/docs/', target: '_blank'},
      ['developer docs']
    ),
    ' to read about this and other API endpoints.'
  ];
}

function summon (toggle) {
  return [
    h('p', [
      h('span', ['By the way, you can summon or hide me at any time by pressing the shortcut ']),
      h('strong', ['n']),
      '.'
    ]),
    h('a.text-link--neutral-emphasis-low', {onClick: toggle}, ['Close'])
  ];
}
