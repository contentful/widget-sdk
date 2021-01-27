import { handleSaveError } from './RoleEditor';
import { Notification } from '@contentful/forma-36-react-components';
import { fixtures } from './__mocks__/fixtures';
import React from 'react';

import { screen, render, fireEvent } from '@testing-library/react';
import { RoleEditor } from 'features/roles-permissions-management/role_editor/RoleEditor';
import { FilteredTagsProvider, ReadTagsProvider, TagsRepoContext } from 'features/content-tags';

function createErrorResponse(error, rest = {}) {
  return { body: { details: { errors: [error] } }, ...rest };
}

window.HTMLElement.prototype.scrollIntoView = jest.fn();
jest.mock('services/localeStore', () => {
  const locales = [
    {
      name: 'English (United States)',
      internal_code: 'en-US',
      code: 'en-US',
    },
    {
      name: 'Afrikaans',
      internal_code: 'af',
      code: 'af',
    },
  ];
  return {
    getPrivateLocales: jest.fn().mockReturnValue(locales),
    getDefaultLocale: () => locales[0],
    isLocaleActive: jest.fn().mockReturnValue(true),
  };
});

describe('role_editor/RoleEditor', () => {
  describe('component', () => {
    it('renders roleEditor', () => {
      renderRoleEditor();
      expect(screen.queryByTestId('cf-ui-workbench')).toBeInTheDocument();
    });

    it('renders details page in roleEditor', () => {
      renderRoleEditor({ tab: 'details' });
      expect(screen.queryByText('Name')).toBeInTheDocument();
      expect(screen.queryByText('Description')).toBeInTheDocument();
    });

    it('renders content page in roleEditor', () => {
      renderRoleEditor({ tab: 'content' });
      expect(screen.queryByTestId('rule-list-entry')).toBeInTheDocument();
    });

    it('can create a new rule', () => {
      renderRoleEditor({ tab: 'content' });

      const initialRulesLength = screen.getAllByTestId('rule-item').length;

      fireEvent.click(screen.getByRole('button', { name: /New allow rule/i }));

      expect(screen.getAllByTestId('rule-item')).toHaveLength(initialRulesLength + 1);
    });

    describe('Adding rules', () => {
      it('adds a "new" label in front of new added rule', () => {
        renderRoleEditor({ tab: 'content' });
        expect(screen.queryByTestId('new-rule-indicator')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /New allow rule/i }));
        expect(screen.getByTestId('new-rule-indicator')).toBeInTheDocument();
      });

      it('adds a "new" label to every new rule', () => {
        const NUMBER_OF_NEW_RULES = 3;
        renderRoleEditor({ tab: 'content' });
        expect(screen.queryByTestId('new-rule-indicator')).not.toBeInTheDocument();
        for (let i = 0; i < NUMBER_OF_NEW_RULES; i++) {
          fireEvent.click(screen.getByRole('button', { name: /New allow rule/i }));
        }
        expect(screen.getAllByTestId('new-rule-indicator')).toHaveLength(NUMBER_OF_NEW_RULES);
      });

      it('focus new exception rule', () => {
        renderRoleEditor({ tab: 'content' });
        expect(screen.queryByTestId('new-rule-indicator')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /New deny rule/i }));
        expect(screen.getByTestId('new-rule-indicator')).toBeInTheDocument();
        const allRules = screen.getAllByTestId('rule-item');
        const ruleCount = allRules.length;
        const lastRule = allRules[ruleCount - 1];
        const actionSelect = lastRule.children[1].firstChild;
        expect(document.activeElement === actionSelect).toBeTruthy();
      });
    });

    describe('Editing rules', () => {
      it('adds and removes the label correctly on the "action" select', () => {
        renderRoleEditor({ tab: 'content' });
        expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
        const firstRule = screen.getAllByTestId('rule-item')[0];
        const actionSelect = firstRule.firstChild.firstChild;
        fireEvent.change(actionSelect, {
          target: { value: 'delete' },
        });
        expect(screen.getByText(/edited/i)).toBeInTheDocument();

        fireEvent.change(actionSelect, {
          target: { value: 'update' },
        });

        expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
      });

      it('adds and removes the label correctly on the "scope" select', () => {
        renderRoleEditor({ tab: 'content' });
        expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
        const firstRule = screen.getAllByTestId('rule-item')[0];
        const scopeSelect = firstRule.children[1].firstChild;
        fireEvent.change(scopeSelect, {
          target: { value: 'user' },
        });
        expect(screen.getByText(/edited/i)).toBeInTheDocument();

        fireEvent.change(scopeSelect, {
          target: { value: 'any' },
        });

        expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
      });

      it('adds and removes the label correctly on the "contentType" select', () => {
        renderRoleEditor({ tab: 'content' });
        expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
        const firstRule = screen.getAllByTestId('rule-item')[0];
        const contentTypeSelect = firstRule.children[2].firstChild;

        fireEvent.change(contentTypeSelect, {
          target: { value: 'author' },
        });
        expect(screen.getByText(/edited/i)).toBeInTheDocument();

        fireEvent.change(contentTypeSelect, {
          target: { value: '__cf_internal_all_cts__' },
        });

        expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
      });
    });
  });

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

function renderRoleEditor(props = {}) {
  const RoleEditorDefaultProps = {
    baseRole: undefined,
    autofixed: false,
    isNew: false,
    setDirty: jest.fn(),
    registerSaveAction: jest.fn(),
    roleRepo: {},
    canModifyRoles: true,
    openEntitySelectorForEntity: jest.fn(),
    hasCustomRolesFeature: true,
    hasContentTagsFeature: true,
    hasEnvironmentAliasesEnabled: true,
    tab: 'details',
    ngStateUrl: '/details',
    hasClpFeature: true,
    internal: {
      uiCompatible: true,
    },
    tags: [],
    fetchEntities: jest.fn(),
    fetchEntity: jest.fn(),
    ...fixtures,
  };

  const defaultTagsRepo = {
    createTag: jest.fn().mockResolvedValue(true),
    readTags: jest.fn().mockResolvedValue({ total: 0, items: [] }),
    updateTag: jest.fn().mockResolvedValue(true),
    deleteTag: jest.fn().mockResolvedValue(true),
  };

  render(
    <TagsRepoContext.Provider value={{ ...defaultTagsRepo }}>
      <ReadTagsProvider>
        <FilteredTagsProvider>
          <RoleEditor {...RoleEditorDefaultProps} {...props} />
        </FilteredTagsProvider>
      </ReadTagsProvider>
    </TagsRepoContext.Provider>
  );
}
