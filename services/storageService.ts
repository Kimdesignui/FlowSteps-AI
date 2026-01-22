import { Guide, Project } from '../types';

const STORAGE_KEYS = {
    GUIDES: 'df_guides',
    PROJECTS: 'df_projects'
};

// --- Guides ---

export const getGuides = (): Guide[] => {
    const data = localStorage.getItem(STORAGE_KEYS.GUIDES);
    return data ? JSON.parse(data) : [];
};

export const getGuideById = (id: string): Guide | undefined => {
    const guides = getGuides();
    return guides.find(g => g.id === id);
};

export const saveGuide = (guide: Guide): void => {
    const guides = getGuides();
    const index = guides.findIndex(g => g.id === guide.id);
    if (index >= 0) {
        guides[index] = guide;
    } else {
        guides.push(guide);
    }
    localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(guides));
};

export const deleteGuide = (id: string): void => {
    const guides = getGuides().filter(g => g.id !== id);
    localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(guides));
    
    // Also remove from any projects
    const projects = getProjects();
    let changed = false;
    const updatedProjects = projects.map(p => {
        if (p.guideIds.includes(id)) {
            changed = true;
            return { ...p, guideIds: p.guideIds.filter(gid => gid !== id) };
        }
        return p;
    });
    if (changed) {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects));
    }
};

// --- Projects ---

export const getProjects = (): Project[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
};

export const getProjectById = (id: string): Project | undefined => {
    const projects = getProjects();
    return projects.find(p => p.id === id);
};

export const saveProject = (project: Project): void => {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
        projects[index] = project;
    } else {
        projects.push(project);
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
};

export const deleteProject = (id: string): void => {
    const projects = getProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
};

// --- Utils ---
export const exportData = () => {
    const data = {
        guides: getGuides(),
        projects: getProjects()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `docuflow_backup_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
};