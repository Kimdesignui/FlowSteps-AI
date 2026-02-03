
import { Guide, Project } from '../types';
import { getCurrentUser } from './authService';

// Helper to get keys based on current user
const getStorageKeys = () => {
    const user = getCurrentUser();
    const suffix = user ? `_${user.id}` : '_guest';
    return {
        GUIDES: `df_guides${suffix}`,
        PROJECTS: `df_projects${suffix}`
    };
};

// --- Guides ---

export const getGuides = (): Guide[] => {
    const keys = getStorageKeys();
    const data = localStorage.getItem(keys.GUIDES);
    return data ? JSON.parse(data) : [];
};

export const getGuideById = (id: string): Guide | undefined => {
    const guides = getGuides();
    return guides.find(g => g.id === id);
};

export const saveGuide = (guide: Guide): void => {
    const keys = getStorageKeys();
    const guides = getGuides();
    const index = guides.findIndex(g => g.id === guide.id);
    if (index >= 0) {
        guides[index] = guide;
    } else {
        guides.push(guide);
    }
    localStorage.setItem(keys.GUIDES, JSON.stringify(guides));
};

export const deleteGuide = (id: string): void => {
    const keys = getStorageKeys();
    const guides = getGuides().filter(g => g.id !== id);
    localStorage.setItem(keys.GUIDES, JSON.stringify(guides));
    
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
        localStorage.setItem(keys.PROJECTS, JSON.stringify(updatedProjects));
    }
};

// --- Projects ---

export const getProjects = (): Project[] => {
    const keys = getStorageKeys();
    const data = localStorage.getItem(keys.PROJECTS);
    return data ? JSON.parse(data) : [];
};

export const getProjectById = (id: string): Project | undefined => {
    const projects = getProjects();
    return projects.find(p => p.id === id);
};

export const saveProject = (project: Project): void => {
    const keys = getStorageKeys();
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
        projects[index] = project;
    } else {
        projects.push(project);
    }
    localStorage.setItem(keys.PROJECTS, JSON.stringify(projects));
};

export const deleteProject = (id: string): void => {
    const keys = getStorageKeys();
    const projects = getProjects().filter(p => p.id !== id);
    localStorage.setItem(keys.PROJECTS, JSON.stringify(projects));
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
    const user = getCurrentUser();
    const username = user ? user.username : 'backup';
    link.download = `flowsteps_${username}_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
};

export const importData = async (file: File): Promise<boolean> => {
    const keys = getStorageKeys();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (data.guides && Array.isArray(data.guides)) {
                    localStorage.setItem(keys.GUIDES, JSON.stringify(data.guides));
                }
                if (data.projects && Array.isArray(data.projects)) {
                    localStorage.setItem(keys.PROJECTS, JSON.stringify(data.projects));
                }
                resolve(true);
            } catch (err) {
                console.error("Import failed", err);
                reject(false);
            }
        };
        reader.readAsText(file);
    });
};

export const clearAllData = () => {
    const keys = getStorageKeys();
    localStorage.removeItem(keys.GUIDES);
    localStorage.removeItem(keys.PROJECTS);
};
