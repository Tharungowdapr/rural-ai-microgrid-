import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Rural Microgrid - AI Energy Management',
    description: 'Real-time decentralized energy network monitoring and optimization',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="bg-deep-blue text-white font-inter overflow-hidden">
                {children}
            </body>
        </html>
    );
}
