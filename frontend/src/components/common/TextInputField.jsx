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
}) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full text-lg text-gray-200 dark:text-gray-00 bg-white/10 px-3 py-1 rounded backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:placeholder:text-gray-300
            ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default TextInputField;