import React from 'react';
import PropTypes from 'prop-types';

import IncomingLinksList from '../IncomingLinksList/index.es6';
import IncomingLinksListError from '../IncomingLinksList/Error.es6';
import FetchLinksToEntity, { RequestState } from '../FetchLinksToEntity/index.es6';
import { EntityType, getNumberOfLinks } from '../constants.es6';
import messages from './messages.es6';

import {
  onIncomingLinkClick as trackIncomingLinkClick,
  Origin as IncomingLinksOrigin
} from 'analytics/events/IncomingLinks.es6';

class SidebarIncomingLinks extends React.Component {
  static propTypes = {
    entityInfo: PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf([EntityType.ASSET, EntityType.ENTRY])
    })
  };

  handleClick = ({ linkEntityId, incomingLinksCount }) => {
    trackIncomingLinkClick({
      linkEntityId,
      origin: IncomingLinksOrigin.SIDEBAR,
      entityId: this.props.entityInfo.id,
      entityType: this.props.entityInfo.type,
      incomingLinksCount
    });
  };

  render() {
    const { entityInfo } = this.props;

    return (
      <FetchLinksToEntity
        {...entityInfo}
        origin={IncomingLinksOrigin.SIDEBAR}
        render={({ links, requestState }) => (
          <div data-test-id="sidebar-incoming-links-section">
            <h2 className="entity-sidebar__heading">Links</h2>
            <div className="entity-sidebar__incoming-links">
              {requestState === RequestState.SUCCESS && (
                <IncomingLinksList
                  origin={IncomingLinksOrigin.SIDEBAR}
                  entityId={entityInfo.id}
                  entityType={entityInfo.type}
                  links={links}
                  message={getMessages({ entityInfo, links }).subtitle}
                  onClick={this.handleClick}
                />
              )}
              {requestState === RequestState.ERROR && <IncomingLinksListError />}
            </div>
          </div>
        )}
      />
    );
  }
}

function getMessages({ entityInfo, links }) {
  const numberOfLinks = getNumberOfLinks(links);
  return messages[entityInfo.type][numberOfLinks];
}

export default SidebarIncomingLinks;
