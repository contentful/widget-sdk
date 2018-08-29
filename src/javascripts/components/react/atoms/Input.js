import React from 'react';
import PropTypes from 'prop-types';

export const name = 'react/input-component';

angular.module('contentful').factory(name, [
  function() {
    class Input extends React.Component {
      onChange(e) {
        const value = e.target.value;

        this.props.onChange(value);
      }
      render() {
        const {
          name,
          label,
          hint,
          error,
          type,
          value,
          placeholder,
          width,
          wrapperClassName = '',
          'data-test-id': dataTestId
        } = this.props;

        return (
          <div className={`cfnext-form__field ${wrapperClassName}`} data-test-id={dataTestId}>
            {label && (
              <label htmlFor={name}>
                {label}
                {hint && <span className="cfnext-form__label-hint">(required)</span>}
              </label>
            )}
            <input
              className="cfnext-form__input"
              type={type}
              value={value}
              placeholder={placeholder}
              onChange={e => this.onChange(e)}
              style={{ width }}
            />
            {error && <p className="cfnext-form__field-error">{error}</p>}
          </div>
        );
      }
    }

    Input.defaultProps = {
      type: 'text',
      width: '400px'
    };

    Input.propTypes = {
      error: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
      name: PropTypes.string,
      label: PropTypes.node,
      hint: PropTypes.node,
      type: PropTypes.oneOf(['text', 'password', 'number']),
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      placeholder: PropTypes.string,
      onChange: PropTypes.func.isRequired,
      width: PropTypes.string,
      wrapperClassName: PropTypes.string,
      'data-test-id': PropTypes.string
    };

    return Input;
  }
]);
