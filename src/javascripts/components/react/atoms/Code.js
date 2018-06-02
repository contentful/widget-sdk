import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

export const name = 'react/code-component';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const CopyButton = require('ui/Components/CopyIconButton').default;

  const Code = createReactClass({
    propTypes: {
      language: PropTypes.oneOf(['bash']),
      code: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node)
      ]),
      copy: PropTypes.bool,
      onCopy: PropTypes.func,
      lineNumbers: PropTypes.bool,
      className: PropTypes.string,
      tooltipPosition: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
    },
    getDefaultProps () {
      return {
        lineNumbers: true,
        className: ''
      };
    },
    renderCode () {
      const { code } = this.props;
      // it might be react object, so we can't check for string
      if (!Array.isArray(code)) {
        return (
          <span className='code-block__line'>{code}</span>
        );
      }

      const codeMarkup = code.map((codeLine, i) => (
        <span key={`${codeLine}_${i}`} className='code-block__line'>{codeLine}</span>
      ));
      return (
        <React.Fragment>
          {codeMarkup}
        </React.Fragment>
      );
    },
    render () {
      const {
        language,
        copy,
        onCopy,
        code,
        lineNumbers,
        className,
        tooltipPosition
      } = this.props;
      const lineNumbersClass = lineNumbers ? '' : 'code-block__no-line-numbers';
      const classList = `code-block ${lineNumbersClass} ${className}`.trim();

      return (
        <div className={classList}>
          {language && <span className='code-block__language'>{language}</span>}
          {this.renderCode()}
          {copy && <div className='code-block__copy-wrapper'>
            <CopyButton
              value={Array.isArray(code) ? code.join('\n') : code}
              tooltipPosition={tooltipPosition}
              onCopy={onCopy} />
          </div>}
        </div>
      );
    }
  });

  return Code;
}]);
