import { Select } from '@contentful/forma-36-react-components';
import { SelectProps } from '@contentful/forma-36-react-components/dist/components/Select';
import * as React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import classNames from 'classnames';

const styles = {
  select: css({
    marginRight: tokens.spacingXs,
    '& select': {
      transition: 'all 0.25s ease-in-out',
      borderColor: 'transparent',
      backgroundColor: tokens.colorElementLight,
      borderRadius: '5px',
      paddingTop: tokens.spacingXs,
      paddingBottom: tokens.spacingXs,
      height: 'auto',
      outline: 'none',
      '&:focus': {
        outline: 'none',
        boxShadow: '0 0 black',
        borderColor: 'transparent',
      },
    },
  }),

  active: css({
    '& select': {
      backgroundColor: tokens.colorBlueDark,
      color: tokens.colorWhite,
    },
    '& svg': {
      fill: tokens.colorWhite,
    },
  }),
};

interface SelectPillProps extends SelectProps {
  isActive?: boolean;
}

const SelectPill: React.FunctionComponent<SelectPillProps> = ({
  onChange,
  value,
  isDisabled,
  testId,
  width = 'auto',
  children,
  isActive = false,
}) => {
  return (
    <Select
      className={classNames(styles.select, { [styles.active]: isActive })}
      width={width}
      testId={testId}
      isDisabled={isDisabled}
      value={value}
      onChange={onChange}>
      {children}
    </Select>
  );
};

export { SelectPill };
