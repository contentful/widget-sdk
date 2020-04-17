import * as Dialogs from './ExtensionDialogs';
import { ModalLauncher } from 'core/components/ModalLauncher';

describe('ExtensionDialogs', () => {
  describe('options validation', () => {
    it('requires options', async () => {
      expect.assertions(1);
      try {
        await Dialogs.openAlert();
      } catch (err) {
        expect(err).toMatchObject({ message: 'No options priovided.' });
      }
    });

    it('expects required properties', async () => {
      expect.assertions(1);
      try {
        await Dialogs.openAlert({ title: 'test' });
      } catch (err) {
        expect(err).toMatchObject({ message: '"message" is required.' });
      }
    });

    it('assures type of string options', async () => {
      expect.assertions(1);
      try {
        await Dialogs.openAlert({ title: 'test', message: { wat: true } });
      } catch (err) {
        expect(err).toMatchObject({ message: '"message" must be a string.' });
      }
    });

    it('assures type of boolean options', async () => {
      expect.assertions(1);
      try {
        await Dialogs.openAlert({
          title: 'test',
          message: 'hello',
          shouldCloseOnEscapePress: null,
        });
      } catch (err) {
        expect(err).toMatchObject({ message: '"shouldCloseOnEscapePress" must be a boolean.' });
      }
    });

    it('assures type of additional string properties', async () => {
      expect.assertions(1);
      try {
        await Dialogs.openPrompt({ title: 'test', message: 'hello', defaultValue: {} });
      } catch (err) {
        expect(err).toMatchObject({ message: '"defaultValue" must be a string.' });
      }
    });
  });

  describe('opening dialogs and return values', () => {
    it('alert always resolves to true', async () => {
      ModalLauncher.open.mockResolvedValue('blah blah blah');

      const result = await Dialogs.openAlert({ title: 'test', message: 'hello' });
      expect(ModalLauncher.open).toBeCalledTimes(1);
      expect(result).toBe(true);
    });

    it('confirm and prompt resolve to the modal close value', async () => {
      ModalLauncher.open.mockResolvedValue('CONFIRM OPEN RETURN VALUE');
      const confirmResult = await Dialogs.openConfirm({ title: 'test', message: 'hello' });
      expect(ModalLauncher.open).toBeCalledTimes(1);
      expect(confirmResult).toBe('CONFIRM OPEN RETURN VALUE');

      ModalLauncher.open.mockReturnValue('PROMPT OPEN RETURN VALUE');
      const promptResult = await Dialogs.openPrompt({ title: 'test', message: 'hello' });
      expect(ModalLauncher.open).toBeCalledTimes(2);
      expect(promptResult).toBe('PROMPT OPEN RETURN VALUE');
    });
  });
});
