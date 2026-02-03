
import React, { useRef, useState } from 'react';
import { IconHome, IconDownload, IconPlus, IconExternalLink, IconHelp, IconSun, IconMoon, IconMonitor, IconShield } from './Icons';
import { exportData, importData } from '../services/storageService';
import HelpModal from './HelpModal';
import { User } from '../services/authService';

interface SidebarProps {
    activeView: 'dashboard' | 'project' | 'editor' | 'admin';
    onNavigate: (view: 'dashboard' | 'admin') => void;
    onCreateProject: () => void;
    className?: string;
    theme: 'light' | 'dark' | 'system';
    onSetTheme: (t: 'light' | 'dark' | 'system') => void;
    user: User;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, onCreateProject, className, theme, onSetTheme, user, onLogout }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showHelp, setShowHelp] = useState(false);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (confirm("Hành động này sẽ ghi đè dữ liệu hiện tại bằng bản sao lưu. Bạn có chắc chắn không?")) {
            const success = await importData(file);
            if (success) {
                alert("Khôi phục dữ liệu thành công! Trang sẽ được tải lại.");
                window.location.reload();
            } else {
                alert("File không hợp lệ.");
            }
        }
        e.target.value = '';
    };

    return (
        <>
            <div className={`w-64 bg-base-100 text-base-content border-r border-base-300 flex flex-col h-full shrink-0 transition-colors duration-200 ${className}`}>
                <div className="p-6">
                    <div className="flex items-center gap-3 text-base-content font-black text-xl tracking-tight mb-8">
                        <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-sm shadow-lg shadow-indigo-500/50">FS</span> 
                        FlowSteps
                    </div>

                    <div className="bg-base-200 rounded-xl p-3 mb-6 flex items-center gap-3 border border-base-300">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{user.name}</div>
                            <div className="text-xs text-base-content/50 truncate">@{user.username}</div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <button 
                            onClick={() => onNavigate('dashboard')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium ${
                                activeView === 'dashboard' 
                                ? 'bg-primary text-primary-content shadow-lg shadow-primary/30' 
                                : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                            }`}
                        >
                            <IconHome className="w-5 h-5" /> Tổng quan
                        </button>
                        <button 
                             onClick={onCreateProject}
                             className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content"
                        >
                            <IconPlus className="w-5 h-5" /> Dự án mới
                        </button>

                        {user.role === 'admin' && (
                             <button 
                                onClick={() => onNavigate('admin')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium ${
                                    activeView === 'admin' 
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                                    : 'text-red-500 hover:bg-red-50 hover:text-red-600'
                                }`}
                             >
                                <IconShield className="w-5 h-5" /> Quản trị hệ thống
                             </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 px-6">
                    <div className="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-4 mt-4">Dữ liệu</div>
                    <div className="space-y-1">
                        <button onClick={exportData} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/70 hover:bg-base-200 hover:text-base-content transition-colors">
                            <IconDownload className="w-4 h-4" /> Sao lưu JSON
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/70 hover:bg-base-200 hover:text-base-content transition-colors">
                            <IconExternalLink className="w-4 h-4 rotate-180" /> Khôi phục dữ liệu
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                    </div>
                </div>

                <div className="p-6 border-t border-base-300">
                     <button onClick={() => setShowHelp(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary hover:bg-base-200 transition-colors mb-4 font-medium">
                        <IconHelp className="w-4 h-4" /> Hướng dẫn sử dụng
                    </button>
                    
                    <div className="bg-base-200 p-1 rounded-lg flex justify-between mb-4">
                        <button 
                            onClick={() => onSetTheme('light')} 
                            className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50 hover:text-base-content'}`}
                            title="Sáng"
                        >
                            <IconSun className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => onSetTheme('dark')} 
                            className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50 hover:text-base-content'}`}
                            title="Tối"
                        >
                            <IconMoon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => onSetTheme('system')} 
                            className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${theme === 'system' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50 hover:text-base-content'}`}
                            title="Hệ thống"
                        >
                            <IconMonitor className="w-4 h-4" />
                        </button>
                    </div>

                    <button 
                        onClick={onLogout}
                        className="w-full btn btn-sm btn-outline border-base-300 text-base-content hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>

            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </>
    );
};

export default Sidebar;
