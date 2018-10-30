const withServicesConsumer = require('../../../reactServiceContext').default;
import React from 'react';
import PropTypes from 'prop-types';

import { TextLink } from '@contentful/ui-component-library';

import CreateEntryButton, { Style } from '../../../components/CreateEntryButton';
import Visible from '../../../components/shared/Visible/index.es6';

export const entityTypes = {
  Entry: 'Entry',
  Asset: 'Asset'
};

const servicesShape = PropTypes.shape({
  accessChecker: PropTypes.object,
  logger: PropTypes.object,
  entityCreator: PropTypes.object
}).isRequired;

/**
 * Renders a create entry/asset button/link and triggers entity creation
 * and slidein redirection.
 */
export default withServicesConsumer(
  'logger',
  'entityCreator',
  {
    from: 'access_control/AccessChecker',
    as: 'accessChecker'
  },
  {
    from: 'navigation/SlideInNavigator',
    as: 'slideInNavigator'
  }
)(CreateEntity);

function CreateEntity({ type, contentTypes, suggestedContentTypeId, onSelect, $services }) {
  if (type === entityTypes.Entry) {
    return CreateEntry({ contentTypes, suggestedContentTypeId, onSelect, $services });
  }

  if (type === entityTypes.Asset) {
    return CreateAsset({ onSelect, $services });
  }

  throw new Error(`Unknown entity type ${type}`);
}

CreateEntity.propTypes = {
  type: PropTypes.oneOf([entityTypes.Entry, entityTypes.Asset]),
  contentTypes: PropTypes.array,
  suggestedContentTypeId: PropTypes.string,
  $services: servicesShape
};

function CreateEntry(props) {
  const allowedContentTypes = props.contentTypes.filter(ct =>
    props.$services.accessChecker.canPerformActionOnEntryOfType(
      props.$services.accessChecker.Action.CREATE,
      ct.sys.id
    )
  );
  return (
    allowedContentTypes.length > 0 && (
      <CreateEntryButton
        style={Style.Link}
        disabled={false}
        contentTypes={allowedContentTypes}
        onSelect={contentTypeId => onSelectHandler(contentTypeId, props.$services, props.onSelect)}
        text="Create new entry"
        suggestedContentTypeId={props.suggestedContentTypeId}
      />
    )
  );
}

CreateEntry.propTypes = {
  contentTypes: PropTypes.array,
  onSelect: PropTypes.func,
  $services: servicesShape
};

function CreateAsset(props) {
  return (
    <Visible
      if={props.$services.accessChecker.can(props.$services.accessChecker.Action.CREATE, 'asset')}>
      <TextLink
        testId="create-asset"
        onClick={() => onSelectHandler(null, props.$services, props.onSelect)}
        icon="Plus">
        Create new asset
      </TextLink>
    </Visible>
  );
}

CreateAsset.propTypes = {
  onSelect: PropTypes.func,
  $services: servicesShape
};

async function onSelectHandler(contentTypeId, $services, cb) {
  const createEntity = () =>
    contentTypeId !== null
      ? $services.entityCreator.newEntry(contentTypeId)
      : $services.entityCreator.newAsset();
  try {
    const entity = await createEntity();
    const slide = {
      id: entity.data.sys.id,
      type: entity.data.sys.type
    };
    const canSlideIn = true;
    cb(entity.data);
    $services.slideInNavigator.goToSlideInEntity(slide, canSlideIn);
  } catch (error) {
    $services.logger.logError('Failed to create new entry from entity selector', { error });
  }
}
