import React, { useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { TagsAutocomplete } from './TagsAutocomplete';
import { useReadTags } from 'features/content-tags/core/hooks';
import { FormLabel, SkeletonRow, Table, TableBody } from '@contentful/forma-36-react-components';
import {
  AddOrRemoveRow,
  BULK_ACTION,
} from 'features/content-tags/editor/components/AddOrRemoveRow';
import {
  CHANGE_TYPE,
  useBulkTaggingProvider,
} from 'features/content-tags/editor/state/BulkTaggingProvider';
import { useFilteredTags } from 'features/content-tags/core/hooks/useFilteredTags';

const styles = {
  addOrRemoveTable: css({ border: 'none' }),
};

// fetch unique tags with info on how entities they are attached to
const tagsWithOccurrence = (tags) => {
  return tags.reduce(
    (countsMap, tag) => countsMap.set(tag, countsMap.get(tag) + 1 || 1),
    new Map()
  );
};

const AddOrRemoveContentSection = ({ entityTags, entities, entityType }) => {
  const { isLoading, getTag } = useReadTags();
  const { setSearch, filteredTags } = useFilteredTags();
  const entityCount = entities.length;
  const {
    push,
    renderState,
    tagAdd,
    tagReset,
    tagRemove,
    tagApplyToAll,
    currentState,
    hasChanges,
  } = useBulkTaggingProvider();

  const tags = useMemo(() => {
    if (filteredTags.length > 0) {
      return filteredTags.map((tag) => ({ value: tag.sys.id, label: tag.name }));
    }
    return [];
  }, [filteredTags]);

  const searchTags = tags.filter((tag) => currentState && !currentState.has(tag.value));

  const tagEntry = useCallback(
    (tag, occurrence) => {
      return {
        value: tag,
        occurrence,
        label: getTag(tag).name,
      };
    },
    [getTag]
  );

  useEffect(() => {
    if (tags.length > 0 && !hasChanges) {
      const tagsSet = tagsWithOccurrence(entityTags);

      tagsSet.forEach((occurrence, tagId) => {
        tagsSet.set(tagId, tagEntry(tagId, occurrence));
      });

      push(tagsSet);
    }
  }, [push, tagEntry, tags, entityTags, getTag, hasChanges]);

  const onSearch = useCallback(
    (tagId) => {
      setSearch(tagId);
    },
    [setSearch]
  );

  const onAction = useCallback(
    (tag, action) => {
      switch (action) {
        case BULK_ACTION.REMOVE_TAG:
          tagRemove(tag);
          break;
        case BULK_ACTION.ALL_TAG:
          tagApplyToAll(tag, entityCount);
          break;
        case BULK_ACTION.ADD_TAG:
          tagAdd(tagEntry(tag, entities.length));
          break;
        case BULK_ACTION.RESET_TAG:
          tagReset(tag);
          break;
        default:
          throw `unknown action ${action}`;
      }
    },
    [tagEntry, entities.length, entityCount, tagReset, tagAdd, tagApplyToAll, tagRemove]
  );

  const onChange = (tag) => onAction(tag.value, BULK_ACTION.ADD_TAG);

  const renderRow = useCallback(
    (tag) => {
      const getActionLabel = (tag) => {
        const appliedToAll = tag.occurrence === entityCount;
        switch (tag.changeType) {
          case CHANGE_TYPE.NONE:
            return appliedToAll ? '' : 'Apply to all';
          case CHANGE_TYPE.REMOVED:
          case CHANGE_TYPE.ALL:
            return 'Undo';
          case CHANGE_TYPE.NEW:
            return '';
        }
      };

      return (
        <AddOrRemoveRow
          changeType={tag.changeType}
          key={tag.value}
          tag={tag}
          label={getActionLabel(tag)}
          meta={`${tag.occurrence} / ${entityCount} ${entityType}`}
          onAction={onAction}
        />
      );
    },
    [onAction, entityCount, entityType]
  );

  return (
    <div>
      <FormLabel htmlFor="Add tags">Add tags</FormLabel>
      <TagsAutocomplete
        tags={searchTags.splice(0, Math.min(5, searchTags.length))}
        isLoading={isLoading}
        onChange={onChange}
        onQueryChange={onSearch}
      />
      <Table className={styles.addOrRemoveTable}>
        <TableBody>
          {!isLoading ? (
            <>
              {renderState.newTags.map(renderRow)}
              {renderState.tags.map(renderRow)}
            </>
          ) : (
            <SkeletonRow rowCount={1} columnCount={3} />
          )}
        </TableBody>
      </Table>
    </div>
  );
};

AddOrRemoveContentSection.propTypes = {
  entityTags: PropTypes.array,
  entities: PropTypes.array,
  entityType: PropTypes.string,
};

export { AddOrRemoveContentSection };
