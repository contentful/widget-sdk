import { css } from 'emotion';

const styles = {
  datePickerWrapper: css({
    maxHeight: 70,
  }),
  datePicker: css({
    zIndex: 1002,
    display: 'block',
    '.is-hidden': {
      display: 'none',
    },
  }),
};

export default styles;
