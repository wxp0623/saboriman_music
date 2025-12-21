import React, { useMemo } from 'react';

const LiquidGlass = ({
  children,
  className = '',
  radius = true,
  cornerRadius,
  ...props
}) => {
  const classList = useMemo(() => {
    let classList = ["sbrm-bg-glass", "sbrm-backdrop-blur", "sbrm-border", "sbrm-border-tertiary", "overflow-hidden"];
    if (className) {
      classList.push(className);
    }
    
    if (radius) {
      classList.push("sbrm-rounded");
    }

    return classList.join(' ');
  }, [className, radius]);

  const style = useMemo(() => {
    if (cornerRadius) {
      return { borderRadius: `${cornerRadius}px` };
    }
    return {};
  }, [cornerRadius]);

  return (
    <div
      className={classList}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export default LiquidGlass;