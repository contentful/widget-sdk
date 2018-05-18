import {h} from 'utils/hyperscript';

export default function template () {
  const nonTeaOnboardingSteps = h('section.home-section.x--onboarding-steps', [
    heading(),
    description(),
    steps()
  ]);

  // this block now also contains code from modern stack onboarding as well
  // Begin test code: test-ps-02-2018-tea-onboarding-steps
  return h('div', [
    h('.loader__container', {
      style: {
        height: '5em',
        borderRadius: 0,
        backgroundColor: '#fff'
      },
      ngIf: 'onboarding.isContentPreviewsLoading'
    }, [
      h('.loading-box__spinner'),
      h('.loader_message', [
        'Initializing steps...'
      ])
    ]),
    h('div', {
      ngIf: '!onboarding.isContentPreviewsLoading'
    }, [
      h('cf-onboarding-with-tea', {
        ngIf: 'onboarding.enableTeaOnboarding === true' // since this can be the string 'loading' as well
      }),
      h('cf-modern-stack-onboarding-dev-choice-next-steps', {
        ngIf: 'onboarding.showModernStackDevChoiceNextSteps'
      }),
      h('cf-modern-stack-onboarding-content-choice-next-steps', {
        ngIf: 'onboarding.showModerStackContentChoiceNextSteps'
      }),
      h('div', {
        ngIf: '!onboarding.showModernStackDevChoiceNextSteps && !onboarding.showModerStackContentChoiceNextSteps && !onboarding.enableTeaOnboarding'
      }, [nonTeaOnboardingSteps])
    ])
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
