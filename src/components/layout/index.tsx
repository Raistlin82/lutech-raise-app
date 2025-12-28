import React, { useState } from 'react';
import { LayoutDashboard, FileText, Building2, Settings, Menu as MenuIcon, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { SkipLink } from '../common/SkipLink';
import lutechLogo from '/assets/lutech-logo.png';

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={clsx(
                    "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
                aria-hidden={!isOpen}
            />

            <nav
                className={clsx(
                    "w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col h-screen fixed left-0 top-0 z-40 shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
                aria-label="Navigazione principale"
            >
                <div className="p-6 border-b border-slate-800/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-glow-accent relative">
                                <span className="relative z-10">R</span>
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl blur opacity-50" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold tracking-tight">RAISE</span>
                                <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-widest">Compliance</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="md:hidden text-slate-400 hover:text-white transition-colors"
                            aria-label="Chiudi menu"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Lutech Logo & Author Credit */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/30">
                        <div className="flex items-center gap-2">
                            {/* Logo - fallback to text if image not available */}
                            <img
                                src={lutechLogo}
                                alt="Lutech"
                                className="h-5 object-contain"
                                onError={(e) => {
                                    // Fallback to text logo if image not found
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'block';
                                }}
                            />
                            <span className="text-white font-bold text-sm hidden" style={{display: 'none'}}>
                                Lutech
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                            by Gabriele Rendina
                        </span>
                    </div>
                </div>

                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" end onClick={onClose} />
                    <NavItem to="/opportunities" icon={<FileText size={20} />} label="Opportunities" onClick={onClose} />
                    <NavItem to="/customers" icon={<Building2 size={20} />} label="Customers" onClick={onClose} />
                    <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" onClick={onClose} />
                </div>

                <div className="p-5 border-t border-slate-800/50 bg-slate-950/50">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-widest">System Status</div>
                    <div className="flex items-center gap-2.5 text-emerald-400 text-sm font-semibold">
                        <div className="relative">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow" />
                            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-sm opacity-70" />
                        </div>
                        <span>Operational</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800/50">
                        <div className="text-[10px] text-slate-600 uppercase font-semibold tracking-wider mb-3">Version 1.1.0</div>

                        {/* Footer Logo & Copyright */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/30">
                            <div className="flex items-center gap-2">
                                <img
                                    src={lutechLogo}
                                    alt="Lutech"
                                    className="h-4 object-contain opacity-50"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'block';
                                    }}
                                />
                                <span className="text-slate-500 font-bold text-[10px] hidden" style={{display: 'none'}}>
                                    Lutech
                                </span>
                            </div>
                            <span className="text-[9px] text-slate-600 font-medium">
                                © {new Date().getFullYear()}
                            </span>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    to: string;
    badge?: string;
    end?: boolean;
    onClick: () => void;
}

const NavItem = ({ icon, label, to, badge, end, onClick }: NavItemProps) => (
    <NavLink
        to={to}
        end={end}
        onClick={onClick}
    >
        {({ isActive }) => (
            <div className={clsx(
                "flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-300 group relative overflow-hidden",
                isActive
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-900/40"
                    : "hover:bg-slate-800/70 text-slate-400 hover:text-white"
            )}>
                {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20 blur-xl" />
                )}
                <div className="flex items-center gap-3 relative z-10">
                    <div className={clsx(
                        "transition-transform duration-300",
                        isActive ? "scale-110" : "group-hover:scale-105"
                    )}>
                        {icon}
                    </div>
                    <span className="font-semibold">{label}</span>
                </div>
                {badge && (
                    <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs py-1 px-2.5 rounded-lg font-bold shadow-lg">
                        {badge}
                    </span>
                )}
            </div>
        )}
    </NavLink>
);

export const Header = ({ onOpenSidebar }: { onOpenSidebar: () => void }) => {
    return (
        <header className="h-16 md:pl-72 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 fixed w-full top-0 z-20 flex items-center justify-between px-4 md:px-8 transition-all duration-300 shadow-sm">
            <div className="flex items-center gap-4">
                <button
                    onClick={onOpenSidebar}
                    className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
                    aria-label="Apri menu"
                    aria-expanded={false}
                >
                    <MenuIcon size={24} />
                </button>
                <div className="flex items-center gap-2 text-sm hidden sm:flex">
                    <span className="px-2 py-1 bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 font-bold rounded-lg border border-cyan-200/50 text-xs">PSQ-003 v17</span>
                    <span className="text-slate-400">/</span>
                    <span className="font-semibold text-slate-700">RAISE Workflow Management</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications and user info removed as per requirements */}
            </div>
        </header>
    );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 font-sans selection:bg-cyan-100 selection:text-cyan-900 relative">
            {/* Skip link for keyboard users */}
            <SkipLink targetId="main-content" />

            {/* Subtle background pattern */}
            <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-mesh" aria-hidden="true" />

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Header onOpenSidebar={() => setIsSidebarOpen(true)} />
            <main
                id="main-content"
                className="md:pl-72 pt-20 min-h-screen transition-all duration-300 relative"
                tabIndex={-1}
            >
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
