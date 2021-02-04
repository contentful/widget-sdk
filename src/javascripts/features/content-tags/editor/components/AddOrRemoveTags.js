import * as React from 'react';
import { useMemo, useCallback } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { Note, Paragraph } from '@contentful/forma-36-react-components';
import { useAsync } from 'core/hooks';
import { useBulkTaggingProvider } from 'features/content-tags/editor/state/BulkTaggingProvider';
import { FieldFocus } from 'features/content-tags/core/components/FieldFocus';
import { AddOrRemoveContentSection } from 'features/content-tags/editor/components/AddOrRemoveContentSection';
import { MetadataTags } from 'features/content-tags/core/state/MetadataTags';
import { useContentLevelPermissions } from 'features/content-tags/core/hooks/useContentLevelPermissions';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getSpaceFeature, FEATURES, DEFAULT_FEATURES_STATUS } from 'data/CMA/ProductCatalog';

const styles = {
  wrapper: css({ padding: tokens.spacingL, width: '100%' }),
  entitiesCount: css({ marginBottom: tokens.spacingXl }),
  nodeHeading: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
};

// extract all the tag ids from the selected entities
const tagsFromEntities = (entities) => {
  return entities
    .reduce((result, entity) => {
      result.push(entity.data.metadata.tags.map((tag) => tag.sys.id));
      return result;
    }, [])
    .flat();
};

const AddOrRemoveTags = ({ selectedEntities: entities }) => {
  const entityTags = useMemo(() => tagsFromEntities(entities), [entities]);
  const type = entities[0].data.sys.type;
  const entityType = { Entry: 'entries', Asset: 'assets' }[type];

  const { hasChanges } = useBulkTaggingProvider();
  const { contentLevelPermissionsEnabled } = useContentLevelPermissions();
  const { currentSpaceId: spaceId } = useSpaceEnvContext();

  const hasCustomRolesFeatureCheck = useCallback(async () => {
    return await getSpaceFeature(
      spaceId,
      FEATURES.CUSTOM_ROLES_FEATURE,
      DEFAULT_FEATURES_STATUS.CUSTOM_ROLES_FEATURE
    );
  }, [spaceId]);

  const { data: hasCustomRolesFeature } = useAsync(hasCustomRolesFeatureCheck);

  return (
    <div className={styles.wrapper}>
      {hasCustomRolesFeature && contentLevelPermissionsEnabled && (
        <Note className={styles.entitiesCount}>
          <span className={styles.nodeHeading}>Carefully add and remove tags</span>
          <div>
            You could unintentionally give or revoke access to this {entityType} for anyone in this
            space, including yourself.
          </div>
        </Note>
      )}

      <Paragraph className={styles.entitiesCount}>
        {entities.length} {entityType} selected
      </Paragraph>
      <FieldFocus>
        <MetadataTags>
          <AddOrRemoveContentSection
            entityTags={entityTags}
            entities={entities}
            entityType={entityType}
          />
        </MetadataTags>
      </FieldFocus>
      {hasChanges && (
        <Note className={styles.entitiesCount}>
          Tip: Use <code>Ctrl + Z</code> (Mac: <code>Cmd + Z</code>) to undo
        </Note>
      )}
    </div>
  );
};

AddOrRemoveTags.propTypes = {
  selectedEntities: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    })
  ),
};

export { AddOrRemoveTags };
