import type { FC } from '../../lib/teact/teact';
import React, { memo } from '../../lib/teact/teact';

import Spinner from './Spinner';
import buildClassName from '../../util/buildClassName';

import './Loading.scss';

/**
 * TL - Custom Loading Component, add gray color
 */
type OwnProps = {
  color?: 'blue' | 'white' | 'black' | 'yellow' | 'gray';
  backgroundColor?: 'light' | 'dark';
  onClick?: NoneToVoidFunction;
  ref?: React.Ref<HTMLDivElement>;
  className?: string;
};

const Loading: FC<OwnProps> = ({
  color, backgroundColor, onClick, ref, className,
}) => {
  return (
    <div ref={ref} className={buildClassName('Loading', onClick && 'interactive', className)} onClick={onClick}>
      <Spinner color={color} backgroundColor={backgroundColor} />
    </div>
  );
};

export default memo(Loading);
