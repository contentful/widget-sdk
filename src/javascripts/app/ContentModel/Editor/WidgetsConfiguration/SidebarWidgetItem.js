import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { sortableElement } from 'react-sortable-hoc';
import { IconButton, Icon, Note, Tag } from '@contentful/forma-36-react-components';

const styles = {
  closeButton: css({
    cursor: 'pointer',
    marginLeft: tokens.spacingXs,
  }),
  itemHeader: css({
    display: 'flex',
    flexGrow: '1',
    fontSize: tokens.fontSizeS,
    fontWeight: tokens.fontWeightNormal,
    textTransform: 'uppercase',
    color: tokens.colorTextLight,
    lineHeight: '2',
    borderBottom: `1px solid ${tokens.colorElementDark}`,
    letterSpacing: '1px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    marginBottom: tokens.spacingS,
  }),
  itemName: css({
    flex: '1 1 auto',
  }),
  itemDrag: css({
    position: 'absolute',
    left: tokens.spacingXs,
    top: tokens.spacingS,
    fill: tokens.colorTextLight,
  }),
  problemItem: css({
    position: 'relative',
    marginBottom: tokens.spacingM,
    margin: 0,
    userSelect: 'none',
  }),
  problemItemText: css({
    paddingRight: tokens.spacingM,
  }),
  item: css({
    border: `1px solid ${tokens.colorElementMid}`,
    backgroundColor: tokens.colorElementLightest,
    marginBottom: tokens.spacingM,
    padding: `${tokens.spacingXs} ${tokens.spacingM} ${tokens.spacingS} ${tokens.spacingXl}`,
    position: 'relative',
  }),
  draggable: css({
    userSelect: 'none',
    marginBottom: tokens.spacingM,
    cursor: 'grab',
    '&:focus': {
      outline: 'none',
      boxShadow: tokens.glowPrimary,
    },
  }),
};

const SortableItem = sortableElement(({ children }) => (
  <div data-test-id="sidebar-widget-item-draggable" tabIndex="0" className={styles.draggable}>
    {children}
  </div>
));

export function SidebarWidgetItem({
  id,
  index,
  name,
  isDraggable,
  isRemovable,
  isProblem,
  onRemoveClick,
  children,
  availabilityStatus,
}) {
  const removeBtn = (
    <IconButton
      iconProps={{ icon: 'Close' }}
      buttonType="muted"
      className={styles.closeButton}
      onClick={onRemoveClick}
      label={`Remove ${name} from your sidebar`}
    />
  );

  const renderAvailabilityStatus = () => <Tag>{availabilityStatus}</Tag>;

  if (isProblem) {
    return (
      <Note noteType="warning" className={styles.problemItem}>
        <div className={styles.problemItemText}>
          <code>{name || id}</code> is saved in configuration, but not installed in this
          environment.
        </div>
        {removeBtn}
      </Note>
    );
  }

  const content = (
    <div className={styles.item} data-test-id="sidebar-widget-item">
      {isDraggable && <Icon className={styles.itemDrag} icon="Drag" />}
      <div className={styles.itemHeader}>
        <div className={styles.itemName} data-test-id="sidebar-widget-name">
          {name}
        </div>
        {availabilityStatus && renderAvailabilityStatus()}
        {isRemovable && removeBtn}
      </div>
      <div>{children}</div>
    </div>
  );

  if (isDraggable) {
    return <SortableItem index={index}>{content}</SortableItem>;
  }

  return content;
}

SidebarWidgetItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  isDraggable: PropTypes.bool.isRequired,
  isRemovable: PropTypes.bool.isRequired,
  isProblem: PropTypes.bool.isRequired,
  onRemoveClick: PropTypes.func,
  index: PropTypes.number,
  availabilityStatus: PropTypes.oneOf(['alpha', 'beta']),
};

SidebarWidgetItem.defaultProps = {
  isDraggable: false,
  isRemovable: false,
  isProblem: false,
};

export default SidebarWidgetItem;
