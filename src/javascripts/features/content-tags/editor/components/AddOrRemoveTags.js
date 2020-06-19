import * as React from 'react';
import { useMemo } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { Note, Paragraph } from '@contentful/forma-36-react-components';
import { useBulkTaggingProvider } from 'features/content-tags/editor/state/BulkTaggingProvider';
import { FieldFocus } from 'features/content-tags/core/components/FieldFocus';
import { ReadTagsProvider } from 'features/content-tags/core/state/ReadTagsProvider';
import { TagsRepoProvider } from 'features/content-tags/core/state/TagsRepoProvider';
import { AddOrRemoveContentSection } from 'features/content-tags/editor/components/AddOrRemoveContentSection';

const styles = {
  wrapper: css({ padding: tokens.spacingL, width: '100%' }),
  entitiesCount: css({ marginBottom: tokens.spacingXl }),
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
        <TagsRepoProvider>
          <ReadTagsProvider>
            <AddOrRemoveContentSection
              entityTags={entityTags}
              entities={entities}
              entityType={entityType}
            />
          </ReadTagsProvider>
        </TagsRepoProvider>
      </FieldFocus>
      {hasChanges && (
        <Note title={'Pro tip'} className={styles.entitiesCount}>
          Use <code>Strg + Z</code> (Mac: <code>⌘ + Z</code>) to revert your changes
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
