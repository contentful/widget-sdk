import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangeSpaceWarning, { open, MODAL_TYPES } from './ChangeSpaceWarning';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';

// Needed for ContactUsButton
global.open = () => {};

const build = (otherProps) => {
  const props = Object.assign(
    {
      isShown: true,
      onClose: () => {},
      type: MODAL_TYPES.COMMITTED,
    },
    otherProps
  );

  return render(<ChangeSpaceWarning {...props} />);
};

describe('ChangeSpaceWarning', () => {
  describe('component', () => {
    it('should call onClose when clicking the close icon in the header', () => {
      const onClose = jest.fn();
      build({ onClose });

      userEvent.click(
        within(screen.getByTestId('cf-ui-modal-header')).getByTestId('cf-ui-icon-button')
      );

      expect(onClose).toBeCalledTimes(1);
    });

    it('should call onClose when clicking the close button in the controls', () => {
      const onClose = jest.fn();
      build({ onClose });

      userEvent.click(screen.getByTestId('close-button'));

      expect(onClose).toBeCalledTimes(1);
    });

    it('should call onClose when the Contact Us button is clicked', () => {
      const onClose = jest.fn();
      build({ onClose });

      userEvent.click(screen.getByTestId('cf-contact-us-button'));

      expect(onClose).toBeCalledTimes(1);
    });
  });

  describe('open', () => {
    it('should throw if an invalid type is given', () => {
      expect(() => open('someOtherType')).toThrow();
    });

    it('should call ModalLauncher.open', () => {
      jest.spyOn(ModalLauncher, 'open').mockImplementation(() => Promise.resolve(true));
      open(MODAL_TYPES.COMMITTED);
      expect(ModalLauncher.open).toBeCalled();
    });
  });
});
