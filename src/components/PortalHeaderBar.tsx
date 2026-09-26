import React from 'react';
import { UserRole } from '../types.ts';
import { GraduationCap, Shield } from 'lucide-react';

interface PortalHeaderBarProps {
  currentPortal: UserRole;
}

export const PortalHeaderBar: React.FC<PortalHeaderBarProps> = ({
  currentPortal,
}) => {
  const isStudent = currentPortal === 'student';

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 text-xs py-2 px-3 sm:px-6 select-none transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Left: System Status */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Sistem Bersepadu ASASIpintar</span>
          </div>

          <div className="text-[11px] text-slate-300 hidden sm:inline">
            Pusat PERMATApintar™ Negara • Universiti Kebangsaan Malaysia
          </div>
        </div>

        {/* Right: Active Portal Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold shadow-xs ${
              isStudent
                ? 'bg-blue-600/90 text-white border border-blue-400/40'
                : 'bg-emerald-600/90 text-white border border-emerald-400/40'
            }`}
          >
            {isStudent ? (
              <>
                <GraduationCap className="w-4 h-4 text-blue-200" />
                <span>Portal Pelajar</span>
                <span className="text-[10px] bg-blue-700/80 px-1.5 py-0.5 rounded font-mono">
                  /student
                </span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-emerald-200" />
                <span>Portal Pensyarah</span>
                <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.5 rounded font-mono">
                  /lecturer
                </span>
              </>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-medium hidden md:inline">
            (Penyatuan Dataraya Segera • Live Synced)
          </span>
        </div>
      </div>
    </div>
  );
};
