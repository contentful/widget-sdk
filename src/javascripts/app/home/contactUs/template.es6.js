import {h} from 'ui/Framework';

const prefix = 'space-home-page-contact-us';

export function render (props) {
  if (props.isVisible) {
    return h(`.home-section.${prefix}__container`, [
      h('div', [
        h(`h3.home-section__heading`, [
          'A fast setup for your project'
        ]),
        h(`.home-section__description`, [
          'Most projects launch faster when they receive advice from our experts.'
        ]),
        h('div', [
          h('span.button.btn-action', {
            onClick: props.onClick
          }, [
            'Contact an expert'
          ])
        ])
      ]),
      h(`.${prefix}__img`)
    ]);
  }

  return h('div', []);
}
