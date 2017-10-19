import {h} from 'ui/Framework';
import onboardingIcon from 'svg/onboarding-choose';

const prefix = 'cli-entry-onboard';

export function render (props, actions) {
  const continueButton = h(`button.btn-action.${prefix}__continue_button`, {
    disabled: !props.type,
    onClick: () => actions.chooseType(props.type)
  }, ['Continue']);

  return h('section.home-section', [
    h(`h2.${prefix}__title`, [props.greeting]),
    h(`.${prefix}__description`, [
      'Let’s get you set up with a sample blog to explore.'
    ]),
    h(`h4.${prefix}__question`, [
      'What would you prefer to use to get started?'
    ]),
    ...renderRadioButtons(props, actions),
    continueButton,
    h(`.${prefix}__icon`, [
      onboardingIcon
    ])
  ]);
}

function renderRadioButtons (props, actions) {
  const cliRadioButton = renderRadioButton({
    selectType: actions.selectType,
    chosenType: props.type,
    type: 'cli',
    text: [
      'Use the command line.'
    ]
  });
  const webappRadioButton = renderRadioButton({
    selectType: actions.selectType,
    chosenType: props.type,
    type: 'webapp',
    text: [
      'Use the web app.'
    ]
  });

  return [cliRadioButton, webappRadioButton];
}

function renderRadioButton ({ text, selectType, chosenType, type }) {
  return h(`label.radio-editor__option.${prefix}__radio`, {
    onClick: () => selectType(type)
  }, [
    h('input.radio-editor__input', {
      name: type,
      checked: chosenType === type,
      type: 'radio'
    }),
    h('span.radio-editor__label', text)
  ]);
}
