import { createElement as h } from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import { template } from '../template';

const IncomingLinksList = createReactClass({
  displayName: 'IncomingLinksList',
  render () {
    const { links, message } = this.props;
    return h(
      'div',
      {
        'data-test-id': 'links'
      },
      h(
        'p',
        { className: 'incoming-links__message' },
        template(message, { numberOfLinks: links.length })
      ),
      h(
        'ul',
        { className: 'incoming-links__list' },
        links.map(link => {
          const title = link.title || 'Untitled';
          return h(
            'li',
            {
              key: link.url,
              className: 'incoming-links__item'
            },
            h(
              'a',
              {
                'data-test-id': 'link',
                className: 'incoming-links__link',
                href: link.url,
                target: '_blank',
                rel: 'noopener',
                title
              },
              title
            )
          );
        })
      )
    );
  }
});

IncomingLinksList.propTypes = {
  links: PropTypes.array.isRequired,
  message: PropTypes.string.isRequired
};

export default IncomingLinksList;
