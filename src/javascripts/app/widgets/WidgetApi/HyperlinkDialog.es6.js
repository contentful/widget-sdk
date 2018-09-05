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
      href: PropTypes.string,
      title: PropTypes.string
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

  render() {
    const { labels, hideText, onConfirm, onCancel } = this.props;
    const { href, text, title } = this.state;
    const isValid = !!(hideText || text) && !!href;
    return (
      <Dialog testId="create-hyperlink-dialog">
        <Dialog.Header>{labels.title}</Dialog.Header>
        <Dialog.Body>{this.renderFields()}</Dialog.Body>
        <Dialog.Controls>
          <Button
            onClick={() => onConfirm(normalizeValue(this.state))}
            buttonType="positive"
            disabled={!isValid}>
            Insert
          </Button>
          <Button onClick={() => onCancel()} buttonType="muted">
            Cancel
          </Button>
        </Dialog.Controls>
      </Dialog>
    );
  }

  renderFields() {
    // TODO: Use `Form` for spacing when available.
    const style = { marginBottom: '1.75rem' };
    const { hideText } = this.props;
    const { href, text, title } = this.state;
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
          labelText="Target URL"
          value={href || ''}
          helpText="Please include protocol (e.g. https://)"
          onChange={e => this.setState({ href: e.target.value })}
          id="link-href"
          name="link-href"
          style={style}
        />
        <TextField
          labelText="Title of the link"
          value={title || ''}
          helpText="Optional, although commonly used to improve accessibility."
          onChange={e => this.setState({ title: e.target.value })}
          id="link-title"
          name="link-title"
          style={style}
        />
      </React.Fragment>
    );
  }
}

function normalizeValue(value) {
  return pickBy(value, identity);
}
