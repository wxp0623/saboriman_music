import React, { useMemo } from 'react';

const LiquidGlass = ({
  children,
  className = '',
  radius = true,
  cornerRadius,
  ...props
}) => {
  const classList = useMemo(() => {
    let classes = 'sbrm-bg-glass sbrm-backdrop-blur sbrm-border sbrm-border-tertiary ';
    
    if (className) {
      classes += className + ' ';
    }
    
    if (radius) {
      classes += 'sbrm-rounded ';
    }
    
    return classes.trim();
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