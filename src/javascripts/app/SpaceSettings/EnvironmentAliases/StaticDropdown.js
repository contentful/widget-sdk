import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  spacingS,
  spacingM,
  spacingL,
  colorBlueDark,
  colorWhite,
  boxShadowDefault
} from '@contentful/forma-36-tokens';

const styles = {
  root: css({
    position: 'relative'
  }),
  wrapper: css({
    position: 'absolute',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '15rem',
    width: '18rem'
  }),
  arrowUp: css({
    width: 0,
    height: 0,
    borderLeft: `${spacingS} solid transparent`,
    borderRight: `${spacingS} solid transparent`,
    borderBottom: `${spacingS} solid ${colorBlueDark}`
  }),
  body: css({
    padding: spacingL,
    display: 'flex',
    flex: '1',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colorWhite,
    boxShadow: boxShadowDefault
  }),
  title: css({
    backgroundColor: colorBlueDark,
    color: colorWhite,
    padding: spacingS,
    textAlign: 'center'
  })
};

export default function StaticDropdown({
  isVisible,
  children,
  title,
  body,
  align,
  testId,
  className
}) {
  const [top, setTop] = useState(0);

  const ref = useRef(null);

  useEffect(() => {
    if (ref && ref.current) {
      const verticalOffset = 5;
      setTop(ref.current.clientHeight + verticalOffset);
    }
  }, []);

  const dynamicWrapper = css({ top, [align]: `-${spacingM}` });
  const dynamicArrowUp = css({
    marginLeft: align === 'right' ? 'auto' : spacingM,
    marginRight: spacingM
  });

  return (
    <div className={styles.root} data-test-id={testId}>
      <div ref={ref}>{children}</div>
      {isVisible && (
        <div
          className={`${styles.wrapper} ${dynamicWrapper} ${className}`}
          data-test-id="staticdropdown.dropdown">
          <div
            className={`${styles.arrowUp} ${dynamicArrowUp}`}
            data-test-id="staticdropdown.arrow"></div>
          <div className={styles.title}>{title}</div>
          <div className={styles.body}>{body}</div>
        </div>
      )}
    </div>
  );
}

StaticDropdown.propTypes = {
  align: PropTypes.oneOf(['left', 'right']),
  isVisible: PropTypes.bool,
  title: PropTypes.string.isRequired,
  body: PropTypes.node,
  testId: PropTypes.string,
  className: PropTypes.string
};

StaticDropdown.defaultProps = {
  align: 'left',
  testId: 'staticdropdown.wrapper',
  className: ''
};
