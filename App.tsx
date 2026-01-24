import React, { useState } from 'react';
import GuideEditor from './components/GuideEditor';
import Dashboard from './components/Dashboard';
import ProjectView from './components/ProjectView';
import { DocStep, Guide, Project } from './types';
import { saveGuide, getGuideById, saveProject, getProjectById } from './services/storageService';

type ViewState = 
    | { type: 'dashboard' }
    | { type: 'editor', guideId?: string, projectId?: string } // if projectId is present, we return to project view
    | { type: 'project', projectId: string };

export default function App() {
    const [currentView, setCurrentView] = useState<ViewState>({ type: 'dashboard' });

    // --- Navigation Handlers ---

    const navigateToDashboard = () => setCurrentView({ type: 'dashboard' });

    const navigateToNewGuide = () => setCurrentView({ type: 'editor' });

    const navigateToEditGuide = (id: string) => setCurrentView({ type: 'editor', guideId: id });

    const navigateToProject = (id: string) => setCurrentView({ type: 'project', projectId: id });

    // --- Action Handlers ---

    const handleCreateProject = () => {
        const title = prompt("Nhập tên dự án mới:");
        if (title) {
            const newProject: Project = {
                id: Date.now().toString(),
                title,
                guideIds: [],
                lastModified: Date.now()
            };
            saveProject(newProject);
            navigateToProject(newProject.id);
        }
    };

    const handleCreateGuideForProject = (projectId: string) => {
        // Create a new guide directly inside a project flow
        setCurrentView({ type: 'editor', projectId });
    };

    const handleSaveGuide = (guide: Guide) => {
        saveGuide(guide);
        
        // If we are in "Project Context" (i.e. we came from a project or creating for a project)
        if (currentView.type === 'editor' && currentView.projectId) {
             const projectId = currentView.projectId;
             const project = getProjectById(projectId);
             if (project && !project.guideIds.includes(guide.id)) {
                 project.guideIds.push(guide.id);
                 project.lastModified = Date.now();
                 saveProject(project);
             }
             // We don't change view immediately to allow user to continue editing if they just hit save
        }
        
        // If we were creating a NEW guide, switch the view to "edit" mode for this specific guide
        // This ensures subsequent saves or back navigation know which guide we are working on.
        if (currentView.type === 'editor' && !currentView.guideId) {
             setCurrentView(prev => ({ ...prev, guideId: guide.id }));
        }
    };

    const handleBackFromEditor = () => {
        if (currentView.type === 'editor' && currentView.projectId) {
            setCurrentView({ type: 'project', projectId: currentView.projectId });
        } else {
            navigateToDashboard();
        }
    };

    // --- Render Logic ---

    if (currentView.type === 'dashboard') {
        return (
            <Dashboard 
                onCreateGuide={navigateToNewGuide}
                onCreateProject={handleCreateProject}
                onEditGuide={navigateToEditGuide}
                onViewProject={navigateToProject}
            />
        );
    }

    if (currentView.type === 'project') {
        return (
            <ProjectView 
                projectId={currentView.projectId}
                onBack={navigateToDashboard}
                onEditGuide={(guideId) => setCurrentView({ type: 'editor', guideId, projectId: currentView.projectId })}
                onCreateGuideForProject={handleCreateGuideForProject}
            />
        );
    }

    if (currentView.type === 'editor') {
        const initialGuide = currentView.guideId ? getGuideById(currentView.guideId) : null;
        // Key is important to force re-mount when switching between guides or creating new one
        return (
            <React.Fragment key={currentView.guideId || 'new'}>
                <GuideEditor 
                    initialGuide={initialGuide || null}
                    onSave={handleSaveGuide}
                    onBack={handleBackFromEditor}
                />
            </React.Fragment>
        );
    }

    return null;
}