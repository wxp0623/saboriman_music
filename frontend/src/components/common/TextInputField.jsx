import React from 'react';

/**
 * 一个可复用的文本输入字段组件。
 * @param {object} props - 组件属性
 * @param {string} props.label - 输入框的标签文本
 * @param {string} props.name - 输入框的 name 属性，用于表单提交和 onChange 事件
 * @param {string} props.value - 输入框的当前值
 * @param {function} props.onChange - 输入框值改变时的回调函数
 * @param {string} [props.placeholder=''] - 输入框的占位符文本
 * @param {string} [props.type='text'] - 输入框的类型 (e.g., 'text', 'email', 'password')
 * @param {string} [props.error] - 如果有错误，则显示此错误信息
 * @param {boolean} [props.required=false] - 是否为必填项
 * @param {boolean} [props.disabled=false] - 是否禁用
 */
const TextInputField = ({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  error,
  required = false,
  disabled = false,
}) => {
  return (
    <div>
      {/* 标签 */}
      <label 
        htmlFor={name} 
        className="block text-sm font-medium mb-2 sbrm-text-primary"
      >
        {label}
        {required && <span className="sbrm-text-error ml-1">*</span>}
      </label>

      {/* 输入框 */}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5
          sbrm-bg-secondary 
          sbrm-border 
          ${error ? 'sbrm-border-error' : 'sbrm-border-primary'} 
          sbrm-rounded-lg 
          sbrm-text-primary 
          placeholder:sbrm-text-tertiary
          focus:outline-none 
          focus:sbrm-border-accent-primary 
          focus:ring-2 
          focus:sbrm-ring-accent-alpha-20
          disabled:opacity-50 
          disabled:cursor-not-allowed
          sbrm-transition
        `}
      />

      {/* 错误提示 */}
      {error && (
        <div className="mt-2 flex items-center gap-1.5">
          <i className="fas fa-exclamation-circle text-xs sbrm-text-error"></i>
          <p className="text-xs sbrm-text-error">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TextInputField;