import { useState, useCallback } from 'react';

export default function useFormState(initialState = {}) {
  const [formState, setFormState] = useState(initialState);

  const updateField = useCallback(
    (field, value) => {
      setFormState({
        ...formState,
        [field]: value,
      });
    },
    [formState]
  );

  return [formState, updateField];
}
