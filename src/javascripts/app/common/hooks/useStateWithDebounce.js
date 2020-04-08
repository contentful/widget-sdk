import { useDebounce } from 'use-debounce';
import { useState } from 'react';

function useStateWithDebounce(initialValue, delay = 250) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue] = useDebounce(value, delay);
  return { value, setValue, debouncedValue };
}

export default useStateWithDebounce;
