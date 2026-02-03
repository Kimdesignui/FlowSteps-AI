
import React, { useState, useEffect } from 'react';
import GuideEditor from './components/GuideEditor';
import Dashboard from './components/Dashboard';
import ProjectView from './components/ProjectView';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import { Guide, Project } from './types';
import { saveGuide, getGuideById, saveProject, getProjectById } from './services/storageService';
import { getCurrentUser, logout, User } from './services/authService';

type ViewState = 
    | { type: 'dashboard' }
    | { type: 'editor', guideId?: string, projectId?: string } 
    | { type: 'project', projectId: string };

type Theme = 'light' | 'dark' | 'system';

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<ViewState>({ type: 'dashboard' });
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('df_theme') as Theme) || 'system';
    });

    useEffect(() => {
        // Check auth on load
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
    }, []);

    useEffect(() => {
        const applyTheme = () => {
            const root = document.documentElement;
            let targetTheme = theme;

            if (theme === 'system') {
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                targetTheme = systemDark ? 'dark' : 'light';
            }

            root.setAttribute('data-theme', targetTheme);
            if (targetTheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        applyTheme();
        localStorage.setItem('df_theme', theme);

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => applyTheme();
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [theme]);

    const handleLoginSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
        setCurrentView({ type: 'dashboard' }); // Reset view on login
    };

    const handleLogout = () => {
        logout();
        setUser(null);
    };

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
        setCurrentView({ type: 'editor', projectId });
    };

    const handleSaveGuide = (guide: Guide) => {
        saveGuide(guide);
        if (currentView.type === 'editor' && currentView.projectId) {
             const projectId = currentView.projectId;
             const project = getProjectById(projectId);
             if (project && !project.guideIds.includes(guide.id)) {
                 project.guideIds.push(guide.id);
                 project.lastModified = Date.now();
                 saveProject(project);
             }
        }
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

    // If no user, show Auth screen
    if (!user) {
        return (
            <div className="h-screen w-screen bg-base-200 overflow-hidden font-sans" data-theme={theme}>
                <Auth onLoginSuccess={handleLoginSuccess} />
            </div>
        );
    }

    // --- Main Layout ---
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-base-200 text-base-content font-sans transition-colors duration-200">
            {currentView.type !== 'editor' && (
                <Sidebar 
                    activeView={currentView.type} 
                    onNavigate={navigateToDashboard}
                    onCreateProject={handleCreateProject}
                    theme={theme}
                    onSetTheme={setTheme}
                    user={user}
                    onLogout={handleLogout}
                />
            )}

            <main className="flex-1 h-full overflow-auto relative">
                {currentView.type === 'dashboard' && (
                    <Dashboard 
                        key="dashboard" // Force re-render on login change/view change
                        onCreateGuide={navigateToNewGuide}
                        onCreateProject={handleCreateProject}
                        onEditGuide={navigateToEditGuide}
                        onViewProject={navigateToProject}
                    />
                )}

                {currentView.type === 'project' && (
                    <ProjectView 
                        key={`project-${currentView.projectId}`}
                        projectId={currentView.projectId}
                        onBack={navigateToDashboard}
                        onEditGuide={(guideId) => setCurrentView({ type: 'editor', guideId, projectId: currentView.projectId })}
                        onCreateGuideForProject={handleCreateGuideForProject}
                    />
                )}

                {currentView.type === 'editor' && (
                    <React.Fragment key={currentView.guideId || 'new'}>
                        <GuideEditor 
                            initialGuide={currentView.guideId ? getGuideById(currentView.guideId) || null : null}
                            onSave={handleSaveGuide}
                            onBack={handleBackFromEditor}
                        />
                    </React.Fragment>
                )}
            </main>
        </div>
    );
}
