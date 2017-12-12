import {cloneDeep} from 'lodash';

// Copied from cfIcon
export default function scaleSvg (svg, scale = 1) {
  svg = cloneDeep(svg);
  const { width, height } = svg.props;
  const scaledWidth = parseInt(width) * scale;
  const scaledHeight = parseInt(height) * scale;
  svg.props.width = scaledWidth + '';
  svg.props.height = scaledHeight + '';
  return svg;
}
