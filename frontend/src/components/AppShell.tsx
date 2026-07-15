'use client';

import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-screen h-screen flex overflow-hidden" style={{ background: '#0a0a0f' }}>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <TopBar />
                <main className="flex-1 overflow-y-auto p-4">
                    {children}
                </main>
            </div>
        </div>
    );
}
