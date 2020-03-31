import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { TextLink, Dropdown, Button, Paragraph } from '@contentful/forma-36-react-components';
import PluralizeEntityMessage from 'components/tabs/PluralizeEntityMessage';

const styles = {
  container: css({
    padding: tokens.spacingL,
  }),
  warningMessage: css({
    marginBottom: tokens.spacingS,
  }),
  buttonContainer: css({
    display: 'flex',
    justifyContent: 'space-between',
    flexGrow: 1,
  }),
};

const DeleteButton = ({ count, deleteSelected, shouldShow }) => {
  const [isOpen, setOpen] = React.useState(false);

  return shouldShow ? (
    <Dropdown
      isOpen={isOpen}
      testId="delete-asset"
      aria-label="delete"
      onClose={() => setOpen(false)}
      toggleElement={
        <TextLink linkType="negative" onClick={() => setOpen(!isOpen)}>
          Delete
        </TextLink>
      }>
      <div className={styles.container}>
        <Paragraph className={styles.warningMessage}>
          You are about to permanently delete{' '}
          <PluralizeEntityMessage entityType="asset" count={count} />
        </Paragraph>
        <div className={styles.buttonContainer}>
          <Button
            buttonType="negative"
            onClick={() => {
              setOpen(false);
              deleteSelected();
            }}>
            Permanently delete
          </Button>
          <Button buttonType="muted" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </Dropdown>
  ) : (
    <></>
  );
};

DeleteButton.propTypes = {
  count: PropTypes.number.isRequired,
  deleteSelected: PropTypes.func.isRequired,

  shouldShow: PropTypes.bool.isRequired,
  // TODO: when we change the asset_list template file from Angular to React it
  // would be nice to move this functionality out of the component.
};

export default DeleteButton;
