import React from 'react';
import PropTypes from 'prop-types';
import { sortableContainer } from 'react-sortable-hoc';
import { Subheading, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import SidebarWidgetItem from './SidebarWidgetItem';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { WidgetNamespace, isCustomWidget } from '@contentful/widget-renderer';

const styles = {
  customSidebarTitle: css({
    marginBottom: tokens.spacingM,
  }),
  widgetType: css({
    marginBottom: tokens.spacingS,
  }),
  parameterConfigLink: css({
    marginBottom: tokens.spacingS,
  }),
};

function WidgetItem({ widget, onRemoveClick, onConfigureClick, index }) {
  const hasParams = widget.parameters && widget.parameters.length > 0;
  return (
    <SidebarWidgetItem
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
    </SidebarWidgetItem>
  );
}

WidgetItem.propTypes = {
  widget: PropTypes.object.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
  onConfigureClick: PropTypes.func.isRequired,
  index: PropTypes.number,
};

const SortableContainer = sortableContainer(({ children }) => <div>{children}</div>);

export default function CustomSidebar({ items, onChangePosition, onRemoveItem, onConfigureItem }) {
  return (
    <>
      <Subheading className={styles.customSidebarTitle}>Custom sidebar</Subheading>
      {items.length !== 0 && (
        <SortableContainer
          distance={10}
          axis="y"
          onSortEnd={({ oldIndex, newIndex }) => {
            onChangePosition(oldIndex, newIndex);
          }}>
          {items.map((item, index) => {
            const key = `${item.widgetNamespace},${item.widgetId}`;
            return (
              <WidgetItem
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
          Add an item to customize what’s displayed on the sidebar for this content type.
        </Paragraph>
      )}
    </>
  );
}

CustomSidebar.defaultProps = {
  items: [],
};

CustomSidebar.propTypes = {
  items: PropTypes.array.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onConfigureItem: PropTypes.func.isRequired,
  onChangePosition: PropTypes.func.isRequired,
};
