import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api.js';
import UserForm from './UserForm.jsx';
import LiquidGlass from '../ui/LiquidGlass.jsx';
import { roleOptions, statusOptions } from '../../const/codeList.js';
import TextInputField from '../common/TextInputField.jsx';
import Button from '../common/Button.jsx'; // 1. 导入新组件

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchUsers = () => {
    setLoading(true);
    api.users.list({ page, page_size: pageSize, q: query })
      .then(payload => {
        // More robust data parsing to ensure `items` is always an array.
        let items = [];
        let totalCount = 0;

        const data = payload.data.data;
        if (Array.isArray(data)) {
          // Handles case where API returns a direct array: [...]
          items = data;
          totalCount = data.length;
        } else if (data && Array.isArray(data.data)) {
          // Handles case where API returns an object: { data: [...], total: ... }
          items = data;
          totalCount = data.total ?? items.length;
        }
        // If neither of the above, `items` will remain an empty array `[]`, preventing the error.

        setUsers(items);
        setTotal(totalCount);
      })
      .catch(err => {
        console.error('获取用户列表失败:', err);
        // 在获取失败时，也清空数据，避免显示旧数据
        setUsers([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  // 1. useEffect 监听 page 和 pageSize 的变化，立即获取数据
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // 2. 单独的 useEffect 负责处理搜索查询的防抖
  useEffect(() => {
    // 设置一个定时器，在用户停止输入 350ms 后执行搜索
    const typingTimer = setTimeout(() => {
      // 只有当 query 发生变化时才重新从第一页开始搜索
      if (page !== 1) setPage(1);
      fetchUsers();
    }, 350);

    // 清理函数：在下一次 effect 执行前，清除上一个定时器
    return () => clearTimeout(typingTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]); // 这个 effect 只依赖 query

  const onCreate = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const onEdit = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const onDelete = (user) => {
    if (!window.confirm(`确认删除用户：${user.name || user.id}？`)) return;
    setLoading(true);
    api.users.delete(user.id).then(fetchUsers).catch(err => alert('删除失败')).finally(() => setLoading(false));
  };

  const onSubmit = (form) => {
    const action = editingUser ? api.users.update(editingUser.id, form) : api.users.create(form);
    setLoading(true);
    action.then(() => {
      setModalOpen(false);
      fetchUsers();
    }).catch(err => alert('保存失败')).finally(() => setLoading(false));
  };

  // 3. 简化 onSearchChange，只负责更新状态
  const onSearchChange = (e) => {
    setQuery(e.target.value);
  };

  return (
    <div className="p-6">
      <LiquidGlass>
        <div className='p-6'>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">👥 用户管理</h2>
            <Button
              onClick={onCreate}
              className="px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-secondary  transition-colors"
            >
              ➕ 新增用户
            </Button>
          </div>

          <div className="mb-4 w-1/3">
            <TextInputField
              label="邮箱"
              type="email"
              name="email"
              value={query}
              onChange={onSearchChange}
              placeholder="搜索姓名/邮箱..."
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-border-primary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">姓名</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">邮箱</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">角色</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-text-primary">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {loading && (
                  <tr><td colSpan="5" className="p-6 text-center text-text-secondary">加载中...</td></tr>
                )}
                {!loading && users.length === 0 && (
                  <tr><td colSpan="5" className="p-10 text-center text-text-secondary">暂无数据</td></tr>
                )}
                {!loading && users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-sm text-text-primary">{u.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{u.username}</td>
                    <td className="px-4 py-3 text-sm text-text-primary">{u.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-sm --text-primary-1 dark:--text-primary-1 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                        {roleOptions.find(r => r.value === String(u.role))?.label || '未知角色'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-sm --text-primary-1 dark:--text-primary-1 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                        {statusOptions.find(r => r.value === String(u.status))?.label || '未知状态'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right space-x-2">
                      <button onClick={() => onEdit(u)} className="font-medium text-accent-primary hover:text-accent-secondary">编辑</button>
                      <button onClick={() => onDelete(u)} className="font-medium text-red-500 hover:text-red-600">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-border-primary">
            <div className="text-sm text-text-secondary">第 {page}/{totalPages} 页，共 {total} 条</div>
            <div className="space-x-2">
              <button
                className="px-3 py-1 rounded-md bg-background-secondary border border-border-primary text-text-primary disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                上一页
              </button>
              <button
                className="px-3 py-1 rounded-md bg-background-secondary border border-border-primary text-text-primary disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </LiquidGlass>

      {modalOpen && (
        <UserForm open={modalOpen} initial={editingUser} onClose={() => setModalOpen(false)} onSubmit={onSubmit} />
      )}
    </div>
  );
};

export default UsersManagement;
