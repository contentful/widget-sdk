/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  List,
  ListItem,
  Modal,
  Paragraph,
  RadioButtonField,
  TextField,
  Typography
} from '@contentful/forma-36-react-components';
import keycodes from 'utils/keycodes';
import { css } from 'emotion';

const MIN_LENGTH = 1;
const MAX_LENGTH = 32;

const styles = {
  input: css({ marginTop: '5px' }),
  list: css({ marginTop: '20px' }),
  paragraph: css({ marginBottom: '25px' })
};

export default class SaveViewDialogComponent extends React.Component {
  static propTypes = {
    allowRoleAssignment: PropTypes.bool.isRequired,
    allowViewTypeSelection: PropTypes.bool.isRequired,
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  state = { value: '', viewType: 'isPrivate' };

  render() {
    const { onCancel, allowViewTypeSelection, allowRoleAssignment, isShown } = this.props;
    const { value, viewType } = this.state;

    const trimmed = value.trim();
    const isValid = !(trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH);
    const onConfirm = () =>
      isValid && this.props.onConfirm({ title: trimmed, isShared: viewType === 'isShared' });
    const onKeyDown = e => e.keyCode === keycodes.ENTER && onConfirm();

    return (
      <Modal isShown={isShown} onClose={onCancel}>
        {() => (
          <>
            <Modal.Header title="Save as view" onClose={onCancel} />
            <Modal.Content>
              <Typography>
                <Paragraph className={styles.paragraph}>
                  A view displays a list of entries you searched for. By saving the current <br />
                  view, you will be able to re-use it later.
                </Paragraph>
              </Typography>
              <TextField
                id="name"
                name="name"
                labelText="Name of the view"
                required
                countCharacters
                value={value}
                onChange={e => this.setState({ value: e.target.value })}
                onKeyDown={onKeyDown}
                textInputProps={{
                  maxLength: MAX_LENGTH
                }}
                className={styles.input}
              />
              {allowViewTypeSelection && (
                <List className={styles.list}>
                  <ListItem>
                    <RadioButtonField
                      id="option-private"
                      labelText="Save under my views"
                      helpText="Only you will see this view."
                      value="isPrivate"
                      onChange={e => this.setState({ viewType: e.target.value })}
                      checked={viewType === 'isPrivate'}
                      labelIsLight
                    />
                  </ListItem>
                  <ListItem>
                    <RadioButtonField
                      labelText="Save under shared views"
                      id="option-shared"
                      value="isShared"
                      helpText="You can select which roles should see this view in the next step."
                      onChange={e => this.setState({ viewType: e.target.value })}
                      checked={viewType === 'isShared'}
                      labelIsLight
                    />
                  </ListItem>
                </List>
              )}
            </Modal.Content>
            <Modal.Controls>
              <Button
                buttonType="positive"
                onClick={onConfirm}
                disabled={trimmed.length < MIN_LENGTH}>
                {viewType === 'isShared' && allowRoleAssignment
                  ? 'Proceed and select roles'
                  : 'Save view'}
              </Button>
              <Button buttonType="muted" onClick={onCancel}>
                Cancel
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>
    );
  }
}
