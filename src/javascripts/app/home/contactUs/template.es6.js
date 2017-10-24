import {h} from 'ui/Framework';

const prefix = 'space-home-page-contact-us';

export function render (props) {
  if (props.isVisible) {
    return h(`.${prefix}__container`, [
      h('div', [
        h(`h3.${prefix}__title`, [
          'A fast setup for your project'
        ]),
        h(`.${prefix}__description`, [
          'Most projects launch faster when they receive advice from our experts.'
        ]),
        h('div', [
          h('a.button.btn-action', {
            target: '_blank',
            href: props.link,
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
