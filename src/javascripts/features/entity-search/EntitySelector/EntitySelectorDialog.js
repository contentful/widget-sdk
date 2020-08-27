import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from '@contentful/forma-36-react-components';
import { EntitySelectorForm } from './EntitySelectorForm';

export const EntitySelectorDialog = ({ isShown, onClose, config, labels }) => {
  const [selected, setSelected] = useState([]);

  const onChange = (entities) => {
    if (!config.multiple) {
      onClose(entities);
    } else {
      setSelected(entities);
    }
  };

  return (
    <Modal
      testId="entity-selector-dialog"
      position="center"
      size="large"
      isShown={isShown}
      title={labels.title}
      onClose={onClose}
      shouldCloseOnEscapePress
      shouldCloseOnOverlayClick>
      {({ title, onClose }) => {
        const onConfirm = () => onClose(selected);
        const onCancel = () => onClose();
        return (
          <Fragment>
            <Modal.Header title={title} onClose={onCancel} />
            <Modal.Content>
              <EntitySelectorForm {...config} labels={labels} onChange={onChange} />
            </Modal.Content>
            {config.multiple && (
              <Modal.Controls>
                <Button
                  onClick={onConfirm}
                  buttonType="positive"
                  testId="entity-selector-confirm"
                  disabled={selected.length < config.min || selected.length > config.max}>
                  {labels.insert} {selected.length > 0 ? `(${selected.length})` : ''}
                </Button>
                <Button onClick={onCancel} buttonType="muted">
                  Cancel
                </Button>
              </Modal.Controls>
            )}
          </Fragment>
        );
      }}
    </Modal>
  );
};

EntitySelectorDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  config: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
    locale: PropTypes.string.isRequired,
    withCreate: PropTypes.bool,
    multiple: PropTypes.bool,
    entityType: PropTypes.oneOf(['Entry', 'Asset']).isRequired,
    linkedContentTypeIds: PropTypes.array,
    fetch: PropTypes.func.isRequired,
    onChange: PropTypes.func,
  }),
  labels: PropTypes.shape({
    title: PropTypes.sting,
    input: PropTypes.string.isRequired,
    info: PropTypes.string,
    selected: PropTypes.string,
    empty: PropTypes.string,
    insert: PropTypes.string,
    searchPlaceholder: PropTypes.string,
  }).isRequired,
};
