import { createElement as h } from 'libs/react';
import PropTypes from 'libs/prop-types';
import createReactClass from 'create-react-class';

import IncomingLinksList from '../IncomingLinksList';
import IncomingLinksListError from '../IncomingLinksList/Error';
import FetchLinksToEntity, { RequestState } from '../FetchLinksToEntity';
import { EntityType, getNumberOfLinks } from '../constants';
import messages from './messages';

const SidebarIncomingLinks = createReactClass({
  propTypes: {
    entityInfo: PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf([EntityType.ASSET, EntityType.ENTRY])
    })
  },
  render () {
    const { entityInfo } = this.props;

    return h(FetchLinksToEntity, {
      id: entityInfo.id,
      type: entityInfo.type,
      render: ({ links, requestState }) => {
        const entityMessages = getMessages({
          entityInfo,
          links
        });
        return h(
          'div',
          {
            'data-test-id': 'sidebar-incoming-links-section'
          },
          h('h2', { className: 'entity-sidebar__heading' }, 'Links'),
          h(
            'div',
            { className: 'entity-sidebar__incoming-links' },
            requestState === RequestState.SUCCESS &&
              h(IncomingLinksList, {
                links,
                message: entityMessages.subtitle
              }),
            requestState === RequestState.ERROR && h(IncomingLinksListError)
          )
        );
      }
    });
  }
});

function getMessages ({ entityInfo, links }) {
  const numberOfLinks = getNumberOfLinks(links);
  return messages[entityInfo.type][numberOfLinks];
}

export default SidebarIncomingLinks;
