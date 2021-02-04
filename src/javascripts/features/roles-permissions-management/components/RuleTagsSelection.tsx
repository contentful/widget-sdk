import React, { useEffect, useMemo } from 'react';
import { Button, Spinner } from '@contentful/forma-36-react-components';
import {
  selectTags,
  useFilteredTags,
  useReadTags,
  useTagsValuesForIdList,
} from 'features/content-tags';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { FakeSelect } from './FakeSelect';

const styles = {
  addButton: css({
    marginRight: tokens.spacingS,
  }),
};

type Props = {
  rule: { metadataTagIds?: string[] };
  onChange: (unknown) => void;
  isDisabled: boolean;
  ruleIsIncomplete: boolean;
  fieldIsIncomplete: boolean;
};

export const RuleTagsSelection: React.FC<Props> = ({
  rule,
  onChange,
  isDisabled,
  ruleIsIncomplete,
  fieldIsIncomplete,
}) => {
  const ruleTags = useMemo(() => rule.metadataTagIds || [], [rule]);
  const { reset } = useReadTags();
  const { setLimit, setExcludedTags } = useFilteredTags();
  const tagValues = useTagsValuesForIdList(ruleTags);

  // always only display up to 10 tags in dropdown
  useEffect(() => {
    setLimit(10);
  }, [setLimit]);

  // exclude tags already selected
  useEffect(() => {
    setExcludedTags(ruleTags);
  }, [setExcludedTags, ruleTags]);

  const onSelect = async () => {
    const result = await selectTags(tagValues, {
      title: 'Add tags to rule',
      selectLabel: 'With tags',
      submitLabel: 'Done',
    });
    if (!result.canceled) {
      onChange({ target: { value: result.tags } });
      reset();
    }
  };

  const renderTagSelect = () => {
    return (
      <FakeSelect
        onClick={onSelect}
        isDisabled={isDisabled || ruleIsIncomplete}
        hasError={fieldIsIncomplete}>
        {tagValues.length ? (
          <span>
            Tagged {tagValues[0].label}
            {tagValues.length > 1 && <span> or {tagValues.length - 1} more</span>}
          </span>
        ) : fieldIsIncomplete ? (
          <span>Missing tag(s)</span>
        ) : (
          <Spinner />
        )}
      </FakeSelect>
    );
  };

  return ruleTags.length ? (
    renderTagSelect()
  ) : (
    <Button
      className={styles.addButton}
      buttonType={'naked'}
      disabled={isDisabled || ruleIsIncomplete}
      onClick={onSelect}>
      + With tags
    </Button>
  );
};
