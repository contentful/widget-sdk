import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';

import {
  Icon,
  Dropdown,
  DropdownListItem,
  DropdownList,
  IconButton,
  Tooltip
} from '@contentful/forma-36-react-components';

const styles = {
  cta: css({
    marginLeft: 0,
    width: tokens.spacingM
  }),
  listItem: css({
    display: 'flex',
    alignItems: 'center'
  }),
  dragHandle: css({})
};

export default class ViewCustomizer extends React.Component {
  static propTypes = {
    displayedFields: PropTypes.array,
    hiddenFields: PropTypes.array,
    addDisplayField: PropTypes.func,
    removeDisplayField: PropTypes.func,
    toggleContentType: PropTypes.func,
    updateFieldOrder: PropTypes.func,
    isContentTypeHidden: PropTypes.bool
  };
  static defaultProps = {
    displayedFields: [],
    hiddenFields: []
  };
  state = {
    isOpen: false,
    optimisticFields: null
  };

  componentDidUpdate(prevProps) {
    if (this.props.displayedFields !== prevProps.displayedFields) {
      this.setState({ optimisticFields: null });
    }
  }

  onDragEnd = result => {
    if (!result.destination) {
      return;
    }

    const orderedFields = reorder(
      this.props.displayedFields,
      result.source.index,
      result.destination.index
    );

    this.setState({ optimisticFields: orderedFields });
    this.props.updateFieldOrder(orderedFields);
  };

  render() {
    const fields = this.state.optimisticFields || this.props.displayedFields;
    const hasHiddenFields = this.props.hiddenFields.length > 0;
    return (
      <Dropdown
        className={styles.root}
        isOpen={this.state.isOpen}
        onClose={() => this.setState({ isOpen: false })}
        position="bottom-left"
        toggleElement={
          <Tooltip content="Select visible columns" place="left">
            <IconButton
              buttonType="muted"
              iconProps={{ icon: 'Settings' }}
              label="Select visible columns"
              onClick={() => this.setState({ isOpen: !this.state.isOpen })}
            />
          </Tooltip>
        }>
        <DropdownList>
          <DropdownListItem isTitle>Displayed Columns</DropdownListItem>
          <DropdownListItem isDisabled>Title</DropdownListItem>
          {!this.props.isContentTypeHidden && (
            <DropdownListItem onClick={() => this.props.toggleContentType()}>
              Content Type
            </DropdownListItem>
          )}
          <DragDropContext onDragEnd={this.onDragEnd}>
            <Droppable droppableId="droppable">
              {provided => (
                <div ref={provided.innerRef}>
                  {fields.map((fieldInfo, index) => (
                    <Draggable
                      key={fieldInfo.id}
                      draggableId={fieldInfo.id}
                      index={index}
                      disableInteractiveElementBlocking={true}>
                      {provided => (
                        <div ref={provided.innerRef} {...provided.draggableProps}>
                          <DropdownListItem
                            onClick={() => this.props.removeDisplayField(fieldInfo)}>
                            <span className={styles.listItem}>
                              <span className={styles.dragHandle} {...provided.dragHandleProps}>
                                <Icon icon="Drag" color="muted" />
                              </span>
                              <span>{fieldInfo.name}</span>
                            </span>
                          </DropdownListItem>
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <DropdownListItem isDisabled>Status</DropdownListItem>
          {hasHiddenFields && (
            <React.Fragment>
              <DropdownListItem isTitle>Available columns</DropdownListItem>
              {this.props.isContentTypeHidden && (
                <DropdownListItem onClick={() => this.props.toggleContentType()}>
                  Content Type
                </DropdownListItem>
              )}
              {this.props.hiddenFields.map(
                fieldInfo =>
                  fieldInfo.type !== 'Object' &&
                  !fieldInfo.disabled && (
                    <DropdownListItem
                      key={fieldInfo.id}
                      onClick={() => {
                        this.props.addDisplayField(fieldInfo);
                      }}>
                      {fieldInfo.name}
                    </DropdownListItem>
                  )
              )}
            </React.Fragment>
          )}
        </DropdownList>
      </Dropdown>
    );
  }
}

function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}
