import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const moduleName = 'react/input-component';

angular.module('contentful')
.factory(moduleName, [function () {
  const Input = createReactClass({
    propTypes: {
      error: PropTypes.string,
      name: PropTypes.string,
      label: PropTypes.node,
      hint: PropTypes.node,
      type: PropTypes.oneOf(['text', 'password', 'number']),
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]).isRequired,
      placeholder: PropTypes.string,
      onChange: PropTypes.func.isRequired,
      width: PropTypes.string,
      wrapperClassName: PropTypes.string
    },
    getDefaultProps () {
      return {
        type: 'text',
        width: '400px'
      };
    },
    onChange (e) {
      const value = e.target.value;

      this.props.onChange(value);
    },
    render () {
      const { name, label, hint, error, type, value, placeholder, width, wrapperClassName } = this.props;
      return (
        <div className={`cfnext-form__field ${wrapperClassName || ''}`}>
          {label &&
            <label htmlor={name}>
              {label}
              {hint && <span className={'cfnext-form__label-hint'}>(required)</span>}
            </label>
          }
          <input
            className={'cfnext-form__input'}
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={this.onChange}
            style={{ width }}
          />
          {error && <p className="cfnext-form__field-error">{error}</p>}
        </div>
      );
    }
  });

  return Input;
}]);

export const name = moduleName;
