import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { TagsAutocomplete } from './TagsAutocomplete';
import { useReadTags } from 'features/content-tags/core/hooks';
import {
  FormLabel,
  Notification,
  SkeletonRow,
  Table,
  TableBody,
  ValidationMessage,
} from '@contentful/forma-36-react-components';
import {
  AddOrRemoveRow,
  BULK_ACTION,
  ACTION_LABELS,
} from 'features/content-tags/editor/components/AddOrRemoveRow';
import {
  CHANGE_TYPE,
  useBulkTaggingProvider,
} from 'features/content-tags/editor/state/BulkTaggingProvider';
import { useFilteredTags } from 'features/content-tags/core/hooks/useFilteredTags';
import { CONTENTFUL_NAMESPACE } from 'features/content-tags/core/constants';
import { orderByLabel, tagsPayloadToOptions } from 'features/content-tags/editor/utils';
import { shouldAddInlineCreationItem } from 'features/content-tags/editor/utils';
import { useCanManageTags } from 'features/content-tags/core/hooks';
import { CreateTagModal } from 'features/content-tags/management/components/CreateTagModal';
import * as stringUtils from 'utils/StringUtils';

function useAddNewTag(addToBulkList) {
  // addedTagId is needed to get an updated version of addToBulkList
  const [addedTagId, setAddedTagId] = useState(null);
  const [newTagData, setNewTagData] = useState({});
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const { addTag: addTagInCacheData } = useReadTags();

  const resetInlineCreation = useCallback(() => {
    setIsCreatingTag(false);
    setNewTagData({});
    setAddedTagId(null);
  }, []);

  const onModalClose = useCallback(
    (createdTag) => {
      if (createdTag) {
        addTagInCacheData(createdTag);
        setAddedTagId(createdTag.sys.id);
      } else {
        resetInlineCreation();
      }
    },
    [addTagInCacheData, resetInlineCreation]
  );

  useEffect(() => {
    if (!isCreatingTag && Object.keys(newTagData).length) {
      setIsCreatingTag(true);
    }
  }, [isCreatingTag, newTagData]);

  useEffect(() => {
    if (addedTagId) {
      addToBulkList(addedTagId);
      resetInlineCreation();
    }
  }, [addedTagId, newTagData, addToBulkList, resetInlineCreation]);

  return { isCreatingTag, newTagData, setNewTagData, onModalClose };
}

// fetch unique tags with info on how entities they are attached to
const tagsWithOccurrence = (tags) => {
  return tags.reduce(
    (countsMap, tag) => countsMap.set(tag, countsMap.get(tag) + 1 || 1),
    new Map()
  );
};

const AddOrRemoveContentSection = ({ entityTags, entities, entityType }) => {
  const { isLoading, getTag } = useReadTags();
  const { setSearch, filteredTags, search } = useFilteredTags();
  const [validTagName, setValidTagName] = useState(true);
  const canManageTags = useCanManageTags();
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

  const localFilteredTags = useMemo(() => {
    const orderedPayload = orderByLabel(tagsPayloadToOptions(filteredTags));
    const filtered = orderedPayload.filter((tag) => currentState && !currentState.has(tag.value));

    return filtered.splice(0, Math.min(10, filtered.length));
  }, [filteredTags, currentState]);

  useEffect(() => {
    if (search.startsWith(CONTENTFUL_NAMESPACE)) {
      return setValidTagName(false);
    }
    setValidTagName(true);
  }, [search]);

  const tagEntry = useCallback(
    (tagId, occurrence) => {
      const tag = getTag(tagId);
      return {
        value: tagId,
        occurrence,
        label: tag.name,
        visibility: tag.sys.visibility,
      };
    },
    [getTag]
  );

  useEffect(() => {
    if (filteredTags.length > 0 && !hasChanges) {
      const tagsSet = tagsWithOccurrence(entityTags);

      tagsSet.forEach((occurrence, tagId) => {
        tagsSet.set(tagId, tagEntry(tagId, occurrence));
      });

      push(tagsSet);
    }
  }, [push, tagEntry, filteredTags, entityTags, getTag, hasChanges]);

  const onSearch = useCallback(
    (tagId) => {
      setSearch(tagId);
    },
    [setSearch]
  );

  const autocompleteItemTags = shouldAddInlineCreationItem(
    canManageTags,
    search,
    localFilteredTags,
    entityTags.map((tagValue) => ({ value: tagValue }))
  )
    ? [
        ...localFilteredTags,
        {
          inlineCreation: true,
          label: search,
          value: stringUtils.toIdentifier(search),
        },
      ]
    : [...localFilteredTags];

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

  const { newTagData, setNewTagData, isCreatingTag, onModalClose } = useAddNewTag(
    useCallback((tagId) => onAction(tagId, BULK_ACTION.ADD_TAG), [onAction])
  );

  const onSelect = useCallback(
    (tagItem) => {
      if (!validTagName) {
        Notification.error(
          `Nice try! Unfortunately, we keep the "contentful." tag ID prefix for internal purposes.`,
          {
            title: `Tag wasn’t created`,
          }
        );
        return;
      }
      if (tagItem.inlineCreation) {
        setNewTagData({ id: tagItem.value, name: tagItem.label });
      } else {
        onAction(tagItem.value, BULK_ACTION.ADD_TAG);
      }
    },
    [validTagName, onAction, setNewTagData]
  );

  const renderRow = useCallback(
    (tag) => {
      const getActionLabel = (tag) => {
        const appliedToAll = tag.occurrence === entityCount;
        switch (tag.changeType) {
          case CHANGE_TYPE.NONE:
            return appliedToAll ? ACTION_LABELS.NONE : ACTION_LABELS.APPLY_TO_ALL;
          case CHANGE_TYPE.REMOVED:
          case CHANGE_TYPE.ALL:
            return ACTION_LABELS.UNDO;
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
      {!validTagName && (
        <ValidationMessage>
          {` Nice try! Unfortunately, we keep the "contentful." tag ID prefix for internal purposes.`}
        </ValidationMessage>
      )}
      <TagsAutocomplete
        tags={autocompleteItemTags}
        isLoading={isLoading}
        onSelect={onSelect}
        onQueryChange={onSearch}
      />
      <Table layout="embedded">
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
      <CreateTagModal
        isInline
        inlineData={newTagData}
        isShown={isCreatingTag}
        onClose={onModalClose}
      />
    </div>
  );
};

AddOrRemoveContentSection.propTypes = {
  entityTags: PropTypes.array,
  entities: PropTypes.array,
  entityType: PropTypes.string,
};

export { AddOrRemoveContentSection };
