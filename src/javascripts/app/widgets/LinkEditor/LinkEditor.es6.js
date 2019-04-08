import { noop } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import CfPropTypes from 'utils/CfPropTypes.es6';
import FetchedEntityCard from '../shared/FetchedEntityCard/index.es6';
import LinkingActions from './LinkingActions.es6';
import { TYPES, entityToLink } from './Util.es6';

export const labels = {
  createAndLink: name => `Create new ${name} and link`,
  linkExisting: name => `Link existing ${name}`
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
    style: PropTypes.oneOf(['link', 'card']).isRequired,
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
    style: 'card',
    canCreateEntity: true
  };

  getLinks() {
    return this.props.value;
  }

  render() {
    const { type, isDisabled, isSingle, canCreateEntity, contentTypes } = this.props;
    const links = this.getLinks();
    const linkKeys = getLinkKeys(links);
    const showLinkButtons = !isDisabled && (!isSingle || links.length === 0);
    return (
      <div className="link-editor">
        <ol>
          {links.map((link, index) => (
            <li key={linkKeys[index]}>{this.renderCard(link, index)}</li>
          ))}
        </ol>
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

  renderCard(link, index) {
    const { isDisabled, onLinkFetchComplete } = this.props;
    const handleEditLink = fetchEntityResult => this.handleEditLink(fetchEntityResult.entity);
    const entityType = link.sys.linkType;
    return (
      <FetchedEntityCard
        entityType={entityType}
        entityId={link.sys.id}
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
        buildCard={(allProps, RecommendedCardComponent) => {
          const props = { ...allProps };
          // TODO:danwe Optimize what we load instead of disposing already fetched info!
          if (entityType === TYPES.ENTRY && this.props.style === 'link') {
            delete props.entityDescription;
            delete props.entityFile;
          }
          return <RecommendedCardComponent {...props} />;
        }}
      />
    );
  }

  handleEditLink = entity => {
    this.props.actions.editLinkedEntity(entity);
  };

  handleAddLinks = (entities, isNewlyCreatedLinks = false) => {
    this.props.onLinkEntities(entities, isNewlyCreatedLinks);
    const links = entities.map(entityToLink);
    const newValue = this.getLinks().concat(links);
    this.props.onChange(newValue);
  };

  handleRemoveLinkAt = (index, entity) => {
    this.props.onUnlinkEntities([entity]);
    const newValue = this.getLinks().slice();
    newValue.splice(index, 1);
    this.props.onChange(newValue);
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
}

function getLinkKeys(links) {
  const countPerId = {};
  return links.map(link => {
    const { id } = link.sys;
    countPerId[id] = (countPerId[id] || 0) + 1;
    return `${id}:${countPerId[id] - 1}`;
  });
}
