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
 */
const SelectField = ({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  required = false,
}) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full text-lg text-gray-200 dark:text-gray-200 bg-white/10 px-3 py-1 rounded backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default SelectField;