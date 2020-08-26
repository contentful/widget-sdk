import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { IconButton, Paragraph, Tag } from '@contentful/forma-36-react-components';
import { WidgetNamespace } from '@contentful/widget-renderer';

const styles = {
  item: css({
    backgroundColor: tokens.colorWhite,
    border: `1px solid ${tokens.colorElementMid}`,
    height: `65px`,
    display: 'flex',
    padding: `${tokens.spacingXs} ${tokens.spacingM}`,
  }),
  notFirstItem: css({
    borderTop: 'none',
  }),
  widgetHeader: css({
    display: 'flex',
    alignItems: 'center',
    fontWeight: 'bold',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    maxWidth: '280px',
  }),
  widgetName: css({
    flex: '1 1 auto',
  }),
  info: css({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  }),
  actions: css({
    display: 'flex',
    alignItems: 'center',
  }),
};

export default function AvailableWidget({
  name,
  onClick,
  widgetNamespace,
  index,
  availabilityStatus,
}) {
  const renderAvailabilityStatus = () => <Tag>{availabilityStatus}</Tag>;

  return (
    <div
      className={cx(styles.item, {
        [styles.notFirstItem]: index !== 0,
      })}
      data-test-id="available-widget">
      <div className={styles.info}>
        <Paragraph className={styles.widgetHeader} element="h4">
          <div className={styles.widgetName}>{name}</div>{' '}
          {availabilityStatus && renderAvailabilityStatus()}
        </Paragraph>
        <Paragraph>
          {widgetNamespace === WidgetNamespace.SIDEBAR_BUILTIN && 'Built-in item'}
          {widgetNamespace === WidgetNamespace.EXTENSION && 'UI Extension'}
          {widgetNamespace === WidgetNamespace.APP && 'App'}
        </Paragraph>
      </div>
      <div className={styles.actions}>
        <IconButton
          buttonType="muted"
          onClick={onClick}
          iconProps={{ icon: 'PlusCircle' }}
          label={`Add ${name} to your sidebar`}
          testId="add-widget-to-sidebar"
        />
      </div>
    </div>
  );
}

AvailableWidget.propTypes = {
  name: PropTypes.string.isRequired,
  widgetNamespace: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  availabilityStatus: PropTypes.oneOf(['alpha', 'beta']),
};
