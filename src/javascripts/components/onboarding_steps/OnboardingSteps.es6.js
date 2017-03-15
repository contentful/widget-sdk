import {h} from 'utils/hyperscript';

const onboardingSteps = [
  {
    title: 'Create a space',
    description: 'A space is a place where you keep all the content related to a single project.',
    cta: 'Create space',
    icon: 'onboarding-space'
  },
  {
    title: 'Define the structure',
    description: 'Create your content model. It’s comprised of content types, which define the structure of your entries.',
    cta: 'Create a content type',
    icon: 'page-ct'
  },
  {
    title: 'Create your content',
    description: 'Add an entry. They are your actual pieces of content, based on the content types you have created.',
    cta: 'Add an entry',
    icon: 'page-entries'
  },
  {
    title: 'Fetch your content',
    description: 'Use the API to see your content wherever you like. We’ll show you different ways of delivering your content.',
    cta: 'Use the API',
    icon: 'page-api'
  }
];

export function template () {
  return h('section.home-section.x--onboarding-steps', [
    heading(),
    description(),
    steps(onboardingSteps)
  ]);
}

function heading () {
  return h('h3.home-section__heading', [
    'Get started with this project'
  ]);
}

function description () {
  return h('p.home-section__description', [
    'To get started with creating your content and distributing it, we recommend starting with these steps.'
  ]);
}

function steps (content) {
  return content.map(function (stepContent) {
    return h('.onboarding-step', step(stepContent));
  }).join('');
}

function step (content) {
  return [
    h('.onboarding-step__icon', [
      h('cf-icon', {name: content.icon, scale: '0.6'})
    ]),
    h('.onboarding-step__text', [
      h('h4.onboarding-step__heading', [content.title]),
      h('.onboarding-step__description', [content.description])
    ]),
    h('.onboarding-step__button', [
      h('button.btn-action', [content.cta])
    ])
  ];
}
