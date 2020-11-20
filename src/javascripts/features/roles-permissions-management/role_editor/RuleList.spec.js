import React from 'react';
import { screen, render, fireEvent } from '@testing-library/react';
import { RuleList } from 'features/roles-permissions-management/role_editor/RuleList';
import { FilteredTagsProvider, ReadTagsProvider, TagsRepoContext } from 'features/content-tags';

const addRule = jest.fn(() => (x) => x);

describe('RuleList component', () => {
  it('does render the component', () => {
    const entity = 'entry';
    renderRuleList({ entity });
    expect(screen.getByTestId(`rule-list-${entity}`)).toBeInTheDocument();
  });

  it('shows all rules by default', async () => {
    const props = {
      rules: getRules(),
      entity: 'entry',
    };

    renderRuleList(props);

    expect(screen.getByTestId(`rule-list-${props.entity}`)).toBeInTheDocument();
    const rules = screen.getAllByTestId('rule-item');
    expect(rules).toHaveLength(12);
  });

  it('shows the ContentType filter when the entity is "entry"', async () => {
    const props = {
      rules: getRules(),
      entity: 'entry',
    };

    renderRuleList(props);

    expect(screen.getByTestId(`rules-filter-content-type-select`)).toBeInTheDocument();
  });

  it('doesn\'t show the ContentType filter when the entity is "asset"', async () => {
    const props = {
      rules: getRules(),
      entity: 'asset',
    };

    renderRuleList(props);

    expect(screen.queryByTestId(`rules-filter-content-type-select`)).not.toBeInTheDocument();
  });

  it('can filter the rules by "action"', async () => {
    const props = {
      rules: getRules(),
    };

    renderRuleList(props);

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(12);

    fireEvent.change(screen.getByTestId('rules-filter-action-select'), {
      target: { value: 'read' },
    });

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(5);
  });

  it('can filter the rules by "scope"', () => {
    const props = {
      rules: getRules(),
    };

    renderRuleList(props);

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(12);

    fireEvent.change(screen.getByTestId('rules-filter-scope-select'), {
      target: { value: 'user' },
    });

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(4);
  });

  it('can filter the rules by "contentType"', () => {
    const props = {
      rules: getRules(),
      entity: 'entry',
    };

    renderRuleList(props);

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(12);

    fireEvent.change(screen.getByTestId('rules-filter-content-type-select'), {
      target: { value: 'author' },
    });

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(3);
  });

  it('can filter the rules by "action", "scope" and "contentType" at the same time', () => {
    const props = {
      rules: getRules(),
      entity: 'entry',
    };

    renderRuleList(props);

    fireEvent.change(screen.getByTestId('rules-filter-action-select'), {
      target: { value: 'read' },
    });

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(5);

    fireEvent.change(screen.getByTestId('rules-filter-scope-select'), {
      target: { value: 'user' },
    });

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(3);

    fireEvent.change(screen.getByTestId('rules-filter-content-type-select'), {
      target: { value: 'photoGallery' },
    });

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(1);
  });

  it('shows a "Clear filters" link when at least one filter is on', () => {
    const props = {
      rules: getRules(),
    };

    renderRuleList(props);

    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId('rules-filter-scope-select'), {
      target: { value: 'user' },
    });

    screen.getByText('Clear filters');

    fireEvent.change(screen.getByTestId('rules-filter-scope-select'), {
      target: { value: 'clean' },
    });

    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
  });

  it('can clear all the filters', () => {
    const props = {
      rules: getRules(),
    };

    renderRuleList(props);

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(12);

    fireEvent.change(screen.getByTestId('rules-filter-action-select'), {
      target: { value: 'update' },
    });

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(3);

    fireEvent.change(screen.getByTestId('rules-filter-scope-select'), {
      target: { value: 'any' },
    });

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(2);

    fireEvent.click(screen.getByTestId('clear-filters'));

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(12);
  });

  it('clears filter when new allowed rule is added', () => {
    const props = {
      rules: getRules(),
    };

    renderRuleList(props);

    fireEvent.change(screen.getByTestId('rules-filter-action-select'), {
      target: { value: 'update' },
    });

    fireEvent.click(screen.getByTestId('add-allowed-rule'));

    expect(addRule).toHaveBeenCalledWith('allowed');

    expect(screen.queryByTestId('rules-filter-action-select')).toHaveValue('clean');
  });

  it('clears filter when new denied rule is added', () => {
    const props = {
      rules: getRules(),
    };

    renderRuleList(props);

    fireEvent.change(screen.getByTestId('rules-filter-action-select'), {
      target: { value: 'update' },
    });

    fireEvent.click(screen.getByTestId('add-denied-rule'));

    expect(addRule).toHaveBeenCalledWith('denied');

    expect(screen.queryByTestId('rules-filter-action-select')).toHaveValue('clean');
  });
});

function renderRuleList(props) {
  const defaultProps = {
    rules: {
      allowed: [],
      denied: [],
    },
    onAddRule: addRule,
    onRemoveRule: () => jest.fn(),
    onUpdateRuleAttribute: () => jest.fn(),
    isDisabled: false,
    entity: 'entry',
    privateLocales: [],
    contentTypes: [
      {
        name: 'Author',
        sys: {
          id: 'author',
          type: 'ContentType',
        },
      },
      {
        name: 'Category',
        sys: {
          id: 'category',
          type: 'ContentType',
        },
      },
      {
        name: 'Image',
        sys: {
          id: 'image',
          type: 'ContentType',
        },
      },
      {
        name: 'Photo Gallery',
        sys: {
          id: 'photoGallery',
          type: 'ContentType',
        },
      },
    ],
    searchEntities: jest.fn(),
    getEntityTitle: jest.fn(),
    hasClpFeature: true,
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
          <RuleList {...defaultProps} {...props} />
        </FilteredTagsProvider>
      </ReadTagsProvider>
    </TagsRepoContext.Provider>
  );
}

function getRules() {
  return {
    allowed: [
      {
        id: 'NFfVjXMhlwMD5a43',
        entity: 'entry',
        action: 'read',
        scope: 'any',
        locale: null,
        contentType: '__cf_internal_all_cts__',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'P8qQL0ykXJq1DdBK',
        entity: 'entry',
        action: 'update',
        scope: 'user',
        locale: '__cf_internal_all_locales__',
        contentType: '__cf_internal_all_cts__',
        field: '__cf_internal_all_fields__',
        metadataTagId: ['helloTaggy'],
        isPath: true,
      },
      {
        id: 'Wgf6VLjKQcvmMFk2',
        entity: 'entry',
        action: 'delete',
        scope: 'entityId',
        locale: null,
        contentType: 'category',
        field: '__cf_internal_all_paths_valid',
        entityId: '29kRhleVWFjbRBCDDpG7cL',
      },
      {
        id: 'v0BD3g6QzQEzag6H',
        entity: 'entry',
        action: 'all',
        scope: 'any',
        locale: null,
        contentType: 'author',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'hZd9Jy86nnh4Qm4e',
        entity: 'entry',
        action: 'create',
        scope: 'any',
        locale: null,
        contentType: 'author',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'bLBp1J7B9qc0HJ7j',
        entity: 'entry',
        action: 'update',
        scope: 'any',
        locale: null,
        contentType: 'category',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'XVNEwnfA3iAkfkD8',
        entity: 'entry',
        action: 'read',
        scope: 'user',
        locale: null,
        contentType: '__cf_internal_all_cts__',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'vZGeCzp7KBN3fppb',
        entity: 'entry',
        action: 'all',
        scope: 'any',
        locale: null,
        contentType: '__cf_internal_all_cts__',
        field: '__cf_internal_all_paths_valid',
      },
    ],
    denied: [
      {
        id: 'POmEihn8nzen7fNP',
        entity: 'entry',
        action: 'read',
        scope: 'entityId',
        locale: null,
        contentType: 'superSimpleTestCase',
        field: '__cf_internal_all_paths_valid',
        entityId: '5Tzc9rGqeEvG9oT5EhtLWo',
      },
      {
        id: 'pnyDO63Zlehf3BzG',
        entity: 'entry',
        action: 'update',
        scope: 'any',
        locale: null,
        contentType: 'author',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'BHxIMF4EffPEzmoG',
        entity: 'entry',
        action: 'read',
        scope: 'user',
        locale: null,
        contentType: 'superSimpleTestCase',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'Yhq1jpElM89Wa8Yf',
        entity: 'entry',
        action: 'read',
        scope: 'user',
        locale: null,
        contentType: 'photoGallery',
        field: '__cf_internal_all_paths_valid',
      },
    ],
  };
}
