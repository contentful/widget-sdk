import { initStateController } from './stateController';

import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import { showUnpublishedReferencesWarning } from 'app/entity_editor/UnpublishedReferencesWarning';
import * as Analytics from 'analytics/Analytics';
import { createEditorContextMock } from '../../../../test/utils/createEditorContextMock';
import { createDocumentMock } from '../../../../test/utils/createDocumentMock';
import { waitFor } from '@testing-library/dom';
import { makeNotify, Notification as MockedNotification } from 'app/entity_editor/Notifications';

jest.mock('navigation/SlideInNavigator', () => ({ goToPreviousSlideOrExit: jest.fn() }));
jest.mock('app/entity_editor/UnpublishedReferencesWarning', () => ({
  showUnpublishedReferencesWarning: jest.fn().mockResolvedValue(true),
}));
jest.mock('analytics/Analytics', () => ({ track: jest.fn() }));
jest.mock('access_control/AccessChecker', () => ({
  Action: { READ: 'read' },
  canPerformActionOnEntity: jest.fn().mockReturnValue(true),
}));
jest.mock('services/localeStore', () => ({
  getDefaultLocale: () => ({ internal_code: 'en-US' }),
}));
jest.mock('app/entity_editor/Notifications', () => ({
  Notification: {},
  makeNotify: jest.fn(),
}));

const { Notification } = jest.requireActual('app/entity_editor/Notifications');
MockedNotification.Success = Notification.Success;
MockedNotification.Error = Notification.Error;
MockedNotification.ValidationError = Notification.ValidationError;

describe('stateController', () => {
  const spaceContext = {};

  let editorContext;
  let entityInfo;
  let editorData;
  let notify;
  let entity;
  let doc;
  let spaceEndpoint;
  let validator;
  let bulkEditorContext;

  beforeEach(() => {
    spaceContext.getId = () => 'spaceid';
    spaceContext.getEnvironmentId = () => 'envid';

    jest.spyOn(ModalLauncher, 'open').mockImplementation(() => Promise.resolve(true));

    const createDocument = createDocumentMock().create;

    editorContext = createEditorContextMock().create();
    entityInfo = {};
    editorData = {
      widgetTrackingContexts: [],
      entity: {
        data: {},
      },
    };

    notify = jest.fn();
    makeNotify.mockReturnValue(notify);

    validator = editorContext.validator;
    validator.run = jest.fn().mockReturnValue(true);

    spaceEndpoint = jest.fn();
    bulkEditorContext = {};
    entity = {
      sys: {
        id: 'EID',
        type: 'Entry',
        version: 42,
      },
    };

    doc = createDocument(entity, spaceEndpoint);
    spaceEndpoint.mockResolvedValue(doc.getData());
  });

  const init = async (onUpdateCount = 2) => {
    const onUpdate = jest.fn();
    let controller;
    initStateController({
      bulkEditorContext,
      editorData,
      entityInfo,
      doc,
      getTitle: () => 'title',
      spaceId: 'spaceid',
      environmentId: 'envid',
      contentTypes: [{ name: 'foo', sys: { id: 'foo' } }],
      validator,
      onUpdate: (state) => {
        controller = state;
        onUpdate();
      },
    });
    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(onUpdateCount));
    return controller;
  };

  const assertErrorNotification = (action, error) => {
    expect(notify).toHaveBeenCalledTimes(1);
    const arg = notify.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Notification.Error);
    expect(arg.action).toBe(action);
    expect(arg.response).toBe(error);
  };

  const assertSuccessNotification = (action) => {
    expect(notify).toHaveBeenCalledTimes(1);
    const arg = notify.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Notification.Success);
    expect(arg.action).toBe(action);
  };

  describe('makeNotify calls', () => {
    const setDocTitle = (title) => {
      entityInfo.type = 'Asset';
      entity = {
        sys: {
          id: 'EID',
          type: 'Asset',
          version: 42,
        },
        fields: {
          title: {
            'en-US': title,
          },
        },
      };

      doc = createDocumentMock().create(entity, spaceEndpoint);
      spaceEndpoint.mockResolvedValue(doc.getData());
    };

    beforeEach(() => {
      ModalLauncher.open.mockResolvedValue({ action: 'delete' });
    });

    it('defaults to untitled', async () => {
      const controller = await init();
      await controller.delete.execute();
      expect(notify).toHaveBeenCalledWith({ action: 'delete' });
      const getTitleFn = makeNotify.mock.calls[0][1];
      expect(getTitleFn()).toEqual('“Untitled”');
    });

    it('passes in a normal-length title', async () => {
      setDocTitle('Hans goes skiing');
      const controller = await init();
      await controller.delete.execute();
      expect(notify).toHaveBeenCalledWith({ action: 'delete' });
      const getTitleFn = makeNotify.mock.calls[0][1];
      expect(getTitleFn()).toEqual('“Hans goes skiing”');
    });

    it('truncates titles longer than 256 characters', async () => {
      setDocTitle('a'.repeat(257));
      const controller = await init();
      await controller.delete.execute();
      expect(notify).toHaveBeenCalledWith({ action: 'delete' });
      const getTitleFn = makeNotify.mock.calls[0][1];
      const expectedTitle = `“${'a'.repeat(253)}...”`;
      expect(getTitleFn()).toEqual(expectedTitle);
    });
  });

  describe('delete command execution', () => {
    beforeEach(() => {
      spaceContext.cma = {
        getEntries: jest.fn().mockResolvedValue({ items: [] }),
      };
      entityInfo = {
        id: 'abc',
        type: 'Entry',
      };
    });

    it('makes delete request', async () => {
      ModalLauncher.open.mockResolvedValue({ action: 'delete' });
      const controller = await init();
      await controller.delete.execute();
      expect(notify).toHaveBeenCalledWith({ action: 'delete' });
      expect(spaceEndpoint).toHaveBeenCalledWith(
        { method: 'DELETE', path: ['entries', 'EID'], version: 42 },
        { 'X-Contentful-Skip-Transformation': 'true' }
      );
    });

    it('sends success notification', async () => {
      ModalLauncher.open.mockResolvedValue({ action: 'delete' });
      const controller = await init();
      await controller.delete.execute();
      assertSuccessNotification('delete');
    });

    it('sends failure notification with API error', async () => {
      ModalLauncher.open.mockResolvedValue({ action: 'delete' });
      spaceEndpoint.mockRejectedValue('ERROR');
      const controller = await init();
      await controller.delete.execute();
      assertErrorNotification('delete', 'ERROR');
    });

    it('navigates to the previous slide-in entity or closes the current state as a fallback', async () => {
      ModalLauncher.open.mockResolvedValue({ action: 'delete' });
      const controller = await init();
      await controller.delete.execute();
      expect(goToPreviousSlideOrExit).toHaveBeenCalledTimes(1);
      expect(goToPreviousSlideOrExit).toHaveBeenCalledWith('delete');
    });

    it('[PUL-273] should allow to execute alternate action instead of the initial one', async () => {
      ModalLauncher.open.mockResolvedValue({ action: 'archive' });
      const controller = await init();
      await controller.delete.execute();
      expect(goToPreviousSlideOrExit).not.toHaveBeenCalled();
      expect(spaceEndpoint).toHaveBeenCalledWith(
        {
          method: 'PUT',
          path: ['entries', 'EID', 'archived'],
          version: 42,
        },
        { 'X-Contentful-Skip-Transformation': 'true' }
      );
    });
  });

  describe('in published state without changes', () => {
    beforeEach(async () => {
      doc.setValueAt(['sys'], {
        id: 'EID',
        type: 'Entry',
        version: 42,
        publishedVersion: 43,
      });
    });

    it('sets current state to "published"', async () => {
      const controller = await init();
      expect(controller.current).toEqual('published');
    });

    it('has no primary action', async () => {
      const controller = await init();
      expect(controller.hidePrimary).toBe(true);
    });

    it('has two secondary actions', async () => {
      const controller = await init();
      expect(controller.secondary).toHaveLength(2);
    });

    describe('the first secondary action', () => {
      it('unpublishes and archives the entity', async () => {
        ModalLauncher.open.mockResolvedValue({ action: 'archive' });
        const controller = await init();
        await controller.secondary[0].execute();
        expect(spaceEndpoint).toHaveBeenCalledWith(
          {
            method: 'DELETE',
            path: ['entries', 'EID', 'published'],
            version: 42,
          },
          { 'X-Contentful-Skip-Transformation': 'true' }
        );
        expect(spaceEndpoint).toHaveBeenCalledWith(
          {
            method: 'PUT',
            path: ['entries', 'EID', 'archived'],
            version: 42,
          },
          { 'X-Contentful-Skip-Transformation': 'true' }
        );
      });
    });

    describe('the second secondary action', () => {
      it('unpublishes the entity', async () => {
        ModalLauncher.open.mockResolvedValue({ action: 'unpublish' });

        const controller = await init();
        await controller.secondary[1].execute();
        expect(spaceEndpoint).toHaveBeenCalledWith(
          {
            method: 'DELETE',
            path: ['entries', 'EID', 'published'],
            version: 42,
          },
          { 'X-Contentful-Skip-Transformation': 'true' }
        );
      });
    });
  });

  describe('in draft state', () => {
    it('sets current state to "draft"', async () => {
      const controller = await init();
      await expect(controller.current).toEqual('draft');
    });

    describe('primary action publish', () => {
      it('publishes entity', async () => {
        ModalLauncher.open.mockResolvedValue({ action: 'publish' });
        const controller = await init();
        await controller.primary.execute();
        expect(spaceEndpoint).toHaveBeenCalledTimes(1);
        expect(spaceEndpoint).toHaveBeenCalledWith(
          {
            method: 'PUT',
            path: ['entries', 'EID', 'published'],
            version: 42,
          },
          { 'X-Contentful-Skip-Transformation': 'true' }
        );
      });

      it('notifies on success', async () => {
        ModalLauncher.open.mockResolvedValue({ action: 'publish' });
        const controller = await init();
        await controller.primary.execute();
        assertSuccessNotification('publish');
      });

      it('runs the validator', async () => {
        ModalLauncher.open.mockResolvedValue({ action: 'publish' });
        const controller = await init();
        await controller.primary.execute();
        expect(validator.run).toHaveBeenCalledTimes(1);
      });

      describe('when the entity is an entry', () => {
        beforeEach(async () => {
          const contentTypeId = 'foo';
          entityInfo = {
            type: 'Entry',
            contentTypeId: contentTypeId,
          };
          spaceContext.publishedCTs = {
            get: jest.fn().mockImplementation(
              (CT) =>
                contentTypeId === CT && {
                  data: { name: 'foo' },
                }
            ),
          };
        });

        describe('when we are in the bulk editor', () => {
          beforeEach(async () => {
            bulkEditorContext = {};
            ModalLauncher.open.mockResolvedValue({ action: 'publish' });
          });
          itTracksThePublishEventWithOrigin('bulk-editor');
        });

        describe('when we are in the entry editor', () => {
          beforeEach(async () => {
            bulkEditorContext = undefined;
            ModalLauncher.open.mockResolvedValue({ action: 'publish' });
          });
          itTracksThePublishEventWithOrigin('entry-editor');
        });

        function itTracksThePublishEventWithOrigin(eventOrigin) {
          it('tracks the publish event', async () => {
            const controller = await init();
            await controller.primary.execute();
            expect(Analytics.track).toHaveBeenCalledWith('entry:publish', {
              eventOrigin: eventOrigin,
              contentType: { name: 'foo', sys: { id: 'foo' } },
              response: entity,
              widgetTrackingContexts: [],
            });
          });
        }
      });
      describe('when the entity is not an entry', () => {
        beforeEach(async () => {
          const contentTypeId = 'foo';
          entityInfo = {
            type: 'Asset',
            contentTypeId: contentTypeId,
          };
          spaceContext.publishedCTs = {
            get: jest.fn(),
          };
        });
        it('does not track the publish event', async () => {
          ModalLauncher.open.mockResolvedValue({ action: 'publish' });
          const controller = await init();
          await controller.primary.execute();
          expect(spaceContext.publishedCTs.get).not.toHaveBeenCalled();
          expect(Analytics.track).not.toHaveBeenCalled();
        });
      });
      it('sends notification if validation failed', async () => {
        validator.run.mockReturnValue(false);
        ModalLauncher.open.mockResolvedValue({ action: 'publish' });
        const controller = await init();
        await controller.primary.execute();
        expect(notify).toHaveBeenCalledWith(Notification.ValidationError());
      });
      it('does not publish if validation failed', async () => {
        validator.run.mockReturnValue(false);
        ModalLauncher.open.mockResolvedValue({ action: 'publish' });
        const controller = await init();
        await controller.primary.execute();
        expect(spaceEndpoint).not.toHaveBeenCalled();
      });
      it('sends notification on server error', async () => {
        spaceEndpoint.mockRejectedValue('ERROR');
        ModalLauncher.open.mockResolvedValue({ action: 'publish' });
        const controller = await init();
        await controller.primary.execute();
        assertErrorNotification('publish', 'ERROR');
      });
    });
    describe('secondary action archive', () => {
      it('has only one', async () => {
        const controller = await init();
        expect(controller.secondary).toHaveLength(1);
      });
      it('archives entity', async () => {
        ModalLauncher.open.mockResolvedValue({ action: 'archive' });
        const controller = await init();
        await controller.secondary[0].execute();
        expect(spaceEndpoint).toHaveBeenCalledWith(
          {
            method: 'PUT',
            path: ['entries', 'EID', 'archived'],
            version: 42,
          },
          { 'X-Contentful-Skip-Transformation': 'true' }
        );
      });
      it('notifies on success', async () => {
        ModalLauncher.open.mockResolvedValue({ action: 'archive' });
        const controller = await init();
        await controller.secondary[0].execute();
        assertSuccessNotification('archive');
      });
      it('notifies on failure', async () => {
        ModalLauncher.open.mockResolvedValue({ action: 'archive' });
        spaceEndpoint.mockRejectedValue('ERROR');
        const controller = await init();
        await controller.secondary[0].execute();
        assertErrorNotification('archive', 'ERROR');
      });
    });
  });

  describe('#revertToPrevious command', () => {
    it('is available if document has changes and the document is editable', async () => {
      doc.reverter.hasChanges.returns(true);
      doc.state.canEdit$.set(true);
      const controller = await init();
      expect(controller.revertToPrevious.isAvailable()).toBe(true);

      doc.reverter.hasChanges.returns(true);
      doc.state.canEdit$.set(false);
      expect(controller.revertToPrevious.isAvailable()).toBe(false);

      doc.reverter.hasChanges.returns(false);
      doc.state.canEdit$.set(true);
      expect(controller.revertToPrevious.isAvailable()).toBe(false);
    });

    it('calls notification for successful execution', async () => {
      doc.reverter.revert = jest.fn().mockResolvedValue();

      ModalLauncher.open.mockResolvedValue({ action: 'revert' });

      const controller = await init();
      await controller.revertToPrevious.execute();

      expect(doc.reverter.revert).toHaveBeenCalledTimes(1);
      assertSuccessNotification('revert');
    });

    it('calls notification for failed execution', async () => {
      doc.reverter.revert = jest.fn().mockRejectedValue('ERROR');

      ModalLauncher.open.mockResolvedValue({ action: 'revert' });

      const controller = await init();
      await controller.revertToPrevious.execute();

      expect(doc.reverter.revert).toHaveBeenCalledTimes(1);
      assertErrorNotification('revert', 'ERROR');
    });
  });

  describe('publication warnings', () => {
    it('shows publication warnings before actual action', async () => {
      ModalLauncher.open.mockResolvedValue({ action: 'publish' });

      const controller = await init();
      await controller.primary.execute();

      expect(showUnpublishedReferencesWarning).toHaveBeenCalledTimes(1);
    });
  });
});
