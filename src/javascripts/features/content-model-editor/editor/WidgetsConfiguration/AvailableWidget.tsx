import React from 'react';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { IconButton, Paragraph, Tag } from '@contentful/forma-36-react-components';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { AvailabilityStatus } from './interfaces';

const styles = {
  item: css({
    backgroundColor: tokens.colorWhite,
    border: `1px solid ${tokens.colorElementMid}`,
    borderRadius: tokens.borderRadiusMedium,
    height: `65px`,
    display: 'flex',
    padding: `${tokens.spacingXs} ${tokens.spacingM}`,
    marginBottom: tokens.spacingM,
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

interface AvailableWidgetProps {
  name?: string;
  widgetNamespace: string;
  onClick: () => void;
  availabilityStatus?: AvailabilityStatus;
  location: string;
}

export function AvailableWidget({
  name,
  onClick,
  widgetNamespace,
  availabilityStatus,
  location,
}: AvailableWidgetProps) {
  const renderAvailabilityStatus = () => <Tag>{availabilityStatus}</Tag>;

  return (
    <div className={cx(styles.item)} data-test-id="available-widget">
      <div className={styles.info}>
        <Paragraph className={styles.widgetHeader} element="h4">
          <div className={styles.widgetName}>{name}</div>{' '}
          {availabilityStatus && renderAvailabilityStatus()}
        </Paragraph>
        <Paragraph>
          {widgetNamespace === WidgetNamespace.SIDEBAR_BUILTIN && 'Built-in item'}
          {widgetNamespace === WidgetNamespace.EDITOR_BUILTIN && 'Built-in editor'}
          {widgetNamespace === WidgetNamespace.EXTENSION && 'UI Extension'}
          {widgetNamespace === WidgetNamespace.APP && 'App'}
        </Paragraph>
      </div>
      <div className={styles.actions}>
        <IconButton
          buttonType="muted"
          onClick={onClick}
          iconProps={{ icon: 'PlusCircle' }}
          label={`Add ${name} to your ${location}`}
          testId={`add-widget-to-selected`}
        />
      </div>
    </div>
  );
}
