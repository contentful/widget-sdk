import {h} from 'ui/Framework';
import $state from '$state';
import { byName as colorByName } from 'Styles/Colors';
import { clickLink as trackLinkClick } from 'analytics/events/ContextualHelp';
import createApiKeyAdvice from './CreateApiKeyAdvice';
import curl from './Curl';

const entriesList = 'spaces.detail.entries.list';

export default function ({ state, actions }) {
  const currentStep = state.introProgress;
  const introTotalSteps = state.introProgress + state.introStepsRemaining;

  const prompt = h(
    'p.contextual-help__prompt',
    {ariaLabel: 'Next'},
    ['[ Press space to continue ]']
  );

  const storyContent = content({ state, actions }).slice(0, currentStep).map((step) => {
    return h('div.contextual-help__line', [step]);
  }).concat(state.introStepsRemaining ? prompt : []);

  return h('div.contextual-help__intro', [
    h('div.contextual-help__progress', {
      style: {
        height: '2px',
        backgroundColor: colorByName.blueMid,
        transition: 'width 0.3s ease-in-out',
        width: `${(state.introProgress / introTotalSteps) * 100}%`
      }
    }),
    h('div.contextual-help__intro-content', storyContent)
  ]);
}

function content ({ state, actions }) {
  return [
    h('div', [
      h('p', ['👋 Hi! I’m here to help you learn about Contentful and to make your first few API calls.']),
      h('p', [
        'I will show you different info on the main pages. To hide or display this help, press ',
        h('strong', ['H']),
        '.'
      ])
    ]),
    'Contentful is a content management infrastructure that lets you build applications with its flexible APIs and global CDN.',
    h('div', [
      h('strong', ['Try and fetch an entry.']),
      state.apiKeyId ? curl({
        path: ['spaces', state.spaceId, 'entries', state.entryId],
        params: [['access_token', state.token]],
        id: 'introCurl'
      }, actions.render) : createApiKeyAdvice(state.spaceId),
      docs()
    ]),
    h('div', [
      h('strong', {
        style: {
          display: 'block',
          marginBottom: '10px'
        }
      }, ['What‘s next?']),
      h('a.text-link', {
        onClick: (e) => {
          e.preventDefault();
          trackLinkClick($state.href(entriesList));
          if ($state.is(entriesList)) {
            actions.render();
          } else {
            $state.go(entriesList);
          }
        }
      }, ['Explore all your entries'])
    ])
  ];
}

function docs () {
  const docsUrl = 'https://www.contentful.com/developers/docs/';

  return h('div', [
    h('span', ['Read about this and other API endpoints in the ']),
    h('a.text-link', {
      href: docsUrl,
      target: '_blank',
      onClick: () => trackLinkClick(docsUrl)
    }, ['developer docs.'])
  ]);
}
