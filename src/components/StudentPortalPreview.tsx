import React, { useState, useMemo } from 'react';
import { BookOpen, Video, Award, FileText, Megaphone, Play, Search, Download, ExternalLink, X, Check, HelpCircle, GraduationCap } from 'lucide-react';
import { ThiruData, Video as VideoType, Exam, StudyMaterial, Course, AppUser } from '../types';

interface StudentPortalPreviewProps {
  data: ThiruData;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  currentUserProfile?: AppUser;
}

// Simple YouTube ID extraction helper
function getYouTubeID(url: string): string {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
}

export default function StudentPortalPreview({ data, showToast, currentUserProfile }: StudentPortalPreviewProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [subTab, setSubTab] = useState<'videos' | 'exams' | 'materials'>('videos');
  const [searchQuery, setSearchQuery] = useState('');

  // Active student player
  const [activeVideo, setActiveVideo] = useState<VideoType | null>(null);

  // Active student exam taking simulator
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [examIndex, setExamIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);

  // Filters - Restrict students to their enrolled courses
  const coursesList = useMemo(() => {
    const activeCourses = data.courses.filter(c => c.status === 'Active');
    if (currentUserProfile && currentUserProfile.role === 'student') {
      return activeCourses.filter(c => currentUserProfile.enrolledCourses?.includes(c.id));
    }
    return activeCourses;
  }, [data.courses, currentUserProfile]);

  const filteredVideos = useMemo(() => {
    return data.videos.filter(v => {
      if (v.status !== 'Published') return false;
      const matchesCourse = selectedCourse === 'all' || v.courseId === selectedCourse;
      const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            v.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCourse && matchesSearch;
    });
  }, [data.videos, selectedCourse, searchQuery]);

  const filteredExams = useMemo(() => {
    return data.exams.filter(ex => {
      if (ex.status !== 'Published') return false;
      const matchesCourse = selectedCourse === 'all' || ex.courseId === selectedCourse;
      const matchesSearch = ex.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            ex.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCourse && matchesSearch;
    });
  }, [data.exams, selectedCourse, searchQuery]);

  const filteredMaterials = useMemo(() => {
    return data.materials.filter(mat => {
      if (mat.status !== 'Published') return false;
      const matchesCourse = selectedCourse === 'all' || mat.courseId === selectedCourse;
      const matchesSearch = mat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            mat.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCourse && matchesSearch;
    });
  }, [data.materials, selectedCourse, searchQuery]);

  // Handle Exam Launch
  const launchExam = (ex: Exam) => {
    if (!ex.questions || ex.questions.length === 0) {
      showToast('This exam does not have any questions yet.', 'info');
      return;
    }
    setActiveExam(ex);
    setExamIndex(0);
    setStudentAnswers({});
    setExamSubmitted(false);
  };

  const calculateExamResults = () => {
    if (!activeExam) return { marks: 0, correct: 0, wrong: 0 };
    let correct = 0;
    let wrong = 0;
    activeExam.questions.forEach(q => {
      const ans = studentAnswers[q.id];
      if (ans) {
        if (ans === q.correctOption) correct++;
        else wrong++;
      }
    });
    const perQuestionMarks = activeExam.totalMarks / activeExam.questions.length;
    const penalty = activeExam.negativeMarking * perQuestionMarks;
    const finalMarks = (correct * perQuestionMarks) - (wrong * penalty);
    return {
      marks: Math.max(0, Number(finalMarks.toFixed(2))),
      correct,
      wrong
    };
  };

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* Simulation Info Bar */}
      <div className="bg-blue-600 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/20 rounded-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-blue-200 uppercase">Live Preview Simulator</span>
            <h3 className="text-sm font-extrabold text-white">Student Portal Dashboard</h3>
          </div>
        </div>
        <p className="text-[11px] text-blue-100 max-w-sm sm:text-right leading-snug">
          Testing sandbox showing how students interact with uploaded classes, mock exams and download materials on their devices.
        </p>
      </div>

      {/* Marquee alerts */}
      <div className="bg-slate-900 text-white py-2 px-4 rounded-lg flex items-center gap-3 overflow-hidden">
        <span className="bg-red-600 text-white font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide shrink-0">
          Latest Ticker
        </span>
        <div className="relative flex-1 overflow-hidden h-4">
          <div className="absolute whitespace-nowrap animate-marquee flex items-center gap-6 font-semibold text-[11px] text-slate-300">
            {data.announcements.map((ann, idx) => (
              <span key={ann.id}>
                📢 {ann.title} — {ann.content.slice(0, 80)}...
                {idx !== data.announcements.length - 1 && <span className="mx-4 text-slate-700">|</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* If Student has no courses */}
      {currentUserProfile?.role === 'student' && coursesList.length === 0 && (
        <div className="bg-amber-950/20 border border-amber-800/60 p-5 rounded-xl flex items-start gap-3.5">
          <GraduationCap className="w-6 h-6 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-200">No Enrolled Batches Active</h4>
            <p className="text-xs text-slate-400">
              Welcome to Thiru Study Circle! Your registration is approved, but the administrator has not enrolled you into any study batches/courses yet.
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Please contact the support team or your instructor to assign you to your specific batch and unlock your class study material.
            </p>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Course Filters List (1 Column) */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs">My Enrolled Courses</h4>
            
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCourse('all')}
                className={`w-full p-2.5 rounded-lg text-left font-semibold transition-all flex items-center justify-between ${
                  selectedCourse === 'all' 
                    ? 'bg-blue-50 text-blue-800 font-bold' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Coaching Content</span>
                <span className="text-[10px] font-mono opacity-60">
                  {data.videos.length + data.exams.length} items
                </span>
              </button>

              {coursesList.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourse(c.id)}
                  className={`w-full p-2.5 rounded-lg text-left font-semibold transition-all flex flex-col text-slate-700 ${
                    selectedCourse === c.id 
                      ? 'bg-blue-50 text-blue-900 border-l-2 border-blue-600 pl-2' 
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold line-clamp-1">{c.name.split(' - ')[0]}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-mono">{c.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sticky Notice Board Widget */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-blue-600" />
              Notice Board
            </h4>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {data.announcements.map(ann => (
                <div key={ann.id} className={`p-2.5 rounded border text-[11px] ${
                  ann.isPinned ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex items-center justify-between mb-1 text-[9px] text-slate-400">
                    <span className="font-bold text-slate-500 uppercase">{ann.type}</span>
                    <span>{ann.createdAt}</span>
                  </div>
                  <h5 className="font-bold text-slate-800 line-clamp-1">{ann.title}</h5>
                  <p className="text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Viewer (3 Columns) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Main SubTabs */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg self-start">
              <button
                onClick={() => setSubTab('videos')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'videos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Video Classes ({filteredVideos.length})
              </button>
              <button
                onClick={() => setSubTab('exams')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'exams' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Practice Exams ({filteredExams.length})
              </button>
              <button
                onClick={() => setSubTab('materials')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 cursor-pointer ${
                  subTab === 'materials' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                PDF Study Materials ({filteredMaterials.length})
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject/topic..."
                className="pl-8 pr-3 py-1 border border-slate-200 rounded-lg text-xs outline-none w-full sm:w-44 focus:w-56 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* SubTab Panel rendering */}
          <div className="space-y-3">
            {/* 1. Videos Tab */}
            {subTab === 'videos' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredVideos.length === 0 ? (
                  <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    No video classes active for selection.
                  </div>
                ) : (
                  filteredVideos.map(vid => (
                    <div key={vid.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-blue-400 transition-colors">
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold text-slate-600">{vid.subject}</span>
                          <span>{vid.duration}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 leading-snug line-clamp-2">{vid.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{vid.description}</p>
                      </div>

                      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Faculty: <strong className="text-slate-700">{vid.faculty}</strong></span>
                        <button
                          onClick={() => {
                            if (vid.access === 'Premium') {
                              showToast(`"${vid.title}" is premium. Authenticated preview granted.`, 'info');
                            }
                            setActiveVideo(vid);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Watch Lecture
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. Exams Tab */}
            {subTab === 'exams' && (
              <div className="space-y-2">
                {filteredExams.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    No active published practice tests.
                  </div>
                ) : (
                  filteredExams.map(ex => (
                    <div key={ex.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">{ex.subject}</span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{ex.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5">
                          <span>Questions: <strong>{ex.questions?.length || 0} MCQs</strong></span>
                          <span>Time: <strong>{ex.duration} Mins</strong></span>
                          <span>Marks: <strong>{ex.totalMarks}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => launchExam(ex)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold cursor-pointer shadow-sm transition-colors self-start sm:self-center"
                      >
                        Start Exam Paper
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. Study Materials Tab */}
            {subTab === 'materials' && (
              <div className="space-y-2">
                {filteredMaterials.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    No study notes published.
                  </div>
                ) : (
                  filteredMaterials.map(mat => (
                    <div key={mat.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{mat.subject}</span>
                          <h4 className="font-bold text-slate-800 line-clamp-1">{mat.title}</h4>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{mat.fileSize} · {mat.fileType}</span>
                        </div>
                      </div>

                      <a
                        href={mat.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold"
                      >
                        Download notes
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-black text-white w-full max-w-2xl rounded-xl overflow-hidden border border-slate-800">
            <div className="px-4 py-3 bg-slate-950 flex items-center justify-between border-b border-slate-850">
              <div>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{activeVideo.subject}</span>
                <h4 className="text-xs font-bold text-white leading-tight">{activeVideo.title}</h4>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-black">
              {getYouTubeID(activeVideo.url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeID(activeVideo.url)}?autoplay=1`}
                  title="YouTube video player"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  Video Stream URL unavailable
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-850">
              <p className="text-xs text-slate-300 leading-relaxed">{activeVideo.description}</p>
              <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-3 font-mono">
                <span>Faculty: {activeVideo.faculty}</span>
                <span>Duration: {activeVideo.duration}</span>
                <span>Access: {activeVideo.access} Demo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen CBT Exam Sandbox Simulator */}
      {activeExam && (
        <div className="fixed inset-0 bg-slate-950 text-white z-50 flex flex-col justify-between">
          {/* Top Bar */}
          <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{activeExam.subject}</span>
              <h3 className="text-sm font-extrabold text-white">{activeExam.title}</h3>
            </div>
            
            <button
              onClick={() => setActiveExam(null)}
              className="px-3 py-1 bg-slate-800 hover:bg-red-900 hover:text-white text-slate-300 rounded text-xs transition-colors cursor-pointer"
            >
              Exit Exam
            </button>
          </div>

          {!examSubmitted ? (
            <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-6">
              {activeExam.questions[examIndex] && (
                (() => {
                  const q = activeExam.questions[examIndex];
                  const chosenOption = studentAnswers[q.id];
                  
                  return (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Question <strong>{examIndex + 1}</strong> of <strong>{activeExam.questions.length}</strong></span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded font-mono">Exam active</span>
                      </div>

                      <p className="text-sm font-semibold text-slate-100 leading-relaxed bg-slate-900 p-4 rounded-xl border border-slate-800">
                        {q.questionText}
                      </p>

                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(q.options).map(([key, val]) => (
                          <button
                            key={key}
                            onClick={() => setStudentAnswers({ ...studentAnswers, [q.id]: key })}
                            className={`p-3 rounded-lg border text-xs text-left flex items-center gap-3 transition-colors cursor-pointer ${
                              chosenOption === key
                                ? 'bg-blue-900/30 border-blue-500 text-blue-200 font-semibold'
                                : 'bg-slate-900/55 border-slate-800 hover:bg-slate-900 text-slate-300'
                            }`}
                          >
                            <span className={`uppercase font-mono font-bold w-5 h-5 rounded flex items-center justify-center text-[11px] ${
                              chosenOption === key ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {key}
                            </span>
                            <span>{val}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Navigation Grid panel */}
              <div className="pt-6 border-t border-slate-850">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-2">Question Navigation Palette</span>
                <div className="flex flex-wrap gap-2">
                  {activeExam.questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setExamIndex(idx)}
                      className={`w-8 h-8 rounded text-xs font-bold font-mono transition-colors cursor-pointer ${
                        examIndex === idx 
                          ? 'bg-blue-600 text-white ring-2 ring-blue-500/50' 
                          : studentAnswers[activeExam.questions[idx].id] 
                          ? 'bg-emerald-900 text-emerald-200 border border-emerald-700' 
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            (() => {
              const results = calculateExamResults();
              return (
                <div className="flex-1 overflow-y-auto p-6 max-w-xl mx-auto w-full text-center space-y-6 flex flex-col justify-center">
                  <div className="space-y-1">
                    <span className="text-4xl">🎓</span>
                    <h4 className="text-lg font-extrabold text-emerald-400 mt-2">Practice Exam Completed</h4>
                    <p className="text-xs text-slate-400">Scorecard evaluation completed instantly under study circle rules.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-900 rounded-lg">
                      <span className="text-xl font-bold block text-white">{results.marks} / {activeExam.totalMarks}</span>
                      <span className="text-[10px] text-slate-400">Your Marks</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg">
                      <span className="text-xl font-bold block text-emerald-400">{results.correct}</span>
                      <span className="text-[10px] text-emerald-500">Correct answers</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg">
                      <span className="text-xl font-bold block text-red-400">{results.wrong}</span>
                      <span className="text-[10px] text-red-500">Wrong (Penalized)</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-left max-h-[220px] overflow-y-auto space-y-3">
                    <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Detailed review and solutions:</h5>
                    {activeExam.questions.map((q, idx) => {
                      const correct = studentAnswers[q.id] === q.correctOption;
                      return (
                        <div key={idx} className="border-b border-slate-800 pb-2 text-[11px] last:border-none last:pb-0">
                          <p className="font-semibold text-slate-200">Q{idx + 1}. {q.questionText}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-400">Chosen: <strong className={correct ? 'text-emerald-400' : 'text-red-400'}>{studentAnswers[q.id]?.toUpperCase() || 'Skipped'}</strong></span>
                            <span>·</span>
                            <span className="text-slate-400">Correct: <strong className="text-emerald-400">{q.correctOption.toUpperCase()}</strong></span>
                          </div>
                          {q.explanation && (
                            <p className="text-[10px] text-slate-500 mt-1 italic">Solution: {q.explanation}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => { setStudentAnswers({}); setExamSubmitted(false); setExamIndex(0); }}
                      className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 rounded text-xs font-semibold cursor-pointer"
                    >
                      Retake Exam
                    </button>
                    <button
                      onClick={() => setActiveExam(null)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      Finish Sandbox View
                    </button>
                  </div>
                </div>
              );
            })()
          )}

          {/* Bottom navigation panel during test */}
          {!examSubmitted && (
            <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  disabled={examIndex === 0}
                  onClick={() => setExamIndex(examIndex - 1)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                >
                  Previous Q
                </button>
                <button
                  disabled={examIndex === activeExam.questions.length - 1}
                  onClick={() => setExamIndex(examIndex + 1)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                >
                  Next Q
                </button>
              </div>

              <button
                onClick={() => setExamSubmitted(true)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer transition-colors"
              >
                Submit Exam Paper
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
