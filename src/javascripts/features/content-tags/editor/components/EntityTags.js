import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Pill } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { applyGroups, DEFAULT_GROUP } from 'features/content-tags/editor/utils';
import { TagVisibility } from 'features/content-tags/core/components/TagVisibility';

const styles = {
  tag: css({ marginRight: tokens.spacing2Xs, marginBottom: '0px' }),
  headline: css({ color: tokens.colorTextMid }),
};

const EntityTags = ({ tags, onRemove, disabled, style = {}, tagGroups = [] }) => {
  const onTagPillClose = useCallback(
    (tagId) => {
      if (onRemove) {
        onRemove(tagId);
      }
    },
    [onRemove]
  );

  const [groupedTags, setGroupedTags] = useState({});

  useEffect(() => {
    setGroupedTags(applyGroups(tags, tagGroups));
  }, [tags, setGroupedTags, tagGroups]);

  const renderTags = (tags) => {
    return tags.sort().map((tag) => (
      <li key={tag.value} data-test-id="selected-tags-list-item">
        <Pill
          className={css(styles.tag, style)}
          key={tag.value}
          label={tag.label}
          onClose={disabled ? null : () => onTagPillClose(tag.value)}
        />
        <TagVisibility visibility={tag.visibility} showTooltip={true} />
      </li>
    ));
  };

  const renderGroup = (content, groupName) => {
    return (
      <ul key={groupName || DEFAULT_GROUP}>
        <li key={'group-heading'}>
          <h4 className={styles.headline}>{groupName}</h4>
        </li>
        <li key={'group-content'}>
          <ul>{renderTags(content)}</ul>
        </li>
      </ul>
    );
  };

  const groups = Object.keys(groupedTags).sort();
  const result = [];

  if (groups.includes(DEFAULT_GROUP)) {
    result.push(renderGroup(groupedTags[DEFAULT_GROUP]));
  }

  return (
    <div data-test-id="selected-tags-list">
      {[
        result,
        ...groups
          .filter((groupName) => groupName !== DEFAULT_GROUP)
          .map((groupName) => renderGroup(groupedTags[groupName], groupName)),
      ]}
    </div>
  );
};

EntityTags.propTypes = {
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    })
  ),
  onRemove: PropTypes.func,
  style: PropTypes.object,
  tagGroups: PropTypes.array,
  disabled: PropTypes.bool,
};

export { EntityTags };
