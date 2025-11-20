import React from 'react';
import KanbanBoard from '../features/kanban/components/KanbanBoard';
import AudioRecorder from '../features/audio/components/AudioRecorder';
import TaskModal from '../features/kanban/components/TaskModal';
import useAuthStore from '../store/authStore';
// 1. Importar el UI Store
import { useUIStore } from '../store/uiStore'; 
import { supabase } from '../services/supabase';
import { LogOut, Sun, Moon } from 'lucide-react';

const Dashboard: React.FC = () => {
    const session = useAuthStore((state) => state.session);
    
    // 2. Usar la función toggleTheme del store
    const { toggleTheme } = useUIStore();

    return (
        // Cambiamos bg-gray-950 por bg-transparent o clases dinámicas
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            {/* Header */}
            <header className="flex-shrink-0 bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-500 tracking-wider">DUSOLAI</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600 dark:text-gray-400 text-sm hidden md:block">
                                {session?.user?.email}
                            </span>
                            {/* 3. Conectar el evento onClick */}
                            <button 
                                onClick={toggleTheme} 
                                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                {/* Estos iconos ya se muestran/ocultan solos gracias a la clase 'dark' en el HTML */}
                                <Sun className="h-5 w-5 hidden dark:block" />
                                <Moon className="h-5 w-5 dark:hidden" />
                            </button>
                            <button
                                onClick={() => supabase.auth.signOut()}
                                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-all"
                                aria-label="Sign out"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-950/50 transition-colors duration-300">
                <KanbanBoard />
            </main>
            
            <TaskModal />

            {/* Footer */}
            <footer className="flex-shrink-0 p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-10 transition-colors duration-300">
                <AudioRecorder />
            </footer>
        </div>
    );
};

export default Dashboard;
