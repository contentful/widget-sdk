import * as React from 'react';
import { useMemo } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { Note, Paragraph } from '@contentful/forma-36-react-components';
import { useBulkTaggingProvider } from 'features/content-tags/editor/state/BulkTaggingProvider';
import { FieldFocus } from 'features/content-tags/core/components/FieldFocus';
import { AddOrRemoveContentSection } from 'features/content-tags/editor/components/AddOrRemoveContentSection';
import { MetadataTags } from 'features/content-tags/core/state/MetadataTags';

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

  return (
    <div className={styles.wrapper}>
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
