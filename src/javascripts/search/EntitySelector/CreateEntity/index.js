import React from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';
import { goToSlideInEntity } from 'navigation/SlideInNavigator';
import CreateEntryLinkButton from 'components/CreateEntryButton/CreateEntryLinkButton';
import Visible from 'components/shared/Visible';
import * as logger from 'services/logger';
import * as entityCreator from 'components/app_container/entityCreator';

import * as accessChecker from 'access_control/AccessChecker';

export const entityTypes = {
  Entry: 'Entry',
  Asset: 'Asset',
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
  hasPlusIcon: PropTypes.bool,
};

function CreateEntry(props) {
  const allowedContentTypes = props.contentTypes.filter((ct) =>
    accessChecker.canPerformActionOnEntryOfType(accessChecker.Action.CREATE, ct.sys.id)
  );

  const text =
    allowedContentTypes.length === 1
      ? `Create new ${allowedContentTypes[0].name}`
      : 'Create new entry';
  return (
    allowedContentTypes.length > 0 && (
      <CreateEntryLinkButton
        contentTypes={allowedContentTypes}
        onSelect={(contentTypeId) => onSelectHandler(contentTypeId, props.onSelect)}
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
  hasPlusIcon: PropTypes.bool,
  suggestedContentTypeId: PropTypes.string,
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
  onSelect: PropTypes.func.isRequired,
};

async function onSelectHandler(contentTypeId, cb) {
  const createEntity = () =>
    contentTypeId !== null ? entityCreator.newEntry(contentTypeId) : entityCreator.newAsset();
  try {
    const entity = await createEntity();
    const slide = {
      id: entity.data.sys.id,
      type: entity.data.sys.type,
    };

    cb(entity.data);
    goToSlideInEntity(slide);
  } catch (error) {
    logger.logError('Failed to create new entry from entity selector', { error });
  }
}

export default CreateEntity;
