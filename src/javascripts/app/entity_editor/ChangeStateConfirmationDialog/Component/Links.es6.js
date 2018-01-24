import { createElement as h } from 'libs/react';
import PropTypes from 'libs/prop-types';
import createReactClass from 'create-react-class';
import { template } from './Messages';

const Links = createReactClass({
  displayName: 'Links',
  render () {
    const { links, message } = this.props;
    return h(
      'div',
      {
        'data-test-id': 'links'
      },
      h('p', null, template(message, { numberOfLinks: links.length })),
      h(
        'ul',
        { className: 'state-change-confirmation-dialog__links-list' },
        links.map(link => {
          const title = link.title || 'Untitled';
          return h(
            'li',
            {
              key: link.url
            },
            h(
              'a',
              {
                'data-test-id': 'link',
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

Links.propTypes = {
  links: PropTypes.array.isRequired,
  message: PropTypes.string.isRequired
};

export default Links;
