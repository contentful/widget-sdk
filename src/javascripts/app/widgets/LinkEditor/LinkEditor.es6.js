import { noop } from 'lodash';
import pluralize from 'pluralize';
import React from 'react';
import PropTypes from 'prop-types';
import CfPropTypes from 'utils/CfPropTypes.es6';
import Visible from 'components/shared/Visible/index.es6';
import { TextLink } from '@contentful/forma-36-react-components';
import FetchedEntityCard from '../shared/FetchedEntityCard/index.es6';
import {
  default as CreateEntryButton,
  Style as CreateEntryStyle
} from 'components/CreateEntryButton/index.es6';
import { entityToLink } from './Util.es6';

const TYPES = {
  ENTRY: 'Entry',
  ASSET: 'Asset'
};
const TYPE_NAMES = {
  [TYPES.ENTRY]: 'entry',
  [TYPES.ASSET]: 'asset'
};

const labels = {
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
    isSingle: false,
    canCreateEntity: true
  };

  getLinks() {
    return this.props.value;
  }

  render() {
    const { isDisabled, isSingle } = this.props;
    const links = this.getLinks();
    const showLinkButtons = !isDisabled && (!isSingle || links.length === 0);
    const countPerId = {};
    const listElements = links.map((link, index) => {
      const { id } = link.sys;
      countPerId[id] = (countPerId[id] || 0) + 1;
      const key = `${id}:${countPerId[id] - 1}`;
      return <li key={key}>{this.renderCard(link, index)}</li>;
    });
    return (
      <div className="link-editor">
        <ol>{listElements}</ol>
        {showLinkButtons && this.renderLinkButtons()}
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

  renderLinkButtons() {
    const { type, contentTypes, isSingle, canCreateEntity } = this.props;
    const typeName = TYPE_NAMES[type];
    const singleCtOrTypeName = contentTypes.length === 1 ? contentTypes[0].name : typeName;
    return (
      <div className="link-editor__feature-at-11-2017-lots-of-cts-add-entry-and-link-reference">
        <Visible if={type === TYPES.ENTRY && canCreateEntity}>
          <CreateEntryButton
            text={labels.createAndLink(singleCtOrTypeName)}
            contentTypes={contentTypes}
            hasPlusIcon={true}
            style={CreateEntryStyle.Link}
            onSelect={this.handleCreateAndLink}
          />
        </Visible>
        <Visible if={type === TYPES.ASSET && canCreateEntity}>
          <TextLink onClick={() => this.handleCreateAndLink(null)} linkType="primary" icon="Link">
            {labels.createAndLink(typeName)}
          </TextLink>
        </Visible>
        <TextLink onClick={this.handleSelectAndLink} linkType="primary" icon="Link">
          {labels.linkExisting(isSingle ? typeName : pluralize(typeName))}
        </TextLink>
      </div>
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
