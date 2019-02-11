import React from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Subheading, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import { NAMESPACE_SIDEBAR_BUILTIN, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';
import SidebarWidgetItem from './SidebarWidgetItem.es6';

function WidgetItem({ widget, onRemoveClick }) {
  return (
    <SidebarWidgetItem isDraggable isRemovable title={widget.title} onRemoveClick={onRemoveClick}>
      {widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN && (
        <Paragraph>{widget.description}</Paragraph>
      )}
      {widget.widgetNamespace === NAMESPACE_EXTENSION && (
        <React.Fragment>
          <Paragraph extraClassNames="f36-margin-bottom--s">UI Extension</Paragraph>
          <TextLink extraClassNames="f36-margin-bottom--s">Configure</TextLink>
        </React.Fragment>
      )}
    </SidebarWidgetItem>
  );
}

WidgetItem.propTypes = {
  widget: PropTypes.object.isRequired,
  onRemoveClick: PropTypes.func.isRequired
};

export default function CustomSidebar({ items, onChangePosition, onRemoveItem }) {
  return (
    <DragDropContext
      onDragEnd={result => {
        // dropped outside the list
        if (!result.destination) {
          return;
        }
        onChangePosition(result.source.index, result.destination.index);
      }}>
      <Subheading extraClassNames="f36-margin-bottom--m">Custom sidebar</Subheading>
      {items.length > 0 && (
        <Droppable droppableId="droppable">
          {provided => (
            <div ref={provided.innerRef}>
              {items.map((item, index) => {
                const key = `${item.widgetNamespace},${item.widgetId}`;
                return (
                  <Draggable key={key} draggableId={key} index={index}>
                    {provided => (
                      <div
                        className="draggable-item"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}>
                        <WidgetItem widget={item} onRemoveClick={() => onRemoveItem(item)} />
                      </div>
                    )}
                  </Draggable>
                );
              })}
            </div>
          )}
        </Droppable>
      )}
      {items.length === 0 && (
        <Paragraph>
          Add an item to customize what’s displayed on the sidebar for this content type.
        </Paragraph>
      )}
    </DragDropContext>
  );
}

CustomSidebar.propTypes = {
  items: PropTypes.array.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onChangePosition: PropTypes.func.isRequired
};
