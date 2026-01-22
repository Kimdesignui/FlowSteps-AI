import React, { useEffect, useState } from 'react';
import { Guide, Project } from '../types';
import { getGuides, getProjects, deleteGuide, deleteProject, exportData } from '../services/storageService';
import { IconPlus, IconFolder, IconFileText, IconTrash, IconDownload } from './Icons';

interface DashboardProps {
    onCreateGuide: () => void;
    onCreateProject: () => void;
    onEditGuide: (id: string) => void;
    onViewProject: (id: string) => void;
    onRecordFlow: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCreateGuide, onCreateProject, onEditGuide, onViewProject, onRecordFlow }) => {
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
        if (confirm("Are you sure you want to delete this guide?")) {
            deleteGuide(id);
            loadData();
        }
    };

    const handleDeleteProject = (id: string) => {
        if (confirm("Are you sure you want to delete this project?")) {
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
                        <p className="text-slate-500 mt-1 ml-14">Manage your documentation projects and guides.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={exportData} className="btn btn-ghost gap-2 text-slate-600 hover:bg-slate-200">
                            <IconDownload className="w-4 h-4" /> Backup
                        </button>
                        <button onClick={onCreateProject} className="btn btn-outline border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 gap-2">
                            <IconFolder className="w-4 h-4" /> New Project
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                     <button onClick={onCreateGuide} className="group relative overflow-hidden bg-white text-slate-800 p-8 rounded-3xl shadow-soft border border-indigo-50 hover:border-indigo-200 hover:shadow-xl hover:scale-[1.005] transition-all text-left flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                            <IconPlus className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-1 text-slate-900">Create New Guide</h2>
                            <p className="text-slate-500">Capture screenshots manually, upload images, and annotate.</p>
                        </div>
                     </button>
                     <button onClick={onRecordFlow} className="group relative overflow-hidden bg-white text-slate-800 p-8 rounded-3xl shadow-soft border border-pink-50 hover:border-pink-200 hover:shadow-xl hover:scale-[1.005] transition-all text-left flex items-center gap-6">
                        <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center shrink-0">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-1 text-slate-900">Record Flow</h2>
                            <p className="text-slate-500">Auto-capture steps while you browse websites.</p>
                        </div>
                     </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Projects Section */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <IconFolder className="w-5 h-5 text-indigo-500" /> Projects
                        </h2>
                        {projects.length === 0 ? (
                            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
                                No projects yet. Create one to organize your guides.
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
                                                <p className="text-sm text-slate-400">{p.guideIds.length} guides • {new Date(p.lastModified).toLocaleDateString()}</p>
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
                            <IconFileText className="w-5 h-5 text-pink-500" /> Recent Guides
                        </h2>
                        {guides.length === 0 ? (
                            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
                                No guides created yet.
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
                                                <p className="text-xs text-slate-400">{g.steps.length} steps • {new Date(g.lastModified).toLocaleDateString()}</p>
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