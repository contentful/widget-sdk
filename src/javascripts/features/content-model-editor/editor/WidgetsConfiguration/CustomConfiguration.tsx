import React from 'react';
import PropTypes from 'prop-types';
import * as Sortable from 'react-sortable-hoc';
import { Subheading, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import { WidgetItem } from './WidgetItem';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { WidgetNamespace, isCustomWidget } from '@contentful/widget-renderer';
import { ConfigurationItem } from './interfaces';

const styles = {
  customTitle: css({
    marginBottom: tokens.spacingM,
  }),
  widgetType: css({
    marginBottom: tokens.spacingS,
  }),
  parameterConfigLink: css({
    marginBottom: tokens.spacingS,
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  }),
};

function WidgetListItem({ widget, onRemoveClick, onConfigureClick, index }) {
  const hasParams = widget.parameters && widget.parameters.length > 0;
  return (
    <WidgetItem
      index={index}
      isDraggable
      isRemovable
      id={widget.widgetId}
      name={widget.name}
      isProblem={widget.problem}
      onRemoveClick={onRemoveClick}
      availabilityStatus={widget.availabilityStatus}>
      {widget.widgetNamespace === WidgetNamespace.SIDEBAR_BUILTIN && (
        <Paragraph>{widget.description}</Paragraph>
      )}
      {widget.widgetNamespace === WidgetNamespace.EDITOR_BUILTIN && (
        <Paragraph>Built-in item</Paragraph>
      )}
      {isCustomWidget(widget.widgetNamespace) && (
        <>
          {widget.widgetNamespace === WidgetNamespace.EXTENSION && (
            <Paragraph className={styles.widgetType}>UI Extension</Paragraph>
          )}
          {widget.widgetNamespace === WidgetNamespace.APP && (
            <Paragraph className={styles.widgetType}>App</Paragraph>
          )}
          {hasParams && (
            <TextLink onClick={onConfigureClick} className={styles.parameterConfigLink}>
              Change instance parameters
            </TextLink>
          )}
        </>
      )}
    </WidgetItem>
  );
}

WidgetListItem.propTypes = {
  widget: PropTypes.object.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
  onConfigureClick: PropTypes.func.isRequired,
  index: PropTypes.number,
};

const SortableContainer = Sortable.SortableContainer(({ children }) => <div>{children}</div>);

interface CustomConfigurationProps {
  items?: ConfigurationItem[];
  onRemoveItem: (item: ConfigurationItem) => void;
  onConfigureItem: (item: ConfigurationItem) => void;
  onChangePosition: (sourceIndex: number, destinationIndex: number) => void;
  onResetClick: () => void;
  title: string;
  showResetButton: boolean;
}

export function CustomConfiguration({
  items = [],
  onChangePosition,
  onRemoveItem,
  onConfigureItem,
  onResetClick,
  title,
  showResetButton,
}: CustomConfigurationProps) {
  return (
    <>
      <span className={styles.header}>
        <Subheading className={styles.customTitle}>{title}</Subheading>
        {showResetButton && (
          <TextLink testId="reset-widget-configuration" onClick={onResetClick}>
            Reset to default
          </TextLink>
        )}
      </span>
      {items.length !== 0 && (
        <SortableContainer
          distance={10}
          axis="y"
          onSortEnd={({ oldIndex, newIndex }) => {
            onChangePosition(oldIndex, newIndex);
          }}>
          {items.map((item: ConfigurationItem, index: number) => {
            const key = `${item.widgetNamespace},${item.widgetId}`;
            return (
              <WidgetListItem
                key={key}
                index={index}
                widget={item}
                onRemoveClick={() => {
                  onRemoveItem(item);
                }}
                onConfigureClick={() => {
                  onConfigureItem(item);
                }}
              />
            );
          })}
        </SortableContainer>
      )}

      {items.length === 0 && (
        <Paragraph>
          Add an item to customize what’s displayed on the {title.toLowerCase()} for this content
          type.
        </Paragraph>
      )}
    </>
  );
}
