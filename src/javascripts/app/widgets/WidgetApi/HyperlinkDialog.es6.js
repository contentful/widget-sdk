import React from 'react';
import PropTypes from 'prop-types';
import { TextField, Button } from '@contentful/ui-component-library';
import Dialog from 'app/entity_editor/Components/Dialog';
import { pickBy, identity } from 'lodash';

export default class HyperlinkDialog extends React.Component {
  static propTypes = {
    labels: PropTypes.shape({
      title: PropTypes.string
    }),
    value: PropTypes.shape({
      text: PropTypes.string,
      uri: PropTypes.string
    }),
    hideText: PropTypes.bool,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  static defaultProps = {
    labels: {
      title: 'Insert link'
    },
    value: {},
    hideText: false
  };

  constructor(props) {
    super(props);
    this.state = { ...this.props.value };
  }

  handleSubmit = event => {
    event.preventDefault();
    this.props.onConfirm(normalizeValue(this.state));
  };

  render() {
    const { labels, hideText, onConfirm, onCancel } = this.props;
    const { uri, text } = this.state;
    const isValid = !!(hideText || text) && !!uri;
    return (
      <Dialog testId="create-hyperlink-dialog">
        <Dialog.Header>{labels.title}</Dialog.Header>
        <form onSubmit={this.handleSubmit}>
          <Dialog.Body>{this.renderFields()}</Dialog.Body>
          <Dialog.Controls>
            <Button
              type="submit"
              onClick={() => onConfirm(normalizeValue(this.state))}
              buttonType="positive"
              disabled={!isValid}>
              Insert
            </Button>
            <Button onClick={() => onCancel()} buttonType="muted">
              Cancel
            </Button>
          </Dialog.Controls>
        </form>
      </Dialog>
    );
  }

  renderFields() {
    // TODO: Use `Form` for spacing when available.
    const style = { marginBottom: '1.75rem' };
    const { hideText } = this.props;
    const { uri, text } = this.state;
    return (
      <React.Fragment>
        {hideText || (
          <TextField
            required
            labelText="Link text"
            value={text || ''}
            onChange={e => this.setState({ text: e.target.value })}
            id="link-text"
            name="link-text"
            style={style}
          />
        )}
        <TextField
          required
          labelText="Link target"
          value={uri || ''}
          helpText="A protocol may be required, e.g. http://"
          onChange={e => this.setState({ uri: e.target.value })}
          id="link-uri"
          name="link-uri"
          style={style}
        />
      </React.Fragment>
    );
  }
}

function normalizeValue(value) {
  return pickBy(value, identity);
}
