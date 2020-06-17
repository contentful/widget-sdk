import { useState, useRef } from 'react';

const defaultFocus = {
  pillIndex: undefined,
  suggestionIndex: undefined,
  isOnPillValue: false,
};

const useFocus = ({ suggestions, filters }) => {
  const [focus, setFocus] = useState(defaultFocus);
  const inputRef = useRef(null);

  const setResetFocus = (state) =>
    setFocus({
      ...defaultFocus,
      ...state,
    });

  const resetFocus = () => setResetFocus({});

  const setFocusOnQueryInput = (focus = true) => {
    focus ? inputRef?.current?.focus() : inputRef?.current?.blur();
  };

  const setFocusOnFirstSuggestion = () => {
    setResetFocus({ suggestionIndex: 0 });
  };

  const setFocusOnNextSuggestion = () => {
    const { suggestionIndex: currentIndex = -1 } = focus;
    const suggestionIndex = (currentIndex + 1) % suggestions.length;
    setResetFocus({ suggestionIndex });
  };

  const setFocusOnPrevSuggestion = () => {
    const { suggestionIndex: currentIndex = -1 } = focus;
    if (currentIndex > 0) {
      setResetFocus({ suggestionIndex: currentIndex - 1 });
    } else {
      setFocusOnQueryInput();
      resetFocus();
    }
  };

  const setFocusOnPill = (pillIndex, isOnPillValue = false) => {
    setResetFocus({ pillIndex, isOnPillValue });
  };

  const setFocusOnPillValue = (pillIndex) => {
    setFocusOnPill(pillIndex, true);
  };

  const setFocusOnLastPill = () => {
    setResetFocus({ pillIndex: filters.length - 1 });
  };

  const setFocusOnLastPillValue = () => {
    setResetFocus({ pillIndex: filters.length, isOnPillValue: true });
  };

  return [
    { focus, inputRef },
    {
      setFocusOnQueryInput,
      setFocusOnFirstSuggestion,
      setFocusOnNextSuggestion,
      setFocusOnPrevSuggestion,
      setFocusOnPill,
      setFocusOnPillValue,
      setFocusOnLastPill,
      setFocusOnLastPillValue,
      resetFocus,
    },
  ];
};

export default useFocus;
