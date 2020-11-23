/* eslint-disable rulesdir/restrict-non-f36-components */
import React, { useRef, useState, useEffect, MouseEventHandler, ChangeEvent } from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownListItem,
  Button,
} from '@contentful/forma-36-react-components';
import { styles } from './MultiSelect.styles';

export type CheckboxItem = {
  label: string;
  name: string;
  checked: boolean;
};

export type CheckboxChangeStatus = {
  allSelected: boolean;
  checkboxes: CheckboxItem[];
};

export interface MultiSelectProps {
  className?: string;
  checkboxList: CheckboxItem[];
  onChange?: (status: CheckboxChangeStatus) => void;
  onClick?: MouseEventHandler;
  selectAll: boolean;
  testId?: string;
}

export const MultiSelect = (props: MultiSelectProps) => {
  const { onChange, checkboxList, selectAll = false, testId } = props;
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selectAllCheckboxEl = selectAllRef.current;
  const [selectAllState, setSelectAllState] = useState<boolean>(selectAll);
  const [checkboxes, setCheckboxes] = useState(checkboxList);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    const checkedItems = checkboxes.filter((item) => item.checked);
    const isIndeterminate = checkedItems.length > 0 && checkedItems.length < checkboxes.length;
    const allSelected = checkedItems.length === checkboxes.length;
    const noneSelected = checkedItems.length === 0;

    if (isIndeterminate) {
      if (selectAllCheckboxEl) selectAllCheckboxEl.indeterminate = true;
      setSelectAllState(false);
    }

    if (allSelected) {
      if (selectAllCheckboxEl) selectAllCheckboxEl.indeterminate = false;
      setSelectAllState(true);
    }

    if (noneSelected) {
      if (selectAllCheckboxEl) selectAllCheckboxEl.indeterminate = false;
      setSelectAllState(false);
    }

    if (onChange) {
      onChange({
        allSelected: selectAllState,
        checkboxes: checkboxes,
      });
    }
  }, [checkboxes, selectAllState]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.currentTarget;
    const changedCheckboxes = checkboxes.map((item) => {
      if (name === 'select_all') {
        setSelectAllState(checked);
        return { ...item, checked };
      }
      return item.name === name ? { ...item, checked } : item;
    });

    setCheckboxes(changedCheckboxes);
  };

  return (
    <div className={styles.root}>
      <label className={`${styles.mainSelect} ${styles.selectLabel}`}>
        <input
          type="checkbox"
          onChange={handleCheckboxChange}
          data-test-id={testId}
          name="select_all"
          checked={selectAllState}
          ref={selectAllRef}
        />
        <span className={styles.mainSelectText}>Select all</span>
      </label>
      <Dropdown
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        position="bottom-right"
        toggleElement={
          <Button
            size="small"
            aria-label="Select Entities State"
            type="button"
            indicateDropdown
            buttonType="naked"
            isActive={isOpen}
            className={styles.dropdownButton}
            onClick={() => setOpen(!isOpen)}>
            Select
          </Button>
        }>
        <DropdownList className={styles.dropdownList}>
          {checkboxes.map((item, idx) => (
            <DropdownListItem key={`dropdown-list-item-${idx}`}>
              <label className={styles.selectLabel}>
                <input
                  type="checkbox"
                  className="multi-select__checkbox"
                  checked={item.checked}
                  onChange={handleCheckboxChange}
                  name={item.name}
                />
                <span>{item.label}</span>
              </label>
            </DropdownListItem>
          ))}
        </DropdownList>
      </Dropdown>
    </div>
  );
};
