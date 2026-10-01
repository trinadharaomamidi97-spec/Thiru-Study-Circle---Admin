import React, { useState } from 'react';
import { Video, BookOpen, FileText, Megaphone, Users, Award, RotateCcw } from 'lucide-react';
import { ThiruData } from '../types';

interface StatsDashboardProps {
  data: ThiruData;
  setActiveTab: (tab: string) => void;
  onReset: () => void;
  onExport: () => void;
  onImportClick: () => void;
}

export default function StatsDashboard({ data, setActiveTab, onReset, onExport, onImportClick }: StatsDashboardProps) {
  const [showResetModal, setShowResetModal] = useState(false);
  const totalCourses = data.courses.length;
  const totalVideos = data.videos.length;
  const totalExams = data.exams.length;
  const totalQuestions = data.exams.reduce((sum, exam) => sum + (exam.questions?.length || 0), 0);
  const totalMaterials = data.materials.length;
  const totalStudents = data.courses.reduce((sum, course) => sum + course.activeStudents, 0);

  const stats = [
    {
      label: 'Batches / Courses',
      value: totalCourses,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      tab: 'courses',
      desc: 'Active educational batches'
    },
    {
      label: 'Video Classes',
      value: totalVideos,
      icon: Video,
      color: 'text-emerald-600 bg-emerald-50',
      tab: 'videos',
      desc: 'Syllabus chapter videos'
    },
    {
      label: 'Online Exams',
      value: totalExams,
      icon: Award,
      color: 'text-amber-600 bg-amber-50',
      tab: 'exams',
      desc: `${totalQuestions} total practice questions`
    },
    {
      label: 'Study Materials',
      value: totalMaterials,
      icon: FileText,
      color: 'text-purple-600 bg-purple-50',
      tab: 'materials',
      desc: 'PDF Notes & syllabus books'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 right-1/3 w-32 h-32 bg-emerald-600/10 rounded-full blur-xl"></div>
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Control Center</span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Thiru Study Circle</h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Welcome to your Master Administrator Suite. Add class video lectures, create full-length multiple-choice practice exams, distribute hand-written preparation notes, and make real-time announcements for thousands of aspirants.
          </p>
          
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => setActiveTab('videos')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs md:text-sm rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer"
            >
              Manage Videos
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs md:text-sm rounded-lg transition-all cursor-pointer border border-slate-700"
            >
              Create Exam Paper
            </button>
          </div>
        </div>
      </div>

      {/* Numerical Stats Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Live Database Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={idx}
                onClick={() => setActiveTab(stat.tab)}
                className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-all hover:shadow-md cursor-pointer group flex items-start gap-4"
              >
                <div className={`p-3 rounded-lg shrink-0 ${stat.color} transition-transform group-hover:scale-105`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</span>
                  <p className="text-sm font-semibold text-slate-800">{stat.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Tools & Database Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Capacity and Batches */}
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Active Batches & Enrollments</h3>
            <button 
              onClick={() => setActiveTab('courses')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage All
            </button>
          </div>
          <div className="space-y-4">
            {data.courses.map(course => (
              <div key={course.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                      {course.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{course.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Fee: ₹{(Number(course?.fees) || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">{course.activeStudents}</span>
                  <p className="text-[10px] text-slate-500">Students</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Administration & JSON Sync */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Data Operations & Sync</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Export the current database state as a portable JSON file to back up your modifications. You can restore this data at any point, or reset back to default demo coaching classes.
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExport}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Backup Data (JSON)
              </button>
              <button
                onClick={onImportClick}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Restore Data (JSON)
              </button>
            </div>
            
            <button
              onClick={() => setShowResetModal(true)}
              className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200/50 text-red-700 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer"
            >
              Reset to Live Sample Data
            </button>
          </div>
        </div>
      </div>

      {/* Latest Announcements */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-slate-600" />
            <h3 className="text-base font-bold text-slate-900">Current Sticky Alerts & Notice Board</h3>
          </div>
          <button 
            onClick={() => setActiveTab('announcements')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Manage Notices
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.announcements.slice(0, 3).map(ann => (
            <div 
              key={ann.id} 
              className={`p-4 rounded-lg border flex flex-col justify-between ${
                ann.isPinned 
                  ? 'bg-amber-50/50 border-amber-200/80 text-amber-900' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    ann.type === 'Exam' ? 'bg-red-100 text-red-800' :
                    ann.type === 'Alert' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {ann.type}
                  </span>
                  <span className="text-[10px] text-slate-400">{ann.createdAt}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{ann.title}</h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">{ann.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* In-Page Confirmation Modal for Reset (Works in Iframe / Sandbox) */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reset Coaching Database?</h3>
                <p className="text-xs text-slate-500 mt-0.5">All data will be reset to default sample content.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              Any custom videos, exams, materials, and announcements you added will be removed unless you exported a backup JSON file first.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  onReset();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
