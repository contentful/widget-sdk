import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Modal, CheckboxField, Button } from '@contentful/forma-36-react-components';

export default class LocaleSelectDialog extends React.Component {
  static propTypes = {
    initialLocales: PropTypes.array,
    onClose: PropTypes.func,
    onUpdate: PropTypes.func,
    isShown: PropTypes.bool
  };

  state = {
    locales: this.props.initialLocales
  };

  handleConfirm = () => {
    this.props.onUpdate(this.state.locales);
    this.props.onClose();
  };

  handleClose = () => {
    this.setState({ locales: this.props.initialLocales });
    this.props.onClose();
  };

  handleChangeLocale(locale) {
    this.setState({
      locales: [
        ...this.state.locales.map(initialLocale =>
          initialLocale.code === locale.code
            ? {
                ...locale,
                active: !initialLocale.active
              }
            : initialLocale
        )
      ]
    });
  }

  renderLocaleField(locale) {
    return (
      <li key={locale.code}>
        <CheckboxField
          labelText={`${locale.name} (${locale.code})`}
          disabled={locale.default}
          name={locale.code}
          value={locale.code}
          checked={locale.active}
          onChange={() => this.handleChangeLocale(locale)}
          id={locale.code}
          testId="locale"
        />
      </li>
    );
  }

  render() {
    return (
      <Modal isShown={this.props.isShown} onClose={this.handleClose} testId="locale-select-dialog">
        {() => (
          <React.Fragment>
            <Modal.Header title="Choose translations" />
            <Modal.Content>
              <ul>
                {_.orderBy(this.state.locales, ['default', 'name'], ['desc', 'asc']).map(locale =>
                  this.renderLocaleField(locale)
                )}
              </ul>
            </Modal.Content>
            <Modal.Controls>
              <Button buttonType="positive" onClick={this.handleConfirm} testId="save-cta">
                Save
              </Button>
              <Button buttonType="muted" onClick={this.handleClose} testId="cancel-cta">
                Cancel
              </Button>
            </Modal.Controls>
          </React.Fragment>
        )}
      </Modal>
    );
  }
}
