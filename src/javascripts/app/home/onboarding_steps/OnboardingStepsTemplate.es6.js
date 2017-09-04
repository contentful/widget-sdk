import {h} from 'utils/hyperscript';

export default function template () {
  return h('section.home-section.x--onboarding-steps', [
    heading(),
    description(),
    steps()
  ]);
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
