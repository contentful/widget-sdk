import React from 'react';
import PropTypes from 'prop-types';
import CopyButton from 'ui/Components/CopyIconButton.es6';

class Code extends React.Component {
  static propTypes = {
    language: PropTypes.oneOf(['bash']),
    code: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
    copy: PropTypes.bool,
    onCopy: PropTypes.func,
    lineNumbers: PropTypes.bool,
    className: PropTypes.string,
    tooltipPosition: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
  };

  static defaultProps = {
    lineNumbers: true,
    className: ''
  };

  renderCode = () => {
    const { code } = this.props;
    // it might be react object, so we can't check for string
    if (!Array.isArray(code)) {
      return <span className="code-block__line">{code}</span>;
    }

    const codeMarkup = code.map((codeLine, i) => (
      <span key={`${codeLine}_${i}`} className="code-block__line">
        {codeLine}
      </span>
    ));
    return <React.Fragment>{codeMarkup}</React.Fragment>;
  };

  render() {
    const { language, copy, onCopy, code, lineNumbers, className, tooltipPosition } = this.props;

    return (
      <div className="code-block__wrapper">
        <div
          className={`code-block ${
            lineNumbers ? '' : 'code-block__no-line-numbers'
          } ${className}`.trim()}>
          {language && <span className="code-block__language">{language}</span>}
          {this.renderCode()}
        </div>
        {copy && (
          <CopyButton
            className={'code-block__copy-wrapper'}
            value={Array.isArray(code) ? code.join('\n') : code}
            tooltipPosition={tooltipPosition}
            onCopy={onCopy}
          />
        )}
      </div>
    );
  }
}

export default Code;
