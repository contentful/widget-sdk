import React from 'react';
import { NewsSlider } from './NewsSlider';
import { Slide } from './Slide';
import { render, fireEvent, screen } from '@testing-library/react';
import { Button } from '@contentful/forma-36-react-components';

const scrollIntoViewMock = jest.fn();
window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

describe('NewsSlider', () => {
  const build = () => {
    const mockCloseCallback = jest.fn();

    return render(
      <NewsSlider onClose={mockCloseCallback}>
        <Slide>
          {({ onPrev, onNext }) => (
            <>
              <div>Slide 1</div>
              <Button buttonType="primary" onClick={onPrev}>
                Prev
              </Button>
              <Button buttonType="primary" onClick={onNext}>
                Next
              </Button>
            </>
          )}
        </Slide>
        <Slide>
          {({ onPrev, onNext }) => (
            <>
              <div>Slide 2</div>
              <Button buttonType="primary" onClick={onPrev}>
                Prev
              </Button>
              <Button buttonType="primary" onClick={onNext}>
                Next
              </Button>
            </>
          )}
        </Slide>
        <Slide>
          {({ onPrev, onNext }) => (
            <>
              <div>Slide 3</div>
              <Button buttonType="primary" onClick={onPrev}>
                Prev
              </Button>
              <Button buttonType="primary" onClick={onNext}>
                Next
              </Button>
            </>
          )}
        </Slide>
      </NewsSlider>
    );
  };

  it('should render simple slider', async () => {
    build();

    expect(screen.getAllByTestId('news-slider-slide')).toHaveLength(3);
  });

  it('should render slider with slides and navigate between them', async () => {
    build();

    const allPrevButtons = screen.getAllByText('Prev');
    const allNextButtons = screen.getAllByText('Next');
    const allSlides = screen.getAllByTestId('news-slider-slide');

    expect(allSlides).toHaveLength(3);

    expect(allSlides[0]).toHaveAttribute('data-active', 'true');
    expect(allSlides[1]).toHaveAttribute('data-active', 'false');
    expect(allSlides[2]).toHaveAttribute('data-active', 'false');

    fireEvent.click(allNextButtons[0]);

    expect(allSlides[0]).toHaveAttribute('data-active', 'false');
    expect(allSlides[1]).toHaveAttribute('data-active', 'true');
    expect(allSlides[2]).toHaveAttribute('data-active', 'false');

    fireEvent.click(allNextButtons[1]);

    expect(allSlides[0]).toHaveAttribute('data-active', 'false');
    expect(allSlides[1]).toHaveAttribute('data-active', 'false');
    expect(allSlides[2]).toHaveAttribute('data-active', 'true');

    fireEvent.click(allNextButtons[2]);

    expect(allSlides[0]).toHaveAttribute('data-active', 'false');
    expect(allSlides[1]).toHaveAttribute('data-active', 'false');
    expect(allSlides[2]).toHaveAttribute('data-active', 'true');

    fireEvent.click(allPrevButtons[2]);
    expect(allSlides[0]).toHaveAttribute('data-active', 'false');
    expect(allSlides[1]).toHaveAttribute('data-active', 'true');
    expect(allSlides[2]).toHaveAttribute('data-active', 'false');

    fireEvent.click(allPrevButtons[1]);
    expect(allSlides[0]).toHaveAttribute('data-active', 'true');
    expect(allSlides[1]).toHaveAttribute('data-active', 'false');
    expect(allSlides[2]).toHaveAttribute('data-active', 'false');

    fireEvent.click(allPrevButtons[0]);
    expect(allSlides[0]).toHaveAttribute('data-active', 'true');
    expect(allSlides[1]).toHaveAttribute('data-active', 'false');
    expect(allSlides[2]).toHaveAttribute('data-active', 'false');
  });

  it('should call close callback', () => {
    const mockCloseCallback = jest.fn();

    render(
      <NewsSlider onClose={mockCloseCallback}>
        <div>foo</div>
        <div>bar</div>
        <div>bas</div>
      </NewsSlider>
    );

    const closeButton = screen.getByTestId('close-news-slider');
    fireEvent.click(closeButton);

    expect(mockCloseCallback).toHaveBeenCalled();
  });

  it('should highlight current slide in the bullet navigation', () => {});
});
