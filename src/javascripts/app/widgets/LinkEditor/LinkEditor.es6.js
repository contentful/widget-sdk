import { noop } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import CfPropTypes from 'utils/CfPropTypes.es6';
import FetchedEntityCard from '../shared/FetchedEntityCard/index.es6';
import LinkingActions from './LinkingActions.es6';
import { TYPES, entityToLink } from './Util.es6';
import SortableLinkList, { DragHandle, linksToListItems } from './SortableLinkList.es6';

const STYLE = {
  LINK: 'link',
  CARD: 'card'
};
const VIEW_MODE = {
  LIST: 'list',
  GRID: 'grid'
};

export default class LinkEditor extends React.Component {
  static propTypes = {
    value: PropTypes.arrayOf(CfPropTypes.Link).isRequired,
    isDisabled: PropTypes.bool,
    onChange: PropTypes.func,
    onLinkEntities: PropTypes.func,
    onUnlinkEntities: PropTypes.func,
    onLinkFetchComplete: PropTypes.func,
    type: PropTypes.oneOf(Object.values(TYPES)).isRequired,
    style: PropTypes.oneOf(Object.values(STYLE)).isRequired,
    isSingle: PropTypes.bool,
    canCreateEntity: PropTypes.bool,
    contentTypes: PropTypes.arrayOf(PropTypes.object),
    actions: PropTypes.shape({
      selectEntities: PropTypes.func,
      editLinkedEntity: PropTypes.func,
      createEntity: PropTypes.func
    }).isRequired
  };

  static defaultProps = {
    value: [],
    onChange: noop,
    onLinkEntities: noop,
    onUnlinkEntities: noop,
    onLinkFetchComplete: noop,
    style: STYLE.CARD,
    canCreateEntity: true
  };

  getLinks() {
    return this.props.value;
  }

  getViewMode() {
    const { type, style } = this.props;
    return type === TYPES.ASSET && style === STYLE.CARD ? VIEW_MODE.GRID : VIEW_MODE.LIST;
  }

  getCardStyle() {
    if (this.getViewMode() === VIEW_MODE.GRID) {
      return 'small'; // Image gallery case.
    }
    return this.props.style === STYLE.LINK ? 'small' : 'default';
  }

  handleEditLink = (entity, index) => {
    this.props.actions.editLinkedEntity(entity, index);
  };

  handleAddLinks = (entities, isNewlyCreatedLinks = false) => {
    this.props.onLinkEntities(entities, isNewlyCreatedLinks);
    const links = entities.map(entityToLink);
    const newValue = this.getLinks().concat(links);
    this.props.onChange(newValue);
  };

  handleRemoveLinkAt = (index, entity) => {
    if (entity) {
      // Entity is not known when removing a "missing entity" link.
      this.props.onUnlinkEntities([entity]);
    }
    const newValue = this.getLinks().slice();
    newValue.splice(index, 1);
    this.props.onChange(newValue);
  };

  handleLinkSortEnd = (oldIndex, newIndex) => {
    if (oldIndex !== newIndex) {
      const newLinks = this.getLinks().slice();
      newLinks.splice(newIndex, 0, newLinks.splice(oldIndex, 1)[0]);
      this.props.onChange(newLinks);
    }
  };

  handleCreateAndLink = async contentTypeId => {
    const entity = await this.props.actions.createEntity(contentTypeId);
    if (entity) {
      this.handleAddLinks([entity], true);
    }
  };

  handleSelectAndLink = async () => {
    const entities = await this.props.actions.selectEntities();
    this.handleAddLinks(entities);
  };

  renderCard(link, index, cardStyle) {
    const { isSingle, isDisabled, onLinkFetchComplete } = this.props;
    const handleEditLink = fetchEntityResult =>
      this.handleEditLink(fetchEntityResult.entity, index);
    const entityType = link.sys.linkType;
    return (
      <FetchedEntityCard
        entityType={entityType}
        entityId={link.sys.id}
        size={cardStyle}
        readOnly={false}
        disabled={isDisabled}
        editable={true}
        selected={false}
        onEntityFetchComplete={() => onLinkFetchComplete()}
        onEdit={handleEditLink}
        onClick={handleEditLink}
        onRemove={fetchEntityResult => {
          this.handleRemoveLinkAt(index, fetchEntityResult.entity);
        }}
        className="link-editor__entity-card"
        cardDragHandleComponent={isSingle ? null : <DragHandle />}
      />
    );
  }

  render() {
    const { type, isDisabled, isSingle, canCreateEntity, contentTypes } = this.props;
    const cardStyle = this.getCardStyle();
    const items = linksToListItems(this.getLinks(), (link, index) =>
      this.renderCard(link, index, cardStyle)
    );
    const showLinkButtons = !isDisabled && (!isSingle || items.length === 0);
    const isGrid = this.getViewMode() === VIEW_MODE.GRID;
    return (
      <div className={`link-editor ${isGrid ? 'x--contains-asset-cards' : ''}`}>
        <SortableLinkList
          useDragHandle={true}
          axis={isGrid ? 'xy' : 'y'}
          items={items}
          onSortEnd={({ oldIndex, newIndex }) => this.handleLinkSortEnd(oldIndex, newIndex)}
        />
        {showLinkButtons && (
          <LinkingActions
            type={type}
            isDisabled={isDisabled}
            isSingle={isSingle}
            canCreateEntity={canCreateEntity}
            contentTypes={contentTypes}
            onCreateAndLink={this.handleCreateAndLink}
            onLinkExisting={this.handleSelectAndLink}
          />
        )}
      </div>
    );
  }
}
