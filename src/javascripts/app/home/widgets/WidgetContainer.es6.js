import React from 'react';

export default class WidgetContainer extends React.Component {
  render() {
    const { children } = this.props;
    return (
      <div className="widget-container">
        {React.Children.map(children, (child, i) => (
          <div
            key={i}
            className={`widget-container__row ${child.props.order &&
              'widget-container__row-order-' + child.props.order}`}>
            {child}
          </div>
        ))}
      </div>
    );
  }
}
