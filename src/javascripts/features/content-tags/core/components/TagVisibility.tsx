import React from 'react';
import { css } from 'emotion';
import classNames from 'classnames';
import { Tag, Tooltip } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { TagVisibilityType } from 'features/content-tags/types';
import { ConditionalWrapper } from 'features/content-tags/core/components/ConditionalWrapper';

const styles = {
  visibility: css({
    cursor: 'default',
    marginLeft: tokens.spacingM,
  }),
  disabled: css({
    opacity: 0.5,
  }),
};

type Props = {
  visibility: TagVisibilityType;
  disabled?: boolean;
  showTooltip?: boolean;
};

const ShowTagVisibilityIfPublic: React.FC<Props> = ({
  visibility,
  disabled = false,
  showTooltip = false,
}) => {
  if (visibility === 'public') {
    return (
      <span data-test-id="visibility-indicator" className={styles.visibility}>
        <ConditionalWrapper
          condition={showTooltip}
          wrapper={(c) => (
            <Tooltip
              data-test-id="visibility-indicator-tooltip"
              content="Available also on the Preview and Delivery API"
              maxWidth={170}
              place="top">
              {c}
            </Tooltip>
          )}>
          <Tag
            className={classNames({
              [styles.disabled]: disabled,
            })}
            tagType="positive">
            {visibility}
          </Tag>
        </ConditionalWrapper>
      </span>
    );
  }
  return null;
};

export { ShowTagVisibilityIfPublic as TagVisibility };
