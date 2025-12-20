import React, { useEffect, useState } from 'react';
import LiquidGlass from '../ui/LiquidGlass.jsx';
import TextInputField from '../common/TextInputField.jsx';
import SelectField from '../common/SelectField.jsx'; // 1. 导入 SelectField 组件
import { roleOptions, statusOptions } from '../../const/codeList.js'; // 2. 导入选项常量

const UserForm = ({ open, initial, onClose, onSubmit }) => {
  const newUser = { username: '', password: "", email: '', role: 'user', status: "0" }; // 默认角色为 '2' (用户)

  const [form, setForm] = useState({ ...newUser });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        username: initial.name ?? initial.username ?? '',
        password: initial.password,
        email: initial.email ?? '',
        role: initial.role ?? 'user',
      });
    } else {
      setForm(newUser);
    }
  }, [initial]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.username || !form.email) {
      alert('请填写姓名和邮箱');
      return;
    }
    setSaving(true);
    Promise.resolve(onSubmit?.(form)).finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 rounded-lg  shadow-xl">
        <LiquidGlass opacity={0.1}>
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {initial ? '编辑用户' : '新增用户'}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-300">✖</button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <TextInputField
              label="姓名"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="请输入姓名"
              required
            />
            <TextInputField
              label="密码"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder={initial ? "留空则不修改密码" : "请输入密码"}
              required={!initial}
            />
            <TextInputField
              label="邮箱"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
            />
            
            {/* 3. 使用 SelectField 组件替换原来的 select 元素 */}
            <SelectField
              label="角色"
              name="role"
              value={form.role}
              onChange={handleChange}
              options={roleOptions}
              required
            />
            <SelectField
              label="状态"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={statusOptions}
              required
            />

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:--text-primary-1"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700  disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </LiquidGlass>
      </div>
    </div>
  );
};

export default UserForm;