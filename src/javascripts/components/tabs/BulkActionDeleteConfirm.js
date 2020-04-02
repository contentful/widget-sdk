import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';
import BulkActionLink from './BulkActionLink';

const BulkActionDeleteConfirm = ({ entityType, itemsCount, visible, fireAction }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <Fragment>
      <BulkActionLink
        label="Delete"
        linkType="negative"
        onClick={() => setModalVisible(true)}
        visible={visible}
      />
      {modalVisible && (
        <ModalConfirm
          title={`Permanently delete ${pluralize(entityType, itemsCount, true)}?`}
          isShown={true}
          intent="negative"
          secondaryIntent="muted"
          confirmLabel="Permanently delete"
          secondaryLabel="Archive instead"
          cancelLabel="Cancel"
          confirmTestId={`delete-${entityType}-confirm`}
          secondaryTestId={`delete-${entityType}-secondary`}
          cancelTestId={`delete-${entityType}-cancel`}
          onCancel={() => setModalVisible(false)}
          onConfirm={() => {
            fireAction('delete');
            setModalVisible(false);
          }}
          onSecondary={() => {
            fireAction('archive');
            setModalVisible(false);
          }}>
          <Paragraph>
            Once you delete an {entityType}, it’s gone for good and cannot be retrieved. We suggest
            archiving if you need to retrieve it later.
          </Paragraph>
        </ModalConfirm>
      )}
    </Fragment>
  );
};

BulkActionDeleteConfirm.propTypes = {
  itemsCount: PropTypes.number.isRequired,
  visible: PropTypes.bool.isRequired,
  fireAction: PropTypes.func.isRequired,
  entityType: PropTypes.oneOf(['entry', 'asset']).isRequired,
};

export default BulkActionDeleteConfirm;
