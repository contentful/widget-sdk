import {
  Notification,
  Paragraph,
  Tooltip,
  ValidationMessage,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { ConditionalWrapper } from 'features/content-tags/core/components/ConditionalWrapper';
import { FieldFocus } from 'features/content-tags/core/components/FieldFocus';
import { CONTENTFUL_NAMESPACE } from 'features/content-tags/core/constants';
import {
  useCanManageTags,
  useIsInitialLoadingOfTags,
  useReadTags,
} from 'features/content-tags/core/hooks';
import { TagsAutocomplete } from 'features/content-tags/editor/components/TagsAutocomplete';
import { EntityTags } from 'features/content-tags/editor/components/EntityTags';
import { useAllTagsGroups } from 'features/content-tags/core/hooks/useAllTagsGroups';
import { useFilteredTags } from 'features/content-tags/core/hooks/useFilteredTags';
import { TAGS_PER_ENTITY } from 'features/content-tags/core/limits';
import {
  orderByLabel,
  shouldAddInlineCreationItem,
  tagsPayloadToOptions,
} from 'features/content-tags/editor/utils';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as stringUtils from 'utils/StringUtils';
import { TagOption, TagSearchOption } from 'features/content-tags/types';
import { Conditional } from 'features/content-tags/core/components/Conditional';
import { Tag } from 'contentful-management/types';
import { CreateTagModal } from 'features/content-tags/management/components/CreateTagModal';

const styles = {
  wrapper: css({
    display: 'flex',
    justifyContent: 'space-between',
  }),
  tooltipWrapper: css({
    width: '100%',
  }),
};

type Props = {
  onAdd: (value: TagOption) => void;
  onRemove: (tagId: string) => void;
  selectedTags: TagOption[];
  disabled?: boolean;
  label: string;
  hasInlineTagCreation?: boolean;
};

const TagsSelection: React.FC<Props> = ({
  onAdd,
  onRemove,
  selectedTags = [],
  disabled = false,
  label = 'Tags',
  hasInlineTagCreation = false,
}) => {
  const { isLoading } = useReadTags();
  const { setSearch, filteredTags, search } = useFilteredTags();
  const isInitialLoad = useIsInitialLoadingOfTags();
  const tagGroups = useAllTagsGroups();
  const [validTagName, setValidTagName] = useState(true);
  const [newTagData, setNewTagData] = useState({});
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const canManageTags = useCanManageTags();

  const totalSelected = selectedTags.length;
  const maxTagsReached = totalSelected >= TAGS_PER_ENTITY;

  useEffect(() => {
    if (!isCreatingTag && Object.keys(newTagData).length) {
      setIsCreatingTag(true);
    }
  }, [newTagData, isCreatingTag]);

  const onSelect = useCallback(
    (item) => {
      if (!validTagName) {
        Notification.error(
          `Nice try! Unfortunately, we keep the "contentful." tag ID prefix for internal purposes.`,
          {
            title: `Tag wasn’t created`,
          }
        );
        return;
      }
      if (item.inlineCreation) {
        return setNewTagData({ id: item.value, name: item.label });
      }
      onAdd(item);
    },
    [onAdd, validTagName]
  );

  const resetInlineCreation = useCallback(() => {
    setIsCreatingTag(false);
    setNewTagData({});
  }, [setIsCreatingTag, setNewTagData]);

  const onModalClose = useCallback(
    (createdTag) => {
      if (createdTag) {
        onAdd({
          label: createdTag.name,
          value: createdTag.sys.id,
          visibility: createdTag.sys.visibility,
        });
      }
      resetInlineCreation();
    },
    [onAdd, resetInlineCreation]
  );

  const localFilteredTags = useMemo(() => {
    const filtered = orderByLabel<TagSearchOption & { inlineCreation?: boolean }>(
      tagsPayloadToOptions(
        filteredTags.filter(
          (tag: Tag) => !selectedTags.some((localTag) => localTag.value === tag.sys.id)
        )
      )
    );
    return filtered.splice(0, Math.min(10, filtered.length));
  }, [filteredTags, selectedTags]);

  useEffect(() => {
    if (search.startsWith(CONTENTFUL_NAMESPACE)) {
      return setValidTagName(false);
    }
    setValidTagName(true);
  }, [search]);

  if (
    hasInlineTagCreation &&
    shouldAddInlineCreationItem(canManageTags, search, localFilteredTags, selectedTags)
  ) {
    localFilteredTags.push({
      inlineCreation: true,
      label: search,
      value: stringUtils.toIdentifier(search),
    });
  }

  const renderTags = useMemo(() => {
    return (
      <FieldFocus>
        <div className={styles.wrapper}>
          <Paragraph>{label}</Paragraph>
        </div>
        <Conditional condition={!validTagName}>
          <ValidationMessage>
            {
              'Nice try! Unfortunately, we keep the "contentful." tag ID prefix for internal purposes.'
            }
          </ValidationMessage>
        </Conditional>
        <ConditionalWrapper
          condition={maxTagsReached || disabled}
          wrapper={(children) => (
            <Tooltip
              targetWrapperClassName={styles.tooltipWrapper}
              containerElement={'div'}
              content={
                disabled
                  ? `You don't have permission to edit this field. To change your permission setting contact your space admin.`
                  : `You can only add up to ${TAGS_PER_ENTITY} tags per entry or asset`
              }
              id="limitTip"
              place="top">
              {children}
            </Tooltip>
          )}>
          <TagsAutocomplete
            tags={localFilteredTags}
            isLoading={isLoading}
            onSelect={onSelect}
            disabled={maxTagsReached || disabled}
            onQueryChange={setSearch}
          />
        </ConditionalWrapper>
        <EntityTags
          disabled={disabled}
          tags={selectedTags}
          onRemove={onRemove}
          tagGroups={tagGroups}
        />
        <CreateTagModal
          isInline
          inlineData={newTagData}
          isShown={isCreatingTag}
          onClose={onModalClose}
        />
      </FieldFocus>
    );
  }, [
    selectedTags,
    localFilteredTags,
    isLoading,
    onSelect,
    setSearch,
    onRemove,
    tagGroups,
    maxTagsReached,
    disabled,
    label,
    validTagName,
    isCreatingTag,
    newTagData,
    onModalClose,
  ]);

  if (isInitialLoad) {
    return null;
  }

  if (!isLoading) {
    return renderTags;
  } else {
    return null;
  }
};

export { TagsSelection };
