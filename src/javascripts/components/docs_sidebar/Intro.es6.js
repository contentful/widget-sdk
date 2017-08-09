import {h} from 'ui/Framework';
import clickToCopy from './InputWithCopy';
import $state from '$state';
import { byName as colorByName } from 'Styles/Colors';
import { clickLink as trackLinkClick } from 'analytics/events/DocsSidebar';
import { domain } from 'Config';
import createApiKeyAdvice from './CreateApiKeyAdvice';

export default function (data) {
  const currentStep = data.state.introProgress;
  const introTotalSteps = data.state.introProgress + data.state.introStepsRemaining;

  const allContent = content(data);

  const prompt = h(
    'p.docs-sidebar__prompt',
    {ariaLabel: 'Next'},
    ['[ Press space to continue ]']
  );

  const storyContent = allContent.slice(0, currentStep).map((step) => {
    return h('div.docs-sidebar__line', step);
  });

  if (currentStep < allContent.length) {
    storyContent.push(prompt);
  }

  return h('div.docs-sidebar__intro', [
    h('div.docs-sidebar__progress', {
      style: {
        height: '2px',
        backgroundColor: colorByName.blueMid,
        transition: 'width 0.3s ease-in-out',
        width: `${(data.state.introProgress / introTotalSteps) * 100}%`
      }
    }),
    h('div.docs-sidebar__intro-content', storyContent)
  ]);
}

function content (data) {
  const entriesList = 'spaces.detail.entries.list';

  return [
    [h('div', [
      h('p', ['👋 Hi! I’m here to help you learn about Contentful and to make your first few API calls.']),
      h('p', [
        'I will show you different info on the main pages. To hide or display this help, press ',
        h('strong', ['h']),
        '.'
      ])
    ])],
    ['Contentful is a content management infrastructure that lets you build applications with its flexible APIs and global CDN.'],
    [h('div', [
      h('strong', ['Try and fetch an entry.']),
      data.state.apiKeyId ? clickToCopy(curl(data), data.actions.render) : createApiKeyAdvice(data.state.spaceId),
      docs()
    ])],
    [h('div', [
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
          $state.go(entriesList);
        }
      }, ['Explore all your entries'])
    ])]
  ];
}

function curl (data) {
  const colorBlue = colorize(colorByName.blueDarkest);
  const colorGreen = colorize(colorByName.greenDarkest);

  return {
    children: [
      h('pre', {
        style: {
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          color: colorByName.textMid
        }
      }, [
        h('span', [`curl https://cdn.${domain}/`]),
        h('span', colorBlue, ['spaces']),
        h('span', ['/']),
        h('span', colorGreen, [`${data.state.spaceId}`]),
        h('span', ['/']),
        h('span', colorBlue, ['entries']),
        h('span', ['/']),
        h('span', colorGreen, [`${data.state.entryId}`]),
        h('span', ['?']),
        h('span', colorBlue, ['access_token']),
        h('span', ['=']),
        h('span', colorGreen, [`${data.state.token}`])
      ])
    ],
    text: `curl https://cdn.${domain}/spaces/${data.state.spaceId}/entries/${data.state.entryId}?access_token=${data.state.token}`,
    id: 'introCurl'
  };

  function colorize (color) {
    return {
      style: {
        color: `${color}`
      }
    };
  }
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
