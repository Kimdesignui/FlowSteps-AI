import React, { useEffect, useState } from 'react';
import { Guide, Project } from '../types';
import { getGuides, getProjects, deleteGuide, deleteProject, exportData } from '../services/storageService';
import { IconPlus, IconFolder, IconFileText, IconTrash, IconDownload } from './Icons';

interface DashboardProps {
    onCreateGuide: () => void;
    onCreateProject: () => void;
    onEditGuide: (id: string) => void;
    onViewProject: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCreateGuide, onCreateProject, onEditGuide, onViewProject }) => {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setGuides(getGuides().sort((a, b) => b.lastModified - a.lastModified));
        setProjects(getProjects().sort((a, b) => b.lastModified - a.lastModified));
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

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <span className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-indigo-300">FS</span> 
                            FlowSteps AI Dashboard
                        </h1>
                        <p className="text-slate-500 mt-1 ml-14">Quản lý dự án và tài liệu hướng dẫn của bạn.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={exportData} className="btn btn-ghost gap-2 text-slate-600 hover:bg-slate-200">
                            <IconDownload className="w-4 h-4" /> Sao lưu
                        </button>
                        <button onClick={onCreateProject} className="btn btn-outline border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 gap-2">
                            <IconFolder className="w-4 h-4" /> Dự án mới
                        </button>
                    </div>
                </div>

                <div className="mb-12">
                     <button onClick={onCreateGuide} className="w-full group relative overflow-hidden bg-white text-slate-800 p-8 rounded-3xl shadow-soft border border-indigo-50 hover:border-indigo-200 hover:shadow-xl hover:scale-[1.005] transition-all text-left flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                            <IconPlus className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-1 text-slate-900">Tạo Hướng Dẫn Mới</h2>
                            <p className="text-slate-500">Chụp ảnh màn hình thủ công, tải ảnh lên và thêm chú thích.</p>
                        </div>
                     </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Projects Section */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <IconFolder className="w-5 h-5 text-indigo-500" /> Dự án
                        </h2>
                        {projects.length === 0 ? (
                            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
                                Chưa có dự án nào. Hãy tạo mới để tổ chức hướng dẫn.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {projects.map(p => (
                                    <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex justify-between items-center group">
                                        <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => onViewProject(p.id)}>
                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
                                                {p.title.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{p.title}</h3>
                                                <p className="text-sm text-slate-400">{p.guideIds.length} hướng dẫn • {new Date(p.lastModified).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteProject(p.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                            <IconTrash className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Guides Section */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <IconFileText className="w-5 h-5 text-pink-500" /> Hướng dẫn gần đây
                        </h2>
                        {guides.length === 0 ? (
                            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
                                Chưa có hướng dẫn nào được tạo.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {guides.map(g => (
                                    <div key={g.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex justify-between items-center group">
                                        <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => onEditGuide(g.id)}>
                                            {g.steps.length > 0 ? (
                                                <img src={g.steps[0].image} className="w-16 h-12 object-cover rounded-lg border border-slate-100" alt="thumb" />
                                            ) : (
                                                <div className="w-16 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300"><IconFileText /></div>
                                            )}
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-800 truncate group-hover:text-pink-600 transition-colors">{g.metadata.title}</h3>
                                                <p className="text-xs text-slate-400">{g.steps.length} bước • {new Date(g.lastModified).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteGuide(g.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-2">
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