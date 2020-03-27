import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  Note,
  TextLink,
  Paragraph,
  Typography,
} from '@contentful/forma-36-react-components';

export default function ContentTypeForbiddenRemoval({
  isShown,
  onClose,
  entriesCount,
  contentTypeName,
}) {
  const [explanationShown, setExplanationShown] = useState(false);

  return (
    <Modal isShown={isShown} onClose={onClose} size="large">
      {() => (
        <React.Fragment>
          <Modal.Header title={`This content type can't be deleted right now.`} />
          <Modal.Content>
            <Typography>
              <Paragraph>
                We&apos;ve found {entriesCount} entries which use the content type {contentTypeName}
                . Content types that are currently used by entries can&apos;t be deleted.{' '}
                <TextLink
                  onClick={() => {
                    setExplanationShown(!explanationShown);
                  }}>
                  Why?
                </TextLink>
              </Paragraph>
              {explanationShown && (
                <Paragraph>
                  This is done for the reasons of security and consistency of the content model. We
                  wouldn&apos;t know what to do with these entries otherwise.
                </Paragraph>
              )}
              <Note>Delete all entries which use this content type before deleting it.</Note>
            </Typography>
          </Modal.Content>
          <Modal.Controls>
            <Button buttonType="positive" onClick={() => onClose()}>
              Okay, got it
            </Button>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
}

ContentTypeForbiddenRemoval.propTypes = {
  entriesCount: PropTypes.number.isRequired,
  contentTypeName: PropTypes.string.isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
