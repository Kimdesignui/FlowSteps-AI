import React, { useEffect, useState } from 'react';
import { Project, Guide } from '../types';
import { getProjectById, getGuideById, saveProject } from '../services/storageService';
import { IconArrowRight, IconPlus, IconFileText, IconHome } from './Icons';

interface ProjectViewProps {
    projectId: string;
    onBack: () => void;
    onEditGuide: (guideId: string) => void;
    onCreateGuideForProject: (projectId: string) => void;
}

const ProjectView: React.FC<ProjectViewProps> = ({ projectId, onBack, onEditGuide, onCreateGuideForProject }) => {
    const [project, setProject] = useState<Project | undefined>();
    const [guides, setGuides] = useState<Guide[]>([]);

    useEffect(() => {
        const p = getProjectById(projectId);
        if (p) {
            setProject(p);
            // Load guide details
            const loadedGuides = p.guideIds
                .map(id => getGuideById(id))
                .filter((g): g is Guide => !!g);
            setGuides(loadedGuides);
        }
    }, [projectId]);

    const handleRemoveGuide = (guideId: string) => {
        if (!project) return;
        const newGuideIds = project.guideIds.filter(id => id !== guideId);
        const updatedProject = { ...project, guideIds: newGuideIds };
        saveProject(updatedProject);
        setProject(updatedProject);
        setGuides(guides.filter(g => g.id !== guideId));
    };

    if (!project) return <div>Không tìm thấy dự án</div>;

    return (
        <div className="min-h-screen bg-base-200 p-8 font-sans text-base-content">
            <div className="max-w-5xl mx-auto">
                <button onClick={onBack} className="mb-6 flex items-center gap-2 text-base-content/60 hover:text-primary transition-colors font-medium">
                    <IconHome className="w-4 h-4" /> Bảng điều khiển
                </button>
                
                <div className="flex justify-between items-end mb-10 border-b border-base-300 pb-8">
                    <div>
                        <div className="uppercase tracking-widest text-xs font-bold text-primary mb-2">Dự án</div>
                        <h1 className="text-4xl font-black text-base-content">{project.title}</h1>
                        <p className="text-base-content/60 mt-2">{guides.length} hướng dẫn trong bộ sưu tập này</p>
                    </div>
                    <button onClick={() => onCreateGuideForProject(projectId)} className="btn btn-primary gap-2 shadow-glow text-primary-content border-none gradient-bg">
                        <IconPlus className="w-4 h-4" /> Thêm hướng dẫn
                    </button>
                </div>

                <div className="grid gap-4">
                    {guides.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-base-300 rounded-3xl text-base-content/40 bg-base-100">
                            <IconFileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-bold text-base-content/70">Dự án này đang trống</h3>
                            <p>Tạo hướng dẫn mới để bắt đầu.</p>
                        </div>
                    ) : (
                        guides.map((guide, index) => (
                            <div key={guide.id} className="group bg-base-100 p-6 rounded-2xl shadow-sm border border-base-300 hover:shadow-lg transition-all flex items-center gap-6">
                                <div className="font-bold text-base-content/30 text-xl w-8">{index + 1}</div>
                                {guide.steps.length > 0 ? (
                                    <img src={guide.steps[0].image} className="w-24 h-16 object-cover rounded-lg border border-base-300" alt="thumb" />
                                ) : (
                                    <div className="w-24 h-16 bg-base-200 rounded-lg flex items-center justify-center text-base-content/30"><IconFileText /></div>
                                )}
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-base-content group-hover:text-primary transition-colors cursor-pointer" onClick={() => onEditGuide(guide.id)}>
                                        {guide.metadata.title}
                                    </h3>
                                    <p className="text-sm text-base-content/50 mt-1">{guide.steps.length} bước • Cập nhật lần cuối {new Date(guide.lastModified).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEditGuide(guide.id)} className="btn btn-sm btn-ghost text-primary">Sửa</button>
                                    <button onClick={() => handleRemoveGuide(guide.id)} className="btn btn-sm btn-ghost text-red-400 hover:bg-red-50 hover:text-red-600">Xóa khỏi dự án</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectView;