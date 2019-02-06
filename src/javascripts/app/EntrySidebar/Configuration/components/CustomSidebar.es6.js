import React from 'react';
import PropTypes from 'prop-types';
import { Subheading } from '@contentful/forma-36-react-components';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import SidebarWidgetItem from './SidebarWidgetItem.es6';

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
      <Droppable droppableId="droppable">
        {provided => (
          <div ref={provided.innerRef}>
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {provided => (
                  <div
                    className="draggable-item"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}>
                    <SidebarWidgetItem
                      title={item.title}
                      description={item.description}
                      isDraggable
                      isRemovable
                      onRemoveClick={() => onRemoveItem(item)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

CustomSidebar.propTypes = {
  items: PropTypes.array.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onChangePosition: PropTypes.func.isRequired
};
