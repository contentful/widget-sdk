import { noop } from 'lodash';
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

const TYPES = {
  ENTRY: 'Entry',
  ASSET: 'Asset'
};
const TYPE_NAMES = {
  Entry: 'entry',
  Asset: 'asset'
};

export default class LinkEditor extends React.Component {
  static propTypes = {
    value: PropTypes.arrayOf(CfPropTypes.Link).isRequired,
    isDisabled: PropTypes.bool,
    onChange: PropTypes.func,
    onAction: PropTypes.func,
    type: PropTypes.oneOf(Object.values(TYPES)).isRequired,
    style: PropTypes.oneOf(['link', 'card']).isRequired,
    isSingle: PropTypes.bool.isRequired,
    contentTypes: PropTypes.arrayOf(PropTypes.object),
    actions: PropTypes.shape({
      selectEntities: PropTypes.func,
      editLinkTarget: PropTypes.func,
      createEntity: PropTypes.func
    })
  };

  static defaultProps = {
    value: [],
    onChange: noop,
    onAction: noop,
    single: false
  };

  getLinks() {
    return this.props.value;
  }

  render() {
    // TODO:danwe the `key` needs to take multiple links with same id into consideration!
    const { isDisabled, isSingle } = this.props;
    const links = this.getLinks();
    const showLinkButtons = !isDisabled && (!isSingle || links.length === 0);
    return (
      <div className="link-editor">
        <ol>
          {links.map((link, index) => (
            <li key={`${link.sys.id}`}>{this.renderCard(link, index)}</li>
          ))}
        </ol>
        {showLinkButtons && this.renderLinkButtons()}
      </div>
    );
  }

  renderCard(link, index) {
    const { isDisabled } = this.props;
    const handleEditLink = () => this.handleEditLink(link);
    const entityType = link.sys.linkType;
    return (
      <FetchedEntityCard
        entityType={entityType}
        entityId={link.sys.id}
        readOnly={false}
        disabled={isDisabled}
        editable={true}
        selected={false}
        onEntityFetchComplete={noop}
        onEdit={handleEditLink}
        onRemove={() => this.handleRemoveLinkAt(index)}
        onClick={handleEditLink}
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
    const { type, contentTypes, isDisabled } = this.props;
    const typeName = TYPE_NAMES[type];
    // TODO:danwe: Disable Create asset button and loading spinner.
    return (
      <div className="link-editor__feature-at-11-2017-lots-of-cts-add-entry-and-link-reference">
        <Visible if={type === TYPES.ENTRY}>
          <CreateEntryButton
            text={`Create ${typeName} and link`}
            contentTypes={contentTypes}
            disabled={isDisabled && contentTypes && contentTypes.length > 0}
            hasPlusIcon={true}
            style={CreateEntryStyle.Link}
            onSelect={this.handleCreateAndLink}
          />
        </Visible>
        <Visible if={type === TYPES.ASSET}>
          <TextLink onClick={this.handleCreateAndLink} linkType="primary" icon="Link">
            Create {typeName} and link
          </TextLink>
        </Visible>
        <TextLink onClick={this.handleSelectAndLink} linkType="primary" icon="Link">
          Link existing {typeName}
        </TextLink>
      </div>
    );
  }

  handleEditLink = link => {
    this.props.actions.editLinkTarget(link);
  };

  handleAddLinks = links => {
    const newValue = this.getLinks().concat(links);
    this.props.onChange(newValue);
  };

  handleRemoveLinkAt = index => {
    const newValue = this.getLinks().slice();
    newValue.splice(index, 1);
    this.props.onChange(newValue);
  };

  handleCreateAndLink = async contentTypeId => {
    const entity = await this.props.actions.createEntity(contentTypeId);
    const newLink = entityToLink(entity);
    this.handleAddLinks([newLink]);
    this.handleEditLink(newLink);
  };

  handleSelectAndLink = async () => {
    const entities = await this.props.actions.selectEntities();
    this.handleAddLinks(entities.map(entityToLink));
  };
}

function entityToLink(entity) {
  return { sys: { type: 'Link', id: entity.sys.id, linkType: entity.sys.type } };
}
