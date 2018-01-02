import {h} from 'ui/Framework';

export default function ({track, openIntercom}) {
  return h(`.boilerplate-page-contact-us__container`, [
    h(`h3.boilerplate-page-contact-us__title`, [
      'A fast setup for your project'
    ]),
    h(`.boilerplate-page-contact-us__description`, [
      'Most projects launch faster when they receive advice from our experts.'
    ]),
    h('div', [
      h('span.button.btn-secondary-action', {
        onClick: () => {
          track();
          openIntercom();
        }
      }, [
        'Contact an expert'
      ])
    ]),
    h(`.boilerplate-page-contact-us__img`)
  ]);
}
