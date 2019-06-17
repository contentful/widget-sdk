import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { IconButton, Paragraph } from '@contentful/forma-36-react-components';
import { NAMESPACE_SIDEBAR_BUILTIN, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';

const styles = {
  item: css({
    backgroundColor: tokens.colorWhite,
    border: `1px solid ${tokens.colorElementMid}`,
    height: `65px`,
    display: 'flex',
    padding: `${tokens.spacingXs} ${tokens.spacingM}`
  }),
  notFirstItem: css({
    borderTop: 'none'
  }),
  widgetName: css({
    fontWeight: 'bold',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    maxWidth: '280px'
  }),
  info: css({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  }),
  actions: css({
    display: 'flex',
    alignItems: 'center'
  })
};

export default function AvailableWidget({ name, onClick, widgetNamespace, index }) {
  return (
    <div
      className={cx(styles.item, {
        [styles.notFirstItem]: index !== 0
      })}
      data-test-id="available-widget">
      <div className={styles.info}>
        <Paragraph className={styles.widgetName}>{name}</Paragraph>
        <Paragraph>
          {widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN && 'Built-in item'}
          {widgetNamespace === NAMESPACE_EXTENSION && 'UI Extension'}
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
  index: PropTypes.number.isRequired
};
