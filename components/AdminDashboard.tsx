
import React, { useEffect, useState } from 'react';
import { User, getAllUsers, deleteUser, adminResetPassword } from '../services/authService';
import { IconTrash, IconRefresh, IconArrowRight, IconHome } from './Icons';

interface AdminDashboardProps {
    onLogout: () => void;
    onBack?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onBack }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState({ guides: 0, projects: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const allUsers = getAllUsers();
        setUsers(allUsers);
        
        // Calculate rough stats
        let totalGuides = 0;
        let totalProjects = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('df_guides_')) {
                const data = JSON.parse(localStorage.getItem(key) || '[]');
                totalGuides += data.length;
            }
            if (key?.startsWith('df_projects_')) {
                const data = JSON.parse(localStorage.getItem(key) || '[]');
                totalProjects += data.length;
            }
        }
        setStats({ guides: totalGuides, projects: totalProjects });
    };

    const handleDelete = (userId: string) => {
        if (confirm('CẢNH BÁO: Hành động này sẽ xóa người dùng và TOÀN BỘ dữ liệu của họ. Không thể hoàn tác!')) {
            if (deleteUser(userId)) {
                loadData();
            } else {
                alert('Không thể xóa admin!');
            }
        }
    };

    const handleResetPassword = (userId: string) => {
        if (confirm('Đặt lại mật khẩu người dùng này về "123456"?')) {
            const newPass = adminResetPassword(userId);
            if (newPass) {
                alert(`Thành công! Mật khẩu mới là: ${newPass}`);
                loadData();
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
            <div className="bg-slate-900 text-white p-6 shadow-md">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                         <div className="bg-red-500 text-white font-black px-3 py-1 rounded text-sm uppercase tracking-wider">Admin</div>
                         <h1 className="text-xl font-bold">Quản trị hệ thống</h1>
                    </div>
                    <div className="flex gap-4">
                        {onBack && (
                            <button onClick={onBack} className="btn btn-sm btn-ghost text-white/90 hover:text-white gap-2 border border-white/20">
                                <IconHome className="w-4 h-4" /> Về ứng dụng
                            </button>
                        )}
                        <button onClick={onLogout} className="btn btn-sm btn-ghost text-red-300 hover:text-red-100">Đăng xuất</button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="text-slate-500 text-sm font-bold uppercase mb-1">Tổng người dùng</div>
                        <div className="text-4xl font-black text-indigo-600">{users.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="text-slate-500 text-sm font-bold uppercase mb-1">Tổng dự án</div>
                        <div className="text-4xl font-black text-pink-600">{stats.projects}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="text-slate-500 text-sm font-bold uppercase mb-1">Tổng hướng dẫn</div>
                        <div className="text-4xl font-black text-emerald-600">{stats.guides}</div>
                    </div>
                </div>

                {/* User Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold">Danh sách người dùng</h2>
                        <button onClick={loadData} className="btn btn-sm btn-ghost"><IconRefresh className="w-4 h-4" /></button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th>User</th>
                                    <th>Tên đăng nhập</th>
                                    <th>Vai trò</th>
                                    <th>Mã khôi phục</th>
                                    <th>Ngày tạo</th>
                                    <th className="text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar placeholder">
                                                    <div className="bg-indigo-100 text-indigo-700 rounded-full w-10">
                                                        <span className="font-bold">{u.name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                                <div className="font-bold text-sm">{u.name}</div>
                                            </div>
                                        </td>
                                        <td className="font-mono text-xs">{u.username}</td>
                                        <td>
                                            {u.role === 'admin' 
                                                ? <span className="badge badge-error text-white text-xs">Admin</span> 
                                                : <span className="badge badge-ghost text-xs">User</span>
                                            }
                                        </td>
                                        <td className="text-slate-400 text-xs italic">
                                            {u.recoveryCode || 'Không có'}
                                        </td>
                                        <td className="text-slate-500 text-xs">
                                            {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="text-right">
                                            {u.role !== 'admin' && (
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleResetPassword(u.id)}
                                                        className="btn btn-xs btn-outline border-slate-300 hover:bg-slate-100 hover:text-indigo-600"
                                                        title="Reset Password về 123456"
                                                    >
                                                        Reset Pass
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(u.id)}
                                                        className="btn btn-xs btn-outline border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400 hover:text-red-600"
                                                        title="Xóa người dùng"
                                                    >
                                                        <IconTrash className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                    <strong>Ghi chú Admin:</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Admin mặc định: <code>admin</code> / <code>admin123</code></li>
                        <li>Khi reset mật khẩu người dùng, mật khẩu sẽ về mặc định là <code>123456</code>.</li>
                        <li>Xóa người dùng sẽ xóa vĩnh viễn dữ liệu của họ.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
