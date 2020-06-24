import { handleSaveError } from './RoleEditor';
import { Notification } from '@contentful/forma-36-react-components';

function createErrorResponse(error, rest = {}) {
  return { body: { details: { errors: [error] } }, ...rest };
}

describe('role_editor/RoleEditor', () => {
  describe('handling save errors', () => {
    let notificationSpy;

    beforeEach(() => {
      notificationSpy = jest.spyOn(Notification, 'error');
    });

    afterEach(() => {
      notificationSpy.mockRestore();
    });

    it('handles 403', async () => {
      await expect(handleSaveError({ statusCode: '403' })).rejects.toBeUndefined();
      expect(notificationSpy).toHaveBeenLastCalledWith(
        'You have exceeded your plan limits for Custom Roles.'
      );
    });

    it('handles 404', async () => {
      await expect(handleSaveError({ statusCode: '404' })).rejects.toBeUndefined();
      expect(notificationSpy).toHaveBeenLastCalledWith(
        'You have exceeded your plan limits for Custom Roles.'
      );
    });

    it('shows an error if role name is already taken', async () => {
      await expect(
        handleSaveError(createErrorResponse({ name: 'taken', path: 'name' }))
      ).rejects.toBeUndefined();
      expect(notificationSpy).toHaveBeenLastCalledWith('This role name is already used.');
    });

    it('show an erorr if role name is empty or too long', async () => {
      await expect(
        handleSaveError(createErrorResponse({ name: 'length', path: 'name', value: null }))
      ).rejects.toBeUndefined();
      expect(notificationSpy).toHaveBeenLastCalledWith('You have to provide a role name.');
      await expect(
        handleSaveError(createErrorResponse({ name: 'length', path: 'name', value: 'role_name' }))
      ).rejects.toBeUndefined();
      expect(notificationSpy).toHaveBeenLastCalledWith('The provided role name is too long.');
    });

    it('shows a error message as it is for 422 error', async () => {
      await expect(
        handleSaveError(
          createErrorResponse({ name: 'this is a real name of an error' }, { statusCode: '422' })
        )
      ).rejects.toBeUndefined();
      expect(notificationSpy).toHaveBeenLastCalledWith('this is a real name of an error');
    });
  });
});
