import * as React from 'react';
import { Pill } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { useCallback } from 'react';
import PropTypes from 'prop-types';

const styles = {
  tag: css({ marginRight: tokens.spacing2Xs, marginBottom: tokens.spacing2Xs }),
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

  return (
    <div>
      <div>
        {tags.map((tag) => {
          return (
            <Pill
              className={css(styles.tag, style)}
              key={tag.value}
              label={tag.label}
              onClose={() => onTagPillClose(tag.value)}
            />
          );
        })}
      </div>
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
