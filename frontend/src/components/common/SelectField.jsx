import React from 'react';

/**
 * 一个可复用的下拉选择字段组件。
 * @param {object} props - 组件属性
 * @param {string} props.label - 选择框的标签文本
 * @param {string} props.name - 选择框的 name 属性，用于表单提交和 onChange 事件
 * @param {string|number} props.value - 选择框的当前值
 * @param {function} props.onChange - 选择框值改变时的回调函数
 * @param {Array<{value: string|number, label: string}>} props.options - 选项数组，例如 [{value: '1', label: '管理员'}]
 * @param {string} [props.error] - 如果有错误，则显示此错误信息
 * @param {boolean} [props.required=false] - 是否为必填项
 * @param {string} [props.placeholder] - 占位符文本
 * @param {boolean} [props.disabled=false] - 是否禁用
 */
const SelectField = ({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  required = false,
  placeholder,
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

      {/* 下拉框容器 */}
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 
            sbrm-bg-secondary 
            sbrm-border 
            ${error ? 'sbrm-border-error' : 'sbrm-border-primary'} 
            sbrm-rounded-lg 
            sbrm-text-primary 
            appearance-none
            focus:outline-none 
            focus:sbrm-border-accent-primary 
            focus:ring-2 
            focus:sbrm-ring-accent-alpha-20
            disabled:opacity-50 
            disabled:cursor-not-allowed
            sbrm-transition
            cursor-pointer
          `}
        >
          {/* 占位符选项 */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {/* 选项列表 */}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              className="sbrm-bg-primary sbrm-text-primary"
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* 自定义下拉箭头 */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <i className={`fas fa-chevron-down text-sm sbrm-transition ${
            disabled 
              ? 'sbrm-text-tertiary' 
              : error 
                ? 'sbrm-text-error' 
                : 'sbrm-text-primary-1'
          }`}></i>
        </div>
      </div>

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

export default SelectField;