import React from 'react';
import PropTypes from 'prop-types';

export default class WebhookHeaders extends React.Component {
  static propTypes = {
    headers: PropTypes.array,
    onChange: PropTypes.func.isRequired
  }

  componentDidUpdate () {
    if (this.shouldFocus && this.el) {
      const inputs = this.el.querySelectorAll('input');
      inputs[inputs.length - 2].focus(); // focus the key input of the last header
    }
    this.shouldFocus = false;
  }

  getHeaders () {
    return Array.isArray(this.props.headers) ? this.props.headers : [];
  }

  update (i, change) {
    const headers = this.getHeaders();
    const updated = headers.map((h, cur) => cur === i ? {...h, ...change} : h);
    this.props.onChange(updated);
  }

  add () {
    const headers = this.getHeaders();
    this.props.onChange(headers.concat([{}]));
  }

  remove (i) {
    const headers = this.getHeaders();
    this.props.onChange(headers.filter((_, cur) => cur !== i));
  }

  render () {
    const headers = this.getHeaders();

    return (
      <div className="cfnext-form__field" ref={el => { this.el = el; }}>
        {headers.map((h, i) => {
          return (
            <div className="webhook-editor__settings-row" key={`${i}`}>
              <input
                type="text"
                className="cfnext-form__input"
                placeholder="Key"
                value={h.key || ''}
                onChange={e => this.update(i, {key: e.target.value})}
              />
              <input
                type="text"
                className="cfnext-form__input"
                placeholder="Value"
                value={h.value || ''}
                onChange={e => this.update(i, {value: e.target.value})}
              />
              <button className="btn-link" onClick={() => this.remove(i)}>
                Remove
              </button>
            </div>
          );
        })}

        <button
          className="btn-link"
          onClick={() => {
            this.shouldFocus = true; // mark to be focused when the component updates next time
            this.add();
          }}
        >
          + Add custom header
        </button>
      </div>
    );
  }
}
