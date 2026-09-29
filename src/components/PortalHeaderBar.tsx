import React from 'react';
import { UserRole } from '../types.ts';
import { GraduationCap, Shield } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.tsx';

interface PortalHeaderBarProps {
  currentPortal: UserRole;
}

export const PortalHeaderBar: React.FC<PortalHeaderBarProps> = ({
  currentPortal,
}) => {
  const { lang, dict } = useLanguage();
  const isStudent = currentPortal === 'student';

  const labels = {
    ms: {
      subtitle: 'Pusat PERMATA@PINTAR Negara • Universiti Kebangsaan Malaysia',
      studentPortal: 'Portal Pelajar',
      lecturerPortal: 'Portal Pensyarah',
    },
    en: {
      subtitle: 'National PERMATA@PINTAR Centre • Universiti Kebangsaan Malaysia',
      studentPortal: 'Student Portal',
      lecturerPortal: 'Lecturer Portal',
    },
    zh: {
      subtitle: '国家 PERMATA@PINTAR 中心 • 马来西亚国立大学 (UKM)',
      studentPortal: '学生专属门户',
      lecturerPortal: '讲师专属门户',
    },
    ta: {
      subtitle: 'தேசிய PERMATA@PINTAR மையம் • மலேசிய தேசிய பல்கலைக்கழகம் (UKM)',
      studentPortal: 'மாணவர் போர்டல்',
      lecturerPortal: 'விரிவுரையாளர் போர்டல்',
    },
  }[lang] || {
    subtitle: dict.brandSubtitle,
    studentPortal: dict.studentPortal,
    lecturerPortal: dict.lecturerPortal,
  };

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 text-xs py-2 px-3 sm:px-6 select-none transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Left: Institution / Centre Subtitle */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
          <div className="text-[11px] text-slate-300 font-medium">
            {labels.subtitle}
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
                <span>{labels.studentPortal}</span>
                <span className="text-[10px] bg-blue-700/80 px-1.5 py-0.5 rounded font-mono">
                  /student
                </span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-emerald-200" />
                <span>{labels.lecturerPortal}</span>
                <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.5 rounded font-mono">
                  /lecturer
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
