import React from 'libs/react';
import PropTypes from 'libs/prop-types';
import createReactClass from 'create-react-class';

import IncomingLinksList from '../IncomingLinksList';
import IncomingLinksListError from '../IncomingLinksList/Error';
import FetchLinksToEntity, { RequestState } from '../FetchLinksToEntity';
import { EntityType, getNumberOfLinks } from '../constants';
import messages from './messages';

import {
  onIncomingLinkClick as trackIncomingLinkClick,
  Origin as IncomingLinksOrigin
} from 'analytics/events/IncomingLinks';

const SidebarIncomingLinks = createReactClass({
  propTypes: {
    entityInfo: PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf([
        EntityType.ASSET,
        EntityType.ENTRY
      ])
    })
  },
  handleClick ({ linkEntityId, incomingLinksCount }) {
    trackIncomingLinkClick({
      linkEntityId,
      origin: IncomingLinksOrigin.SIDEBAR,
      entityId: this.props.entityInfo.id,
      entityType: this.props.entityInfo.type,
      incomingLinksCount
    });
  },
  render () {
    const { entityInfo } = this.props;

    return (
      <FetchLinksToEntity
        {...entityInfo}
        origin={IncomingLinksOrigin.SIDEBAR}
        render={({ links, requestState }) => (
          <div data-test-id="sidebar-incoming-links-section">
            <h2 className="entity-sidebar__heading">Links</h2>
            <div className="entity-sidebar__incoming-links">
              {
                requestState === RequestState.SUCCESS &&
                  <IncomingLinksList
                    origin={IncomingLinksOrigin.SIDEBAR}
                    entityId={entityInfo.id}
                    entityType={entityInfo.type}
                    links={links}
                    message={getMessages({ entityInfo, links }).subtitle}
                    onClick={this.handleClick}
                  />
              }
              {
                requestState === RequestState.ERROR &&
                  <IncomingLinksListError />
              }
            </div>
          </div>
        )}
      />
    );
  }
});

function getMessages ({ entityInfo, links }) {
  const numberOfLinks = getNumberOfLinks(links);
  return messages[entityInfo.type][numberOfLinks];
}

export default SidebarIncomingLinks;
