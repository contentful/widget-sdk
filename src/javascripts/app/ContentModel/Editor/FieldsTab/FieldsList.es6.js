import React, { Component } from 'react';
import { isEmpty } from 'lodash';
import cn from 'classnames';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Dropdown,
  DropdownList,
  DropdownListItem,
  Icon as FormaIcon
} from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon.es6';
import * as fieldFactory from 'services/fieldFactory.es6';

function isTitleType(fieldType) {
  return fieldType === 'Symbol' || fieldType === 'Text';
}

const FieldType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  omitted: PropTypes.bool,
  deleted: PropTypes.bool
});

class FieldItem extends Component {
  static propTypes = {
    field: FieldType.isRequired,
    canEdit: PropTypes.bool.isRequired,
    isTitle: PropTypes.bool.isRequired,
    onSettingsClick: PropTypes.func.isRequired,
    onSetAsTitle: PropTypes.func.isRequired,
    onToggleDisabled: PropTypes.func.isRequired,
    onToggleOmitted: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onUndelete: PropTypes.func.isRequired
  };

  state = {
    isDropdownOpened: false
  };

  getFieldName(field) {
    return isEmpty(field.name)
      ? isEmpty(field.id)
        ? 'Untitled field'
        : 'ID: ' + field.id
      : field.name;
  }

  onClose = () => {
    this.setState({ isDropdownOpened: false });
  };

  render() {
    const {
      canEdit,
      field,
      isTitle,
      onSettingsClick,
      onSetAsTitle,
      onToggleDisabled,
      onToggleOmitted,
      onDelete,
      onUndelete
    } = this.props;
    const iconId = fieldFactory.getIconId(field) + '-small';
    const fieldTypeLabel = fieldFactory.getLabel(field);
    const fieldCanBeTitle =
      isTitleType(field.type) && !isTitle && !field.disabled && !field.omitted;
    return (
      <div
        className={cn('ct-field', {
          'x--disabled': field.disabled,
          'x--omitted': field.omitted
        })}>
        {canEdit && (
          <div className="ct-field__drag-handle">
            <FormaIcon icon="Drag" />
          </div>
        )}
        <div className="ct-field__icon">{iconId && <Icon name={iconId} />}</div>
        <div className="ct-field__name">{this.getFieldName(field)}</div>
        <div className="ct-field__type">{fieldTypeLabel}</div>
        {!field.deleted && field.disabled && !field.omitted && (
          <div className="ct-field__status">Editing disabled</div>
        )}
        {!field.deleted && !field.disabled && field.omitted && (
          <div className="ct-field__status">Disabled in response</div>
        )}
        {!field.deleted && field.disabled && field.omitted && (
          <div className="ct-field__status">Disabled completely</div>
        )}
        {field.deleted && <div className="ct-field__status">Deleted</div>}
        {isTitle && <div className="ct-field__status">Entry title</div>}
        {canEdit && (
          <div>
            {!field.deleted && (
              <button
                type="button"
                aria-label="Settings"
                className="ct-field__settings btn-inline"
                onClick={onSettingsClick}>
                Settings
              </button>
            )}
            <Dropdown
              isOpen={this.state.isDropdownOpened}
              onClose={this.onClose}
              toggleElement={
                <button
                  type="button"
                  className="ct-field__actions btn-inline"
                  aria-label="Actions"
                  onClick={() => {
                    this.setState(state => ({ isDropdownOpened: !state.isDropdownOpened }));
                  }}>
                  •••
                </button>
              }>
              <DropdownList testId="field-actions-menu">
                {!field.deleted && fieldCanBeTitle && (
                  <DropdownListItem
                    testId="field-actions-set-as-title"
                    onClick={() => {
                      onSetAsTitle();
                      this.onClose();
                    }}>
                    Set field as Entry title
                  </DropdownListItem>
                )}
                {!field.deleted && (
                  <DropdownListItem
                    testId="field-actions-toggle-disabled"
                    onClick={() => {
                      onToggleDisabled();
                      this.onClose();
                    }}>
                    {field.disabled ? 'Enable editing' : 'Disable editing'}
                  </DropdownListItem>
                )}
                {!field.deleted && (
                  <DropdownListItem
                    testId="field-actions-toggle-omitted"
                    onClick={() => {
                      onToggleOmitted();
                      this.onClose();
                    }}>
                    {field.omitted ? 'Enable in response' : 'Disable in response'}
                  </DropdownListItem>
                )}
                {!field.deleted && (
                  <DropdownListItem
                    testId="field-actions-delete"
                    onClick={() => {
                      onDelete();
                      this.onClose();
                    }}>
                    Delete
                  </DropdownListItem>
                )}
                {field.deleted && (
                  <DropdownListItem
                    testId="field-actions-undelete"
                    onClick={() => {
                      onUndelete();
                      this.onClose();
                    }}>
                    Undelete
                  </DropdownListItem>
                )}
              </DropdownList>
            </Dropdown>
          </div>
        )}
      </div>
    );
  }
}

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export default class FieldsList extends Component {
  static propTypes = {
    displayField: PropTypes.string.isRequired,
    canEdit: PropTypes.bool.isRequired,
    fields: PropTypes.arrayOf(FieldType.isRequired).isRequired,
    openFieldDialog: PropTypes.func.isRequired,
    setFieldAsTitle: PropTypes.func.isRequired,
    toggleFieldProperty: PropTypes.func.isRequired,
    deleteField: PropTypes.func.isRequired,
    undeleteField: PropTypes.func.isRequired,
    updateOrder: PropTypes.func.isRequired
  };

  state = {
    optimisticFields: null
  };

  componentDidUpdate(prevProps) {
    if (this.props.fields !== prevProps.fields) {
      this.setState({ optimisticFields: null });
    }
  }

  onDragEnd = result => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const orderedFields = reorder(this.props.fields, result.source.index, result.destination.index);

    this.setState({ optimisticFields: orderedFields });
    this.props.updateOrder(orderedFields);
  };

  render() {
    const { canEdit, displayField } = this.props;
    const fields = this.state.optimisticFields || this.props.fields;
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable">
          {provided => (
            <div ref={provided.innerRef} className="ct-fields-drop-container">
              {fields.map((field, index) => {
                const isTitle = displayField === field.id;
                return (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {provided => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="ct-field-draggable">
                        <FieldItem
                          key={`field-${field.id}`}
                          canEdit={canEdit}
                          isTitle={isTitle}
                          field={field}
                          onSettingsClick={() => {
                            this.props.openFieldDialog(field);
                          }}
                          onSetAsTitle={() => {
                            this.props.setFieldAsTitle(field);
                          }}
                          onToggleDisabled={() => {
                            this.props.toggleFieldProperty(field, 'disabled', isTitle);
                          }}
                          onToggleOmitted={() => {
                            this.props.toggleFieldProperty(field, 'omitted', isTitle);
                          }}
                          onDelete={() => {
                            this.props.deleteField(field, isTitle);
                          }}
                          onUndelete={() => {
                            this.props.undeleteField(field);
                          }}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}
