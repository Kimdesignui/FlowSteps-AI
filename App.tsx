import React, { useState } from 'react';
import GuideEditor from './components/GuideEditor';
import WebRecorder from './components/WebRecorder';
import Dashboard from './components/Dashboard';
import ProjectView from './components/ProjectView';
import { DocStep, Guide, Project } from './types';
import { saveGuide, getGuideById, saveProject, getProjectById } from './services/storageService';

type ViewState = 
    | { type: 'dashboard' }
    | { type: 'editor', guideId?: string, projectId?: string } // if projectId is present, we return to project view
    | { type: 'recorder', returnToEditor?: boolean }
    | { type: 'project', projectId: string };

export default function App() {
    const [currentView, setCurrentView] = useState<ViewState>({ type: 'dashboard' });
    const [tempCapturedImages, setTempCapturedImages] = useState<string[]>([]);

    // --- Navigation Handlers ---

    const navigateToDashboard = () => setCurrentView({ type: 'dashboard' });

    const navigateToNewGuide = () => setCurrentView({ type: 'editor' });

    const navigateToEditGuide = (id: string) => setCurrentView({ type: 'editor', guideId: id });

    const navigateToProject = (id: string) => setCurrentView({ type: 'project', projectId: id });

    // --- Action Handlers ---

    const handleCreateProject = () => {
        const title = prompt("Enter project title:");
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
    };

    const handleRecorderFinish = (images: string[]) => {
        // If we came from dashboard (Record Flow button), create a new guide with these images
        // If we came from editor (Record button inside), append to that guide (not implemented fully in this simple flow, assuming new guide for simplicity or we can pass images back)
        
        // Simpler flow: Record Flow always creates a NEW guide for now
        const newGuide: Guide = {
            id: Date.now().toString(),
            metadata: {
                title: 'Recorded Flow ' + new Date().toLocaleTimeString(),
                author: 'User',
                date: new Date().toLocaleDateString()
            },
            steps: images.map((img, idx) => ({
                id: Date.now().toString() + idx,
                image: img,
                title: `Step ${idx + 1}`,
                description: 'Recorded step.',
                annotations: [],
                isProcessing: false
            })),
            lastModified: Date.now()
        };
        saveGuide(newGuide);
        navigateToEditGuide(newGuide.id);
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
                onRecordFlow={() => setCurrentView({ type: 'recorder' })}
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

    if (currentView.type === 'recorder') {
        return (
            <WebRecorder 
                onFinish={handleRecorderFinish}
                onCancel={navigateToDashboard}
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
                    onRecordRequest={() => setCurrentView({ type: 'recorder', returnToEditor: true })}
                />
            </React.Fragment>
        );
    }

    return null;
}