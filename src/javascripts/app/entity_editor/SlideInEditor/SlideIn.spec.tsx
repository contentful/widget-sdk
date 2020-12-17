import React from 'react';
import { render } from '@testing-library/react';
import { SlideIn } from './SlideIn';

let onLayerClick;
let children;
const renderComponent = (props = {}, slideCount = 3) => {
  onLayerClick = jest.fn();
  children = [...Array(slideCount).keys()].map((_, i) => <div key={i}>Slide {i}</div>);
  const defaultProps = {
    onLayerClick,
    currentSlideClassName: 'current-slide',
    children,
    ...props,
  };

  return render(<SlideIn {...defaultProps} />);
};

describe('SlideIn', () => {
  it('should render children as slides with base and layer and overlays', () => {
    const { queryByTestId, queryAllByTestId } = renderComponent();

    expect(queryByTestId('slide-in')).toBeTruthy();
    expect(queryByTestId('slide-in-base')).toBeTruthy();
    expect(queryAllByTestId('slide-in-layer')).toHaveLength(2);
    expect(queryByTestId('slide-in-overlay-0')).toBeTruthy();
    expect(queryByTestId('slide-in-overlay-1')).toBeTruthy();
    expect(queryByTestId('slide-in-overlay-2')).not.toBeTruthy();
  });

  it('should render children with dynamic css values', () => {
    const { queryByTestId, queryAllByTestId } = renderComponent({}, 4);

    expect(queryByTestId('slide-in-base')).toHaveStyle({ left: '0px', width: 'calc(100% - 0px)' });
    const increment = 42.5;
    queryAllByTestId('slide-in-layer').forEach((element, i) => {
      expect(element).toHaveStyle({
        left: `${(i + 1) * increment}px`,
        width: `calc(100% - ${(i + 1) * increment}px)`,
      });
    });

    queryAllByTestId(/slide-in-overlay-\d+/).forEach((element, i) => {
      expect(element).toHaveStyle({
        opacity: -i / 4 + 0.8,
      });
    });
  });

  it('should be able to click the overlay', () => {
    const { queryByTestId } = renderComponent();

    queryByTestId('slide-in-overlay-0')?.click();
    expect(onLayerClick).toHaveBeenLastCalledWith(0, children[0], expect.any(Number));

    queryByTestId('slide-in-overlay-1')?.click();
    expect(onLayerClick).toHaveBeenLastCalledWith(1, children[1], expect.any(Number));
  });
});
