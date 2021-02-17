/* eslint-disable rulesdir/restrict-non-f36-components */
import React, { useState, useEffect, MouseEventHandler, ChangeEvent } from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownListItem,
  Button,
  Checkbox,
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
  onChange: (status: CheckboxChangeStatus) => void;
  onClick?: MouseEventHandler;
  selectAll: boolean;
  testId?: string;
}

export const MultiSelect = (props: MultiSelectProps) => {
  const { onChange, checkboxList, selectAll = false, testId } = props;
  const [selectAllState, setSelectAllState] = useState<boolean>(selectAll);
  const [indeterminate, setIndeterminate] = useState<boolean>(selectAll);
  const [checkboxes, setCheckboxes] = useState(checkboxList);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    const checkedItems = checkboxes.filter((item) => item.checked);
    const isIndeterminate = checkedItems.length > 0 && checkedItems.length < checkboxes.length;
    const allSelected = checkedItems.length === checkboxes.length;
    const noneSelected = checkedItems.length === 0;

    if (isIndeterminate) {
      setIndeterminate(true);
      setSelectAllState(false);
    }

    if (allSelected) {
      setIndeterminate(false);
      setSelectAllState(true);
    }

    if (noneSelected) {
      setIndeterminate(false);
      setSelectAllState(false);
    }
  }, [checkboxes, selectAllState]);

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.currentTarget;
    const changedCheckboxes = checkboxes.map((item) => {
      if (name === 'select_all') {
        setSelectAllState(checked);
        return { ...item, checked };
      }
      return item.name === name ? { ...item, checked } : item;
    });

    const checkedItems = changedCheckboxes.filter((item) => item.checked);
    setCheckboxes(changedCheckboxes);
    onChange({
      checkboxes: changedCheckboxes,
      allSelected: checkedItems.length === changedCheckboxes.length,
    });
  };

  return (
    <div className={styles.root}>
      <label className={`${styles.mainSelect} ${styles.selectLabel}`}>
        <Checkbox
          type="checkbox"
          indeterminate={indeterminate}
          onChange={handleCheckboxChange}
          testId={testId}
          labelText="Select all references"
          name="select_all"
          checked={selectAllState}
        />
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
            buttonType="muted"
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
                <Checkbox
                  type="checkbox"
                  labelText={item.label}
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
