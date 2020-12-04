import React from 'react';
import { screen, render, fireEvent } from '@testing-library/react';
import { RuleList } from 'features/roles-permissions-management/role_editor/RuleList';
import { FilteredTagsProvider, ReadTagsProvider, TagsRepoContext } from 'features/content-tags';

const addRule = jest.fn(() => () => 'sampleDraftId');
const addNewRule = jest.fn((x) => x);
const removeNewRule = jest.fn((x) => x);

const allRules = getRules();
const allRulesCount = allRules.allowed.length + allRules.denied.length;

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
    expect(rules).toHaveLength(allRulesCount);
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

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(allRulesCount);

    fireEvent.change(screen.getByTestId('rules-filter-action-select'), {
      target: { value: 'read' },
    });

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(
      allRules.allowed.filter(({ action }) => action === 'read').length +
        allRules.denied.filter(({ action }) => action === 'read').length
    );
  });

  it('can filter the rules by "scope"', () => {
    const props = {
      rules: getRules(),
    };

    renderRuleList(props);

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(allRulesCount);

    fireEvent.change(screen.getByTestId('rules-filter-scope-select'), {
      target: { value: 'user' },
    });

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(
      allRules.allowed.filter(({ scope }) => scope === 'user').length +
        allRules.denied.filter(({ scope }) => scope === 'user').length
    );
  });

  it('treats "metadataTagIds" same as "scope === any" scope filter', () => {
    const props = {
      rules: getRules(),
    };

    renderRuleList(props);

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(allRulesCount);

    fireEvent.change(screen.getByTestId('rules-filter-scope-select'), {
      target: { value: 'any' },
    });

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(
      allRules.allowed.filter(({ scope }) => scope === 'metadataTagIds' || scope === 'any').length +
        allRules.denied.filter(({ scope }) => scope === 'metadataTagIds' || scope === 'any').length
    );
  });

  it('can filter the rules by "contentType"', () => {
    const props = {
      rules: getRules(),
      entity: 'entry',
    };

    renderRuleList(props);

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(allRulesCount);

    fireEvent.change(screen.getByTestId('rules-filter-content-type-select'), {
      target: { value: 'author' },
    });

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(
      allRules.allowed.filter(({ contentType }) => contentType === 'author').length +
        allRules.denied.filter(({ contentType }) => contentType === 'author').length
    );
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

    let filteredRules = {
      allowed: allRules.allowed.filter(({ action }) => action === 'read'),
      denied: allRules.denied.filter(({ action }) => action === 'read'),
    };

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(
      filteredRules.allowed.length + filteredRules.denied.length
    );

    fireEvent.change(screen.getByTestId('rules-filter-scope-select'), {
      target: { value: 'user' },
    });

    filteredRules = {
      allowed: filteredRules.allowed.filter(({ scope }) => scope === 'user'),
      denied: filteredRules.denied.filter(({ scope }) => scope === 'user'),
    };

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(
      filteredRules.allowed.length + filteredRules.denied.length
    );

    fireEvent.change(screen.getByTestId('rules-filter-content-type-select'), {
      target: { value: 'photoGallery' },
    });

    filteredRules = {
      allowed: filteredRules.allowed.filter(({ contentType }) => contentType === 'photoGallery'),
      denied: filteredRules.denied.filter(({ contentType }) => contentType === 'photoGallery'),
    };

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

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(allRulesCount);

    fireEvent.change(screen.getByTestId('rules-filter-action-select'), {
      target: { value: 'update' },
    });

    let filteredRules = {
      allowed: allRules.allowed.filter(({ action }) => action === 'update'),
      denied: allRules.denied.filter(({ action }) => action === 'update'),
    };

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(
      filteredRules.allowed.length + filteredRules.denied.length
    );

    fireEvent.change(screen.getByTestId('rules-filter-scope-select'), {
      target: { value: 'any' },
    });

    filteredRules = {
      allowed: filteredRules.allowed.filter(({ scope }) => scope === 'any'),
      denied: filteredRules.denied.filter(({ scope }) => scope === 'any'),
    };

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(
      filteredRules.allowed.length + filteredRules.denied.length
    );

    fireEvent.click(screen.getByTestId('clear-filters'));

    expect(screen.queryAllByTestId('rule-item')).toHaveLength(allRulesCount);
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

  it('updates draftId list when allowed rule is added', () => {
    const props = {
      rules: getRules(),
    };

    renderRuleList(props);

    fireEvent.click(screen.getByTestId('add-allowed-rule'));

    expect(addNewRule).toHaveBeenCalledWith('sampleDraftId');
  });

  it('updates draftId list when denied rule is removed', () => {
    const props = {
      rules: getRules(),
    };

    renderRuleList(props);

    const firstDeleteButton = screen.getAllByText('Delete rule')[0];

    fireEvent.click(firstDeleteButton);

    expect(removeNewRule).toHaveBeenCalledWith(allRules.allowed[0].id);
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
    newRuleIds: [],
    addNewRule,
    removeNewRule,
    editedRuleIds: [],
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
  const rules = {
    allowed: [
      {
        id: 'X80gmqmq9LC5dv2Q',
        entity: 'entry',
        action: 'read',
        scope: 'any',
        locale: null,
        contentType: '__cf_internal_all_cts__',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'eovMNQDffA2hid48',
        entity: 'entry',
        action: 'delete',
        scope: 'user',
        locale: null,
        contentType: '__cf_internal_all_cts__',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'fD1k8jvF7jgI1J6v',
        entity: 'entry',
        action: 'all',
        scope: 'entityId',
        locale: null,
        contentType: 'author',
        field: '__cf_internal_all_paths_valid',
        entityId: '2JA7S5tIHhz2XqKEEsOkrw',
      },
      {
        id: 'eXIaICq5hO6NvGqo',
        entity: 'entry',
        action: 'archive',
        scope: 'metadataTagIds',
        locale: null,
        contentType: 'category',
        field: '__cf_internal_all_paths_valid',
        metadataTagIds: ['testjanko2'],
      },
      {
        id: 'pJPZ7cDLd3Pcjmi5',
        entity: 'entry',
        action: 'create',
        scope: 'any',
        locale: null,
        contentType: 'image',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'M7XG8WqohdyBDWno',
        entity: 'entry',
        action: 'read',
        scope: 'any',
        locale: null,
        contentType: 'ref',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'oAWpHpQlpJ5GmQ8X',
        entity: 'entry',
        action: 'archive',
        scope: 'any',
        locale: null,
        contentType: '__cf_internal_all_cts__',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'MpoBzOz9c3W0GHqw',
        entity: 'entry',
        action: 'all',
        scope: 'any',
        locale: null,
        contentType: 'author',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'J4FJ1DDylM3n9O7F',
        entity: 'entry',
        action: 'all',
        scope: 'any',
        locale: null,
        contentType: '__cf_internal_all_cts__',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'oXeffbbIe67jhaHd',
        entity: 'entry',
        action: 'update',
        scope: 'any',
        locale: null,
        contentType: 'author',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'mFWEzVlMeZ1w8nd5',
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
        id: 'NKjxizDC5gIH0CAe',
        entity: 'entry',
        action: 'read',
        scope: 'user',
        locale: null,
        contentType: 'photoGallery',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'LnIiI2QxbnpmClae',
        entity: 'entry',
        action: 'create',
        scope: 'any',
        locale: null,
        contentType: '__cf_internal_all_cts__',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'vM0q2nLLbD53amyo',
        entity: 'entry',
        action: 'all',
        scope: 'any',
        locale: null,
        contentType: 'author',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'gQVAo7VzN2cBzD0o',
        entity: 'entry',
        action: 'read',
        scope: 'any',
        locale: null,
        contentType: '__cf_internal_all_cts__',
        field: '__cf_internal_all_paths_valid',
      },
      {
        id: 'W4j11df4VPqPdj0k',
        entity: 'entry',
        action: 'delete',
        scope: 'any',
        locale: null,
        contentType: '__cf_internal_all_cts__',
        field: '__cf_internal_all_paths_valid',
      },
    ],
  };
  return rules;
}
