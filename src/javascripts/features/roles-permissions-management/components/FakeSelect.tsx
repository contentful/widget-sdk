import * as React from 'react';
import { Icon } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  fakeSelect: css({
    marginBottom: tokens.spacingXs,
    marginTop: tokens.spacingXs,
    marginRight: tokens.spacingS,
    position: 'relative',
    minWidth: '40px',
    border: `1px solid ${tokens.colorElementMid}`,
  }),
  fakeSelectContent: css({
    width: '100%',
    cursor: 'pointer',
    padding: '10px',
    paddingBottom: '11px',
    paddingRight: '39px',
    lineHeight: 'normal',
    color: tokens.colorTextMid,
  }),
  selectIcon: css({
    position: 'absolute',
    right: '12px',
    top: '50%',
    marginTop: '-10px',
  }),
};

type Props = React.PropsWithChildren<{ onClick: () => void }>;

const FakeSelect: React.FC<Props> = ({ onClick, children }) => {
  return (
    <button className={styles.fakeSelect} onClick={onClick}>
      <div className={styles.fakeSelectContent}>{children}</div>
      <Icon icon="ArrowDown" color="muted" className={styles.selectIcon} />
    </button>
  );
};

export { FakeSelect };
