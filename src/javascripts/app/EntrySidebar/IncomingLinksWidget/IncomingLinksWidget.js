import React from 'react';
import PropTypes from 'prop-types';

import IncomingLinksList from 'app/entity_editor/Components/IncomingLinksList';
import IncomingLinksListError from 'app/entity_editor/Components/IncomingLinksList/Error';
import FetchLinksToEntity, {
  RequestState
} from 'app/entity_editor/Components/FetchLinksToEntity';
import { EntityType, getNumberOfLinks } from 'app/entity_editor/Components/constants';
import messages from './messages';
import EntrySidebarWidget from '../EntrySidebarWidget';

import {
  onIncomingLinkClick as trackIncomingLinkClick,
  Origin as IncomingLinksOrigin
} from 'analytics/events/IncomingLinks';

function getMessages({ entityInfo, links }) {
  const numberOfLinks = getNumberOfLinks(links);
  return messages[entityInfo.type][numberOfLinks];
}

export default class SidebarIncomingLinks extends React.Component {
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
      <EntrySidebarWidget testId="sidebar-incoming-links-section" title="Links">
        {entityInfo && (
          <FetchLinksToEntity
            {...entityInfo}
            origin={IncomingLinksOrigin.SIDEBAR}
            render={({ links, requestState }) => (
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
            )}
          />
        )}
      </EntrySidebarWidget>
    );
  }
}