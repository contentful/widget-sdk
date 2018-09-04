import { createElement as h } from 'react';
import createReactClass from 'create-react-class';
import $state from '$state';
import { track } from 'analytics/Analytics.es6';
import Intercom from 'intercom';

const prefix = 'space-home-page-contact-us';

export default createReactClass({
  onClick() {
    track('element:click', {
      elementId: 'contact_sales_spacehome',
      groupId: 'contact_sales',
      fromState: $state.current.name
    });

    Intercom.open();
  },
  render() {
    return h(
      'div',
      { className: `${prefix}__container` },
      h(
        'div',
        null,
        h('h3', { className: `${prefix}__title` }, 'A fast setup for your project'),
        h(
          'div',
          { className: `${prefix}__description` },
          'Most projects launch faster when they receive advice from our experts.'
        ),
        h(
          'div',
          null,
          h(
            'span',
            {
              className: 'button btn-action',
              onClick: this.onClick
            },
            'Contact an expert'
          )
        )
      ),
      h('div', { className: `${prefix}__img` })
    );
  }
});
