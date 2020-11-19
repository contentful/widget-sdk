import PropTypes from 'prop-types';
import * as React from 'react';
import { useMemo } from 'react';
import { Paragraph, Tooltip } from '@contentful/forma-36-react-components';
import { TagsAutocomplete } from 'features/content-tags/editor/components/TagsAutocomplete';
import { useIsInitialLoadingOfTags, useReadTags } from 'features/content-tags/core/hooks';
import { FieldFocus } from 'features/content-tags/core/components/FieldFocus';
import { orderByLabel, tagsPayloadToValues } from 'features/content-tags/editor/utils';

import { css } from 'emotion';
import { EntityTags } from 'features/content-tags/editor/components/EntityTags';
import { useAllTagsGroups } from 'features/content-tags/core/hooks/useAllTagsGroups';
import { TAGS_PER_ENTITY } from 'features/content-tags/core/limits';
import { ConditionalWrapper } from 'features/content-tags/core/components/ConditionalWrapper';
import { useFilteredTags } from 'features/content-tags/core/hooks/useFilteredTags';

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
  const { isLoading, hasTags } = useReadTags();
  const { setSearch, filteredTags } = useFilteredTags();
  const isInitialLoad = useIsInitialLoadingOfTags();
  const tagGroups = useAllTagsGroups();

  const totalSelected = selectedTags.length;
  const maxTagsReached = totalSelected >= TAGS_PER_ENTITY;

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

  const renderTags = useMemo(() => {
    return (
      <FieldFocus>
        <div className={styles.wrapper}>
          <Paragraph>{label}</Paragraph>
        </div>
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
            onChange={onAdd}
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
      </FieldFocus>
    );
  }, [
    selectedTags,
    localFilteredTags,
    isLoading,
    onAdd,
    setSearch,
    onRemove,
    tagGroups,
    maxTagsReached,
    disabled,
    label,
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
