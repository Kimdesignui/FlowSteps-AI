
import React, { useEffect, useState } from 'react';
import { User, getAllUsers, deleteUser, adminResetPassword } from '../services/authService';
import { getGlobalProjects, deleteGlobalProject } from '../services/storageService';
import { IconTrash, IconRefresh, IconHome, IconFolder, IconMonitor, IconShield } from './Icons';
import { Project } from '../types';

interface AdminDashboardProps {
    onLogout: () => void;
    onBack?: () => void;
}

type Tab = 'users' | 'projects';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onBack }) => {
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<(Project & { ownerName: string, ownerId: string })[]>([]);
    const [stats, setStats] = useState({ guides: 0, projects: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const allUsers = getAllUsers();
        setUsers(allUsers);
        
        const allProjects = getGlobalProjects();
        setProjects(allProjects);
        
        // Calculate rough stats (counting localStorage keys as a proxy for guide count is messy, so we just count loaded projects)
        let totalGuides = 0;
        // Simple heuristic: scan all guide keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('df_guides_')) {
                const data = JSON.parse(localStorage.getItem(key) || '[]');
                totalGuides += data.length;
            }
        }
        setStats({ guides: totalGuides, projects: allProjects.length });
    };

    // --- User Actions ---
    const handleDeleteUser = (userId: string) => {
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

    // --- Project Actions ---
    const handleDeleteProject = (userId: string, projectId: string) => {
        if (confirm('Admin xóa dự án này? Người dùng sẽ không thể truy cập nữa.')) {
            deleteGlobalProject(userId, projectId);
            loadData();
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
            {/* Admin Header */}
            <div className="bg-slate-900 text-white p-6 shadow-md sticky top-0 z-30">
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
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <IconMonitor className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-xs font-bold uppercase">Thành viên</div>
                            <div className="text-3xl font-black text-slate-800">{users.length}</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                            <IconFolder className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-xs font-bold uppercase">Tổng dự án</div>
                            <div className="text-3xl font-black text-slate-800">{stats.projects}</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <IconShield className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-xs font-bold uppercase">Tổng hướng dẫn</div>
                            <div className="text-3xl font-black text-slate-800">{stats.guides}</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                    <div className="border-b border-slate-100 px-6 pt-4 flex justify-between items-center bg-slate-50/50">
                        <div className="flex gap-8">
                            <button 
                                onClick={() => setActiveTab('users')}
                                className={`pb-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                Danh sách thành viên
                            </button>
                            <button 
                                onClick={() => setActiveTab('projects')}
                                className={`pb-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'projects' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                Quản lý dự án
                            </button>
                        </div>
                        <button onClick={loadData} className="btn btn-sm btn-ghost mb-2" title="Làm mới dữ liệu">
                            <IconRefresh className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-0">
                        {activeTab === 'users' && (
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead className="bg-slate-50 text-slate-500">
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
                                            <tr key={u.id} className="hover:bg-slate-50/50 border-b border-slate-100">
                                                <td className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="avatar placeholder">
                                                            <div className="bg-slate-100 text-slate-600 rounded-full w-8 h-8 flex items-center justify-center">
                                                                <span className="font-bold text-xs">{u.name.charAt(0).toUpperCase()}</span>
                                                            </div>
                                                        </div>
                                                        {u.name}
                                                    </div>
                                                </td>
                                                <td className="font-mono text-xs text-slate-500">{u.username}</td>
                                                <td>
                                                    {u.role === 'admin' 
                                                        ? <span className="px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-red-600 uppercase">Admin</span> 
                                                        : <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">Member</span>
                                                    }
                                                </td>
                                                <td className="text-slate-400 text-xs italic">
                                                    {u.recoveryCode || '---'}
                                                </td>
                                                <td className="text-slate-500 text-xs">
                                                    {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="text-right">
                                                    {u.role !== 'admin' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => handleResetPassword(u.id)}
                                                                className="btn btn-xs bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600"
                                                                title="Reset Password về 123456"
                                                            >
                                                                Reset Pass
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="btn btn-xs bg-white border-slate-200 hover:bg-red-50 hover:border-red-200 text-red-500"
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
                        )}

                        {activeTab === 'projects' && (
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th>Dự án</th>
                                            <th>Chủ sở hữu</th>
                                            <th>Số lượng hướng dẫn</th>
                                            <th>Cập nhật cuối</th>
                                            <th className="text-right">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projects.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                                                    Chưa có dự án nào trong hệ thống.
                                                </td>
                                            </tr>
                                        ) : (
                                            projects.map((p) => (
                                                <tr key={p.id} className="hover:bg-slate-50/50 border-b border-slate-100">
                                                    <td className="font-bold text-indigo-900">
                                                        {p.title}
                                                        <div className="text-[10px] font-normal text-slate-400 font-mono">{p.id}</div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                             <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
                                                                {p.ownerName.charAt(0).toUpperCase()}
                                                             </div>
                                                             <span className="text-sm">{p.ownerName}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-sm badge-ghost">{p.guideIds.length}</span>
                                                    </td>
                                                    <td className="text-slate-500 text-xs">
                                                        {new Date(p.lastModified).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    <td className="text-right">
                                                        <button 
                                                            onClick={() => handleDeleteProject(p.ownerId, p.id)}
                                                            className="btn btn-xs btn-ghost text-red-400 hover:bg-red-50 hover:text-red-600"
                                                            title="Xóa dự án này"
                                                        >
                                                            <IconTrash className="w-4 h-4" /> Xóa
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex gap-4 items-start">
                    <div className="font-bold shrink-0 mt-0.5">ℹ️ Lưu ý Admin:</div>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Dữ liệu hiện tại được lưu trên <strong>localStorage</strong> của trình duyệt này.</li>
                        <li>Nếu người dùng sử dụng máy tính/trình duyệt khác, bạn sẽ không thấy dữ liệu của họ ở đây (trừ khi có Backend tập trung).</li>
                        <li>Tính năng này mô phỏng quyền quản trị để bạn kiểm soát dữ liệu trên môi trường hiện tại.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
