import PropTypes from 'prop-types';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Paragraph,
  Tooltip,
  ValidationMessage,
  Notification,
  Spinner,
} from '@contentful/forma-36-react-components';
import { TagsAutocomplete } from 'features/content-tags/editor/components/TagsAutocomplete';
import {
  useIsInitialLoadingOfTags,
  useReadTags,
  useCreateTag,
} from 'features/content-tags/core/hooks';
import { FieldFocus } from 'features/content-tags/core/components/FieldFocus';
import { orderByLabel, tagsPayloadToValues } from 'features/content-tags/editor/utils';

import { css } from 'emotion';
import { EntityTags } from 'features/content-tags/editor/components/EntityTags';
import { useAllTagsGroups } from 'features/content-tags/core/hooks/useAllTagsGroups';
import { TAGS_PER_ENTITY } from 'features/content-tags/core/limits';
import { ConditionalWrapper } from 'features/content-tags/core/components/ConditionalWrapper';
import { useFilteredTags } from 'features/content-tags/core/hooks/useFilteredTags';
import * as stringUtils from 'utils/StringUtils';
import { CONTENTFUL_NAMESPACE } from 'features/content-tags/core/constants';
import { shouldAddInlineCreationItem } from 'features/content-tags/editor/utils';
import { useCanManageTags } from '../../core/hooks/useCanManageTags';

const styles = {
  wrapper: css({
    display: 'flex',
    justifyContent: 'space-between',
  }),
  tooltipWrapper: css({
    width: '100%',
  }),
};

const TagsSelection = ({ onAdd, onRemove, selectedTags = [], disabled, label = 'Tags' }) => {
  const { isLoading, hasTags, addTag, reset } = useReadTags();
  const { createTag, createTagData, createTagIsLoading } = useCreateTag();
  const { setSearch, filteredTags, search } = useFilteredTags();
  const isInitialLoad = useIsInitialLoadingOfTags();
  const tagGroups = useAllTagsGroups();
  const [validTagName, setValidTagName] = useState(true);
  const canManageTags = useCanManageTags();

  const totalSelected = selectedTags.length;
  const maxTagsReached = totalSelected >= TAGS_PER_ENTITY;

  useEffect(() => {
    if (createTagData) {
      addTag(createTagData);
      onAdd({ label: createTagData.name, value: createTagData.sys.id });
      Notification.success(`Successfully created tag "${createTagData.name}".`);
      reset();
    }
  }, [createTagData, addTag, onAdd, reset]);

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
        return createTag(item.value, item.label);
      }
      onAdd(item);
    },
    [createTag, onAdd, validTagName]
  );

  const localFilteredTags = useMemo(() => {
    const filtered = orderByLabel(
      tagsPayloadToValues(
        filteredTags.filter(
          (tag) => !selectedTags.some((localTag) => localTag.value === tag.sys.id)
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

  if (shouldAddInlineCreationItem(canManageTags, search, localFilteredTags, selectedTags)) {
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
        {!validTagName && (
          <ValidationMessage>
            {` Nice try! Unfortunately, we keep the "contentful." tag ID prefix for internal purposes.`}
          </ValidationMessage>
        )}
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
        {createTagIsLoading && <Spinner size="large" />}
        {!createTagIsLoading && (
          <EntityTags
            disabled={disabled}
            tags={selectedTags}
            onRemove={onRemove}
            tagGroups={tagGroups}
          />
        )}
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
    createTagIsLoading,
  ]);

  if (isInitialLoad) {
    return null;
  }

  if (!hasTags && !isLoading) {
    return null;
  }

  if (!isLoading) {
    return renderTags;
  } else {
    return null;
  }
};

TagsSelection.propTypes = {
  showEmpty: PropTypes.bool,
  entry: PropTypes.object,
  onAdd: PropTypes.func,
  onRemove: PropTypes.func,
  label: PropTypes.string,
  disabled: PropTypes.bool,
};

export { TagsSelection };
