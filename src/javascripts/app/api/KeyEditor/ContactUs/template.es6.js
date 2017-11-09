import {h} from 'ui/Framework';

const prefix = 'boilerplate-page-contact-us';

export function render (props) {
  if (props.isVisible) {
    return h(`.${prefix}__container`, [
      h(`h3.${prefix}__title`, [
        'A fast setup for your project'
      ]),
      h(`.${prefix}__description`, [
        'Most projects launch faster when they receive advice from our experts.'
      ]),
      h('div', [
        h('span.button.btn-secondary-action', {
          onClick: props.onClick
        }, [
          'Contact an expert'
        ])
      ]),
      h(`.${prefix}__img`)
    ]);
  }

  return h('div', []);
}
