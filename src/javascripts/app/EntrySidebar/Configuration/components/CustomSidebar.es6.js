import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Subheading } from '@contentful/forma-36-react-components';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import SidebarWidgetItem from './SidebarWidgetItem.es6';

export default class CustomSidebar extends Component {
  static propTypes = {
    items: PropTypes.array.isRequired,
    onRemoveItem: PropTypes.func.isRequired,
    onChangePosition: PropTypes.func.isRequired
  };

  onDragEnd = result => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    this.props.onChangePosition(result.source.index, result.destination.index);
  };

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Subheading extraClassNames="f36-margin-bottom--m">Custom sidebar</Subheading>
        <Droppable droppableId="droppable">
          {provided => (
            <div ref={provided.innerRef}>
              {this.props.items.map((item, index) => (
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
                        onRemoveClick={() => this.props.onRemoveItem(item)}
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
}
