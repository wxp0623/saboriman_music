import React from 'react';
import './liquid-glass.css';

const LiquidGlass = ({
  children,
  className = '',
  blur = 10,
  opacity = 0.55,
  radius = 18,
  colorRgb, // 新增 colorRgb prop，不设默认值
  border = true,
  style = {},
  ...props
}) => {


  return (
    <div
      className={`liquid-glass ${border ? 'liquid-glass--border' : ''} ${className}`}
      style={{  ...style, borderRadius: radius ?? 18}}
      {...props}
    >
      <div className="liquid-glass__inner">
        {children}
      </div>
    </div>
  );
};

export default LiquidGlass;