import {h} from 'utils/hyperscript';

export default function template () {
  const regularSteps = h('section.home-section.x--onboarding-steps', [
    heading(),
    description(),
    steps()
  ]);

  // Begin test code: test-ps-02-2018-tea-onboarding-steps
  return h('div', [
    h('.loading-box', {
      style: { height: '10em', border: '0' },
      ngIf: 'onboarding.isContentPreviewsLoading'
    }, [
      h('.loading-box__spinner'),
      h('.loading-box__message', [
        'Initializing steps...'
      ])
    ]),
    h('cf-onboarding-with-tea', {
      ngIf: 'onboarding.isExampleSpace === true && !onboarding.isContentPreviewsLoading'
    }),
    h('div', {
      ngIf: '!onboarding.isExampleSpace && !onboarding.isContentPreviewsLoading'
    }, [regularSteps])
  ]);
  // End test code: test-ps-02-2018-tea-onboarding-steps
}

function heading () {
  return h('h3.home-section__heading', [
    'Get started with content creation'
  ]);
}

function description () {
  return h('p.home-section__description', [
    'To get started with creating your content and distributing it, we recommend starting with these steps.'
  ]);
}

function steps () {
  return h('.onboarding-step', {
    ngRepeat: 'step in onboarding.steps track by $index',
    ngClass: '{"x--disabled": step.disabled}',
    dataTestId: 'step-{{step.id}}'
  }, [
    h('.onboarding-step__icon', [
      h('cf-icon', {name: '{{step.icon}}', scale: '0.5'})
    ]),
    h('.onboarding-step__text', [
      h('h4.onboarding-step__heading', ['{{step.title}}']),
      h('.onboarding-step__description', ['{{step.description}}'])
    ]),
    h('.onboarding-step__cta', [
      h('.onboarding-step__completed', {ngIf: 'step.completed'}, [
        h('cf-icon', {name: 'checkmark-alt'}),
        'Completed'
      ]),
      h('button.btn-action', {
        ngIf: 'step.completed === false',
        ngClick: 'step.action()',
        ngDisabled: 'step.disabled'
      }, ['{{step.cta}}']),
      h('.onboarding-step__link', {ngIf: 'step.completed && step.link'}, [
        h('a', {uiSref: '{{step.link.state}}'}, ['{{step.link.text}}'])
      ])
    ])
  ]);
}
