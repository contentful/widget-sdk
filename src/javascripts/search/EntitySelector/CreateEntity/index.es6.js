import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import { TextLink } from '@contentful/forma-36-react-components';

import CreateEntryButton, { Style } from 'components/CreateEntryButton/index.es6';
import Visible from 'components/shared/Visible/index.es6';

const logger = getModule('logger');
const entityCreator = getModule('entityCreator');
const accessChecker = getModule('access_control/AccessChecker');
const slideInNavigator = getModule('navigation/SlideInNavigator');

export const entityTypes = {
  Entry: 'Entry',
  Asset: 'Asset'
};

/**
 * Renders a create entry/asset button/link and triggers entity creation
 * and slidein redirection.
 */

function CreateEntity(props) {
  const { type, ...otherProps } = props;
  if (type === entityTypes.Entry) {
    return <CreateEntry {...otherProps} />;
  }

  if (type === entityTypes.Asset) {
    return <CreateAsset onSelect={props.onSelect} />;
  }
}

CreateEntity.propTypes = {
  type: PropTypes.oneOf([entityTypes.Entry, entityTypes.Asset]).isRequired,
  contentTypes: PropTypes.array,
  suggestedContentTypeId: PropTypes.string,
  hasPlusIcon: PropTypes.bool
};

function CreateEntry(props) {
  const allowedContentTypes = props.contentTypes.filter(ct =>
    accessChecker.canPerformActionOnEntryOfType(accessChecker.Action.CREATE, ct.sys.id)
  );

  const text =
    allowedContentTypes.length === 1
      ? `Create new ${allowedContentTypes[0].name}`
      : 'Create new entry';
  return (
    allowedContentTypes.length > 0 && (
      <CreateEntryButton
        style={Style.Link}
        disabled={false}
        contentTypes={allowedContentTypes}
        onSelect={contentTypeId => onSelectHandler(contentTypeId, props.onSelect)}
        text={text}
        hasPlusIcon={props.hasPlusIcon}
        suggestedContentTypeId={props.suggestedContentTypeId}
      />
    )
  );
}

CreateEntry.propTypes = {
  contentTypes: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  hasPlusIcon: PropTypes.bool
};

function CreateAsset(props) {
  return (
    <Visible if={accessChecker.canCreateAsset()}>
      <TextLink
        testId="create-asset"
        onClick={() => onSelectHandler(null, props.onSelect)}
        icon="Plus">
        Create new asset
      </TextLink>
    </Visible>
  );
}

CreateAsset.propTypes = {
  onSelect: PropTypes.func.isRequired
};

async function onSelectHandler(contentTypeId, cb) {
  const createEntity = () =>
    contentTypeId !== null ? entityCreator.newEntry(contentTypeId) : entityCreator.newAsset();
  try {
    const entity = await createEntity();
    const slide = {
      id: entity.data.sys.id,
      type: entity.data.sys.type
    };

    cb(entity.data);
    slideInNavigator.goToSlideInEntity(slide);
  } catch (error) {
    logger.logError('Failed to create new entry from entity selector', { error });
  }
}

export default CreateEntity;
