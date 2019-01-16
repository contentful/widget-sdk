import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Modal, CheckboxField, Button, TextLink } from '@contentful/forma-36-react-components';

class LocaleSelectDialog extends React.Component {
  static propTypes = {
    initialLocales: PropTypes.array,
    onClose: PropTypes.func,
    onUpdate: PropTypes.func,
    isShown: PropTypes.bool
  };

  state = {
    locales: this.props.initialLocales,
    selectAllToggle:
      this.props.initialLocales.filter(locale => locale.active).length >=
      this.props.initialLocales.length
  };

  handleConfirm = () => {
    this.props.onUpdate(this.state.locales);
    this.props.onClose();
  };

  handleSelectAllToggle = () => {
    const active = !this.state.selectAllToggle;

    this.setState({
      selectAllToggle: active,
      locales: [
        ...this.state.locales.map(locale => (locale.default ? locale : { ...locale, active }))
      ]
    });
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

  renderSelectAllToggle() {
    const toggleLabel = this.state.selectAllToggle ? 'Deselect all' : 'Select all';

    return <TextLink onClick={() => this.handleSelectAllToggle()}>{toggleLabel}</TextLink>;
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
      <React.Fragment>
        <Modal.Header title="Translation" />
        <Modal.Content>
          {this.state.locales.length > 1 && (
            <div className="f36-margin-bottom--m" style={{ display: 'flex' }}>
              <span className="f36-font-weight--demi-bold" style={{ flex: '1 0 0' }}>
                Select locale(s)
              </span>
              {this.renderSelectAllToggle()}
            </div>
          )}
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
          <Button buttonType="muted" onClick={this.props.onClose} testId="cancel-cta">
            Cancel
          </Button>
        </Modal.Controls>
      </React.Fragment>
    );
  }
}

const LocaleSelectDialogModal = props => (
  <Modal isShown={props.isShown} onClose={props.onClose} testId="locale-select-dialog">
    {() => (
      <LocaleSelectDialog
        onClose={props.onClose}
        onUpdate={props.onUpdate}
        initialLocales={props.initialLocales}
      />
    )}
  </Modal>
);

LocaleSelectDialogModal.propTypes = {
  initialLocales: PropTypes.array,
  onClose: PropTypes.func,
  onUpdate: PropTypes.func,
  isShown: PropTypes.bool
};

export default LocaleSelectDialogModal;
