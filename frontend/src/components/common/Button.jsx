import React from 'react';

/**
 * 一个可复用的、支持多种样式的按钮组件。
 * @param {object} props - 组件属性
 * @param {React.ReactNode} props.children - 按钮的内容，可以是文本或图标
 * @param {function} [props.onClick] - 点击事件的回调函数
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - 按钮的 HTML 类型
 * @param {boolean} [props.disabled=false] - 是否禁用按钮
 * @param {string} [props.className=''] - 额外的 CSS 类名，用于自定义样式
 * @param {'primary' | 'secondary' | 'danger' | 'ghost'} [props.variant='primary'] - 按钮的样式变体
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - 按钮的尺寸
 */
const Button = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  // 基础样式，适用于所有按钮
  const baseStyles = 'sbrm-btn';

  // 不同变体的样式
  const variantStyles = {
    primary: 'disabled:--text-primary-1',
    secondary: 'dark:--text-primary-1',
    danger: '',
    ghost: 'dark:--text-primary-1',
  };

  // 不同尺寸的样式
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className,
  ].join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;