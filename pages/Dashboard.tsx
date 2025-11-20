import React from 'react';
import KanbanBoard from '../features/kanban/components/KanbanBoard';
import AudioRecorder from '../features/audio/components/AudioRecorder';
// 1. Importamos el TaskModal
import TaskModal from '../features/kanban/components/TaskModal';
import useAuthStore from '../store/authStore';
import { supabase } from '../services/supabase';
import { LogOut, Sun, Moon } from 'lucide-react';

const Dashboard: React.FC = () => {
    const session = useAuthStore((state) => state.session);

    // Dummy theme toggle (simple)
    const toggleTheme = () => {
        document.documentElement.classList.toggle('dark');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-950">
            {/* Header */}
            <header className="flex-shrink-0 bg-gray-900 shadow-md border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-indigo-500 tracking-wider">DUSOLAI</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-400 text-sm hidden md:block">
                                {session?.user?.email}
                            </span>
                            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-400 hover:bg-gray-800 transition-colors">
                                <Sun className="h-5 w-5 hidden dark:block" />
                                <Moon className="h-5 w-5 dark:hidden" />
                            </button>
                            <button
                                onClick={() => supabase.auth.signOut()}
                                className="p-2 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                                aria-label="Sign out"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-950/50">
                <KanbanBoard />
            </main>
            
            {/* 2. Renderizamos el Modal aquí (es invisible por defecto hasta que haces clic en una tarea) */}
            <TaskModal />

            {/* Footer con el Grabador */}
            <footer className="flex-shrink-0 p-6 bg-gray-900 border-t border-gray-800 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-10">
                <AudioRecorder />
            </footer>
        </div>
    );
};

export default Dashboard;
