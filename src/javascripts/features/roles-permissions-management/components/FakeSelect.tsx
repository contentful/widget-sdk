import * as React from 'react';
import { Icon } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import classNames from 'classnames';

const styles = {
  fakeSelect: css({
    marginBottom: tokens.spacingXs,
    marginTop: tokens.spacingXs,
    marginRight: tokens.spacingS,
    position: 'relative',
    minWidth: '40px',
    border: `1px solid ${tokens.colorElementMid}`,
    borderRadius: '6px',
  }),
  fakeSelectDisabled: css({
    backgroundColor: tokens.colorElementLightest,
    cursor: 'not-allowed',
    opacity: '0.7',
  }),
  fakeSelectError: css({
    borderColor: tokens.colorRedLight,
  }),
  fakeSelectContent: css({
    width: '100%',
    padding: '10px',
    paddingBottom: '11px',
    paddingRight: '39px',
    lineHeight: 'normal',
    color: tokens.colorTextMid,
  }),
  fakeSelectContentDisabled: css({
    color: tokens.colorTextLight,
    cursor: 'not-allowed',
  }),
  selectIcon: css({
    position: 'absolute',
    right: '12px',
    top: '50%',
    marginTop: '-10px',
  }),
};

type Props = React.PropsWithChildren<{
  onClick: () => void;
  isDisabled: boolean;
  hasError: boolean;
}>;

const FakeSelect: React.FC<Props> = ({ onClick, isDisabled, hasError, children }) => {
  return (
    <button
      disabled={isDisabled}
      className={classNames({
        [styles.fakeSelect]: true,
        [styles.fakeSelectDisabled]: isDisabled,
        [styles.fakeSelectError]: hasError,
      })}
      onClick={onClick}>
      <div
        className={classNames({
          [styles.fakeSelectContent]: true,
          [styles.fakeSelectContentDisabled]: isDisabled,
        })}>
        {children}
      </div>
      <Icon icon="ArrowDown" color="muted" className={styles.selectIcon} />
    </button>
  );
};

export { FakeSelect };
