import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Pill } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { groupByName } from 'features/content-tags/editor/utils';

const styles = {
  tag: css({ marginRight: tokens.spacing2Xs, marginBottom: '0px' }),
  headline: css({ color: tokens.colorTextMid }),
};

const EntityTags = ({ tags, onRemove, style = {} }) => {
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
    setGroupedTags(groupByName(tags));
  }, [tags, setGroupedTags]);

  const renderTags = (tags) => {
    return tags.sort().map((tag) => (
      <li key={tag.value}>
        <Pill
          className={css(styles.tag, style)}
          key={tag.value}
          label={tag.label}
          onClose={() => onTagPillClose(tag.value)}
        />
      </li>
    ));
  };

  const renderGroup = (content, groupName) => {
    return (
      <ul key={groupName || 'uncategorized'}>
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

  if (groups.includes('Uncategorized')) {
    result.push(renderGroup(groupedTags['Uncategorized']));
  }

  return (
    <div>
      {[
        result,
        ...groups
          .filter((groupName) => groupName !== 'Uncategorized')
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
};

export { EntityTags };
