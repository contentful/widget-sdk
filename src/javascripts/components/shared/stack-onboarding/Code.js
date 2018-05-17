import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

const moduleName = 'react/code-component';

angular.module('contentful')
.factory(moduleName, ['require', function (require) {
  const CopyButton = require('ui/Components/CopyIconButton').default;

  const Code = createReactClass({
    propTypes: {
      language: PropTypes.oneOf(['bash']),
      code: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node)
      ]),
      copy: PropTypes.bool,
      lineNumbers: PropTypes.bool
    },
    getDefaultProps () {
      return {
        lineNumbers: true
      };
    },
    renderCode () {
      const { code } = this.props;
      // it might be react object, so we can't check for string
      if (!Array.isArray(code)) {
        return (
          <span className={'code-block__line'}>{code}</span>
        );
      }

      const codeMarkup = code.map(codeLine => (
        <span key={codeLine} className={'code-block__line'}>{codeLine}</span>
      ));
      return (
        <React.Fragment>
          {codeMarkup}
        </React.Fragment>
      );
    },
    render () {
      const { language, copy, code, lineNumbers } = this.props;
      return (
        <div className={`code-block ${lineNumbers ? '' : 'code-block__no-line-numbers'}`}>
          {language && <span className={'code-block__language'}>{language}</span>}
          {this.renderCode()}
          {copy && <div className={'code-block__copy-wrapper'}>
            <CopyButton value={code} />
          </div>}
        </div>
      );
    }
  });

  return Code;
}]);

export const name = moduleName;
