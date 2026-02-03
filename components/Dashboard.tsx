
import React, { useEffect, useState } from 'react';
import { Guide, Project } from '../types';
import { getGuides, getProjects, deleteGuide, deleteProject, exportData, clearAllData, saveProject } from '../services/storageService';
import { IconPlus, IconFolder, IconFileText, IconTrash, IconDownload, IconGrid, IconList, IconEdit, IconCheck } from './Icons';

interface DashboardProps {
    onCreateGuide: () => void;
    onCreateProject: () => void;
    onEditGuide: (id: string) => void;
    onViewProject: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCreateGuide, onCreateProject, onEditGuide, onViewProject }) => {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    
    // View States
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setGuides(getGuides().sort((a, b) => b.lastModified - a.lastModified));
        setProjects(getProjects().sort((a, b) => b.lastModified - a.lastModified));
        setSelectedProjects(new Set()); // Clear selection on reload
    };

    const handleDeleteGuide = (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa hướng dẫn này không?")) {
            deleteGuide(id);
            loadData();
        }
    };

    const handleDeleteProject = (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa dự án này không?")) {
            deleteProject(id);
            loadData();
        }
    };

    const handleClearAllData = () => {
        const text = prompt("CẢNH BÁO: Hành động này sẽ xóa TẤT CẢ dự án và hướng dẫn.\nKhông thể hoàn tác.\n\nNhập 'DELETE' để xác nhận:");
        if (text === 'DELETE') {
            clearAllData();
            loadData();
            alert("Đã xóa toàn bộ dữ liệu.");
        }
    };

    // --- Bulk Actions ---

    const toggleProjectSelection = (id: string) => {
        const newSet = new Set(selectedProjects);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedProjects(newSet);
    };

    const toggleAllProjects = () => {
        if (selectedProjects.size === projects.length) {
            setSelectedProjects(new Set());
        } else {
            setSelectedProjects(new Set(projects.map(p => p.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedProjects.size === 0) return;
        if (confirm(`Bạn có chắc muốn xóa ${selectedProjects.size} dự án đã chọn không?`)) {
            selectedProjects.forEach(id => deleteProject(id));
            loadData();
        }
    };

    // --- Rename Project ---

    const startEditingProject = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setEditingProjectId(project.id);
        setEditTitle(project.title);
    };

    const saveProjectTitle = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (editingProjectId && editTitle.trim()) {
            const project = projects.find(p => p.id === editingProjectId);
            if (project) {
                saveProject({ ...project, title: editTitle, lastModified: Date.now() });
                loadData();
            }
        }
        setEditingProjectId(null);
    };

    return (
        <div className="min-h-screen bg-base-200 p-8 font-sans text-base-content transition-colors duration-200">
            <div className="max-w-6xl mx-auto relative">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-base-content tracking-tight">
                            Tổng quan
                        </h1>
                        <p className="text-base-content/60 mt-1">Quản lý dự án và tài liệu hướng dẫn của bạn.</p>
                    </div>
                    <div className="flex gap-3">
                         <button onClick={handleClearAllData} className="btn btn-ghost gap-2 text-red-400 hover:bg-red-50 hover:text-red-600 text-xs uppercase font-bold tracking-wide">
                            Reset Dữ liệu
                        </button>
                        <div className="w-px h-8 bg-base-300 my-auto mx-2"></div>
                        <button onClick={exportData} className="btn btn-ghost gap-2 text-base-content hover:bg-base-300">
                            <IconDownload className="w-4 h-4" /> Sao lưu
                        </button>
                        <button onClick={onCreateProject} className="btn btn-outline border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 gap-2">
                            <IconFolder className="w-4 h-4" /> Dự án mới
                        </button>
                    </div>
                </div>

                {/* Create Guide Banner */}
                <div className="mb-12">
                     <button onClick={onCreateGuide} className="w-full group relative overflow-hidden bg-base-100 text-base-content p-8 rounded-3xl shadow-soft border border-base-300 hover:border-indigo-200 hover:shadow-xl hover:scale-[1.005] transition-all text-left flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                            <IconPlus className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Tạo Hướng Dẫn Mới</h2>
                            <p className="text-base-content/60">Chụp ảnh màn hình thủ công, tải ảnh lên và thêm chú thích.</p>
                        </div>
                     </button>
                </div>

                {/* Floating Bulk Action Bar */}
                {selectedProjects.size > 0 && (
                    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white text-slate-800 px-6 py-3 rounded-full shadow-2xl border border-slate-200 z-50 flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
                        <span className="font-bold text-sm bg-slate-100 px-2 py-1 rounded text-slate-600">{selectedProjects.size} đã chọn</span>
                        <div className="h-4 w-px bg-slate-300"></div>
                        <button onClick={handleBulkDelete} className="text-red-500 hover:text-red-700 font-bold text-sm flex items-center gap-2">
                            <IconTrash className="w-4 h-4" /> Xóa
                        </button>
                        <button onClick={() => setSelectedProjects(new Set())} className="text-slate-400 hover:text-slate-600 text-sm">
                            Hủy
                        </button>
                    </div>
                )}

                <div className="flex flex-col gap-12">
                    {/* Projects Section */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
                                <IconFolder className="w-5 h-5 text-indigo-500" /> Dự án
                            </h2>
                            <div className="join border border-base-300 rounded-lg">
                                <button 
                                    className={`join-item btn btn-sm ${viewMode === 'grid' ? 'btn-active bg-indigo-50 text-indigo-600 border-indigo-100' : 'btn-ghost'}`}
                                    onClick={() => setViewMode('grid')}
                                    title="Chế độ Lưới"
                                >
                                    <IconGrid className="w-4 h-4" />
                                </button>
                                <button 
                                    className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-active bg-indigo-50 text-indigo-600 border-indigo-100' : 'btn-ghost'}`}
                                    onClick={() => setViewMode('list')}
                                    title="Chế độ Danh sách"
                                >
                                    <IconList className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {projects.length === 0 ? (
                            <div className="bg-base-100 rounded-2xl border-2 border-dashed border-base-300 p-8 text-center text-base-content/40">
                                Chưa có dự án nào. Hãy tạo mới để tổ chức hướng dẫn.
                            </div>
                        ) : (
                            <>
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {projects.map(p => (
                                            <div 
                                                key={p.id} 
                                                className={`relative bg-base-100 p-5 rounded-2xl shadow-sm border transition-all flex flex-col group cursor-pointer ${selectedProjects.has(p.id) ? 'border-indigo-400 bg-indigo-50' : 'border-base-300 hover:shadow-md hover:border-indigo-200'}`}
                                                onClick={() => {
                                                    if (selectedProjects.size > 0) toggleProjectSelection(p.id);
                                                    else onViewProject(p.id);
                                                }}
                                            >
                                                {/* Checkbox for bulk select (Top Left) */}
                                                <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="checkbox checkbox-sm checkbox-primary rounded-md opacity-0 group-hover:opacity-100 checked:opacity-100 transition-opacity"
                                                        checked={selectedProjects.has(p.id)}
                                                        onChange={() => toggleProjectSelection(p.id)}
                                                    />
                                                </div>

                                                <div className="flex justify-between items-start mb-3 pl-8">
                                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shrink-0">
                                                        {p.title.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={(e) => startEditingProject(e, p)} className="p-2 text-base-content/40 hover:text-indigo-600 hover:bg-indigo-50 rounded-full">
                                                            <IconEdit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteProject(p.id)} className="p-2 text-base-content/40 hover:text-red-500 hover:bg-red-50 rounded-full">
                                                            <IconTrash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {editingProjectId === p.id ? (
                                                    <form onSubmit={saveProjectTitle} className="mb-1" onClick={(e) => e.stopPropagation()}>
                                                        <input 
                                                            autoFocus
                                                            className="input input-sm w-full input-bordered focus:input-primary font-bold text-lg px-1"
                                                            value={editTitle}
                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                            onBlur={() => saveProjectTitle()}
                                                        />
                                                    </form>
                                                ) : (
                                                    <h3 className="font-bold text-lg text-base-content mb-1 truncate">{p.title}</h3>
                                                )}
                                                
                                                <p className="text-sm text-base-content/60">{p.guideIds.length} hướng dẫn</p>
                                                <p className="text-xs text-base-content/40 mt-auto pt-4">{new Date(p.lastModified).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-300 shadow-sm">
                                        <table className="table w-full">
                                            <thead className="bg-base-200/50 text-base-content/60">
                                                <tr>
                                                    <th className="w-10">
                                                        <label>
                                                            <input type="checkbox" className="checkbox checkbox-sm rounded-md" checked={selectedProjects.size === projects.length && projects.length > 0} onChange={toggleAllProjects} />
                                                        </label>
                                                    </th>
                                                    <th>Tên dự án</th>
                                                    <th>Hướng dẫn</th>
                                                    <th>Cập nhật lần cuối</th>
                                                    <th className="text-right">Hành động</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projects.map(p => (
                                                    <tr key={p.id} className={`hover:bg-base-200/50 cursor-pointer ${selectedProjects.has(p.id) ? 'bg-indigo-50 hover:bg-indigo-100' : ''}`} onClick={() => onViewProject(p.id)}>
                                                        <td onClick={(e) => e.stopPropagation()}>
                                                            <label>
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="checkbox checkbox-sm checkbox-primary rounded-md" 
                                                                    checked={selectedProjects.has(p.id)}
                                                                    onChange={() => toggleProjectSelection(p.id)}
                                                                />
                                                            </label>
                                                        </td>
                                                        <td>
                                                            {editingProjectId === p.id ? (
                                                                <form onSubmit={saveProjectTitle} className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                                                                    <input 
                                                                        autoFocus
                                                                        className="input input-sm input-bordered focus:input-primary font-bold w-full max-w-xs"
                                                                        value={editTitle}
                                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                                        onBlur={() => saveProjectTitle()}
                                                                    />
                                                                    <button type="submit" className="btn btn-xs btn-circle btn-primary"><IconCheck className="w-3 h-3" /></button>
                                                                </form>
                                                            ) : (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                                        {p.title.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="font-bold">{p.title}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td><span className="badge badge-ghost badge-sm">{p.guideIds.length}</span></td>
                                                        <td className="text-base-content/50 text-xs">{new Date(p.lastModified).toLocaleDateString('vi-VN')}</td>
                                                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={(e) => startEditingProject(e, p)} className="btn btn-sm btn-ghost btn-square text-indigo-500">
                                                                    <IconEdit className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDeleteProject(p.id)} className="btn btn-sm btn-ghost btn-square text-red-500">
                                                                    <IconTrash className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </section>

                    {/* Guides Section */}
                    <section>
                        <h2 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
                            <IconFileText className="w-5 h-5 text-pink-500" /> Hướng dẫn gần đây
                        </h2>
                        {guides.length === 0 ? (
                            <div className="bg-base-100 rounded-2xl border-2 border-dashed border-base-300 p-8 text-center text-base-content/40">
                                Chưa có hướng dẫn nào được tạo.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {guides.map(g => (
                                    <div key={g.id} className="bg-base-100 p-4 rounded-2xl shadow-sm border border-base-300 hover:shadow-md transition-shadow flex justify-between items-center group">
                                        <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={() => onEditGuide(g.id)}>
                                            {g.steps.length > 0 ? (
                                                <img src={g.steps[0].image} className="w-16 h-12 object-cover rounded-lg border border-base-200 shrink-0" alt="thumb" />
                                            ) : (
                                                <div className="w-16 h-12 bg-base-200 rounded-lg flex items-center justify-center text-base-content/30 shrink-0"><IconFileText /></div>
                                            )}
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-base-content truncate group-hover:text-pink-600 transition-colors">{g.metadata.title}</h3>
                                                <p className="text-xs text-base-content/60">{g.steps.length} bước • {new Date(g.lastModified).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteGuide(g.id)} className="p-2 text-base-content/30 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-2 shrink-0">
                                            <IconTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
