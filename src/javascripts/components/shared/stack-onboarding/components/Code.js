import React from 'react';
import PropTypes from 'prop-types';
import { CopyButton } from '@contentful/forma-36-react-components';
import { css, cx } from 'emotion';

const copyButtonStyleOverride = css({
  padding: '0.5em',
  button: {
    backgroundColor: 'transparent',
    border: 'none',
    height: '1.7em',
    width: '2em',
    '&:hover': {
      backgroundColor: 'transparent'
    }
  }
});

class Code extends React.Component {
  static propTypes = {
    language: PropTypes.oneOf(['bash']),
    code: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
    copy: PropTypes.bool,
    onCopy: PropTypes.func,
    lineNumbers: PropTypes.bool,
    className: PropTypes.string
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
    const { language, copy, onCopy, code, lineNumbers, className } = this.props;

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
            className={cx(copyButtonStyleOverride, 'code-block__copy-wrapper')}
            copyValue={Array.isArray(code) ? code.join('\n') : code}
            onCopy={onCopy}
          />
        )}
      </div>
    );
  }
}

export default Code;
