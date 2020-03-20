import { debounce } from 'lodash';

const useInfiniteScroll = ({ onScrolledToBottom, offset = 10 }) => {
  const debouncedScrolledToBottom = debounce(onScrolledToBottom, 50);
  const onScroll = ({ target }) => {
    const isAtBottom = target.clientHeight + target.scrollTop >= target.scrollHeight - offset;
    if (isAtBottom) {
      debouncedScrolledToBottom();
    }
  };
  return onScroll;
};

export default useInfiniteScroll;
