import React, { Component } from 'react';
import { Subheading } from '@contentful/forma-36-react-components';
import { EntryConfiguration } from '../defaults.es6';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import SidebarWidgetItem from './SidebarWidgetItem.es6';

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export default class CustomSidebar extends Component {
  state = {
    items: EntryConfiguration
  };

  onRemoveClick = id => {
    this.setState(state => {
      return {
        items: state.items.filter(item => item.id !== id)
      };
    });
  };

  onDragEnd = result => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const orderedItems = reorder(this.state.items, result.source.index, result.destination.index);

    this.setState({ items: orderedItems });
  };

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Subheading extraClassNames="f36-margin-bottom--m">Custom sidebar</Subheading>
        <Droppable droppableId="droppable">
          {provided => (
            <div ref={provided.innerRef}>
              {this.state.items.map(({ title, id, description }, index) => (
                <Draggable key={id} draggableId={id} index={index}>
                  {provided => (
                    <div
                      className="draggable-item"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}>
                      <SidebarWidgetItem
                        title={title}
                        description={description}
                        isDraggable
                        isRemovable
                        onRemoveClick={() => this.onRemoveClick(id)}
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
