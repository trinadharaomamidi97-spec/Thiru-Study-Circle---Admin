import React, { useState, useMemo } from 'react';
import { Video, Plus, Trash2, Edit2, Play, Search, Filter, X, Check, HelpCircle, AlertCircle } from 'lucide-react';
import { ThiruData, Video as VideoType, Course } from '../types';
import { deleteVideoFromFirebase } from '../utils/firebase';

const PRESET_SUBJECTS = [
  'dsc sgt - Telugu - class details',
  'dsc sgt - Telugu',
  'dsc sgt - English',
  'dsc sgt - Mathematics',
  'dsc sgt - Science',
  'dsc sgt - Social Studies',
  'dsc sgt - Methodology',
  'dsc sgt - Psychology',
  'General Studies',
  'Current Affairs',
  'Arithmetic & Reasoning',
  'Indian Polity',
  'Indian History',
  'Geography'
];

interface VideoManagerProps {
  data: ThiruData;
  onUpdate: (updatedVideos: VideoType[]) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

// Simple YouTube URL parser to extract ID
function getYouTubeID(url: string): string {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
}

export default function VideoManager({ data, onUpdate, showToast }: VideoManagerProps) {
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formFaculty, setFormFaculty] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'Published' | 'Draft'>('Published');
  const [formAccess, setFormAccess] = useState<'Free' | 'Premium'>('Free');

  const subjects = useMemo(() => {
    const list = new Set(data.videos.map(v => v.subject));
    return Array.from(list);
  }, [data.videos]);

  const filteredVideos = useMemo(() => {
    return data.videos.filter(vid => {
      const matchesSearch = vid.title.toLowerCase().includes(search.toLowerCase()) ||
                            vid.faculty.toLowerCase().includes(search.toLowerCase()) ||
                            vid.description.toLowerCase().includes(search.toLowerCase());
      const matchesCourse = selectedCourse === 'all' || vid.courseId === selectedCourse;
      const matchesSubject = selectedSubject === 'all' || vid.subject === selectedSubject;
      return matchesSearch && matchesCourse && matchesSubject;
    });
  }, [data.videos, search, selectedCourse, selectedSubject]);

  const handleOpenAddForm = () => {
    setEditingVideo(null);
    setFormTitle('');
    setFormSubject(subjects[0] || 'General Studies');
    setFormCourseId(data.courses[0]?.id || '');
    setFormUrl('https://www.youtube.com/watch?v=Xz963x4P2xM');
    setFormDuration('45 mins');
    setFormFaculty('Thiru Sir');
    setFormDescription('');
    setFormStatus('Published');
    setFormAccess('Free');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (vid: VideoType) => {
    setEditingVideo(vid);
    setFormTitle(vid.title);
    setFormSubject(vid.subject);
    setFormCourseId(vid.courseId);
    setFormUrl(vid.url);
    setFormDuration(vid.duration);
    setFormFaculty(vid.faculty);
    setFormDescription(vid.description);
    setFormStatus(vid.status);
    setFormAccess(vid.access);
    setIsFormOpen(true);
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Title is required!', 'error');
      return;
    }
    if (!formUrl.trim()) {
      showToast('Video Link / YouTube URL is required!', 'error');
      return;
    }

    const videoData: VideoType = {
      id: editingVideo ? editingVideo.id : `vid-${Date.now()}`,
      title: formTitle,
      subject: formSubject,
      courseId: formCourseId,
      url: formUrl,
      duration: formDuration || '30 mins',
      faculty: formFaculty || 'Thiru Sir',
      description: formDescription,
      status: formStatus,
      access: formAccess,
      createdAt: editingVideo ? editingVideo.createdAt : new Date().toISOString().split('T')[0]
    };

    let nextVideos = [...data.videos];
    if (editingVideo) {
      nextVideos = nextVideos.map(v => v.id === editingVideo.id ? videoData : v);
      showToast(`Updated video: "${formTitle}"`, 'success');
    } else {
      nextVideos.unshift(videoData);
      showToast(`Added new video: "${formTitle}"`, 'success');
    }

    onUpdate(nextVideos);
    setIsFormOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!videoToDelete) return;
    const { id, title } = videoToDelete;
    setIsDeleting(true);

    console.log("=== EXECUTING DELETEDOC IN FIRESTORE ===");
    console.log("1. Video Title:", title);
    console.log("2. Deleting Document ID:", id);
    console.log("3. Target Path: videos/" + id);

    try {
      await deleteVideoFromFirebase(id);
      console.log("=== DELETEDOC CALL COMPLETED SUCCESSFULLY ===");
      showToast(`Deleted video "${title}"`, 'success');
      if (previewVideoId === id) setPreviewVideoId(null);
      setVideoToDelete(null);
    } catch (err: any) {
      console.error("FIRESTORE ERROR ENCOUNTERED:", err);
      let errorMsg = err.message || err;
      if (err.code === 'permission-denied') {
        errorMsg = "Permission Denied: Check your Firestore Security Rules.";
      }
      showToast(`Failed to delete video: ${errorMsg}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Coaching Class Videos</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage study circle playlists, edit class durations, and assign faculties.</p>
        </div>
        
        <button
          onClick={handleOpenAddForm}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm hover:shadow-blue-500/10 transition-all self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Add Video Lecture
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by lecture title, faculty name, keywords..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Course Filter */}
        <div className="flex items-center gap-1.5 min-w-[180px]">
          <span className="text-xs text-slate-400 whitespace-nowrap">Batch:</span>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">All Batches</option>
            {data.courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.name.split(' - ')[0]}</option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-1.5 min-w-[180px]">
          <span className="text-xs text-slate-400 whitespace-nowrap">Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">All Subjects</option>
            {subjects.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Core Split Screen: List vs Video Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredVideos.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
              <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No lectures found</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting filters or add a new video class lecture.</p>
            </div>
          ) : (
            filteredVideos.map((vid) => {
              const course = data.courses.find(c => c.id === vid.courseId);
              const ytId = getYouTubeID(vid.url);
              
              return (
                <div 
                  key={vid.id}
                  className={`bg-white p-4 rounded-xl border transition-all ${
                    previewVideoId === vid.id 
                      ? 'border-blue-500 ring-1 ring-blue-500/25 bg-blue-50/10' 
                      : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      {/* Meta stats */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{vid.subject}</span>
                        <span>·</span>
                        <span className="text-slate-500">{course?.code || 'GS'}</span>
                        <span>·</span>
                        <span>Faculty: <strong className="text-slate-700">{vid.faculty}</strong></span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {vid.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {vid.description}
                      </p>

                      {/* Info badges */}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          ⏱ {vid.duration}
                        </span>

                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          vid.status === 'Published' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 bg-slate-100'
                        }`}>
                          {vid.status}
                        </span>
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="flex flex-col items-end justify-between self-stretch gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditForm(vid)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setVideoToDelete({ id: vid.id, title: vid.title })}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {ytId ? (
                        <button
                          onClick={() => setPreviewVideoId(vid.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded text-[11px] font-semibold tracking-wide transition-all shadow-sm cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Test Stream
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No embed code</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Video Player Tester Panel */}
        <div className="bg-slate-900 text-slate-100 p-5 rounded-xl flex flex-col justify-between min-h-[300px] border border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                Live Feed Tester
              </h3>
              {previewVideoId && (
                <button 
                  onClick={() => setPreviewVideoId(null)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            {previewVideoId ? (
              (() => {
                const activePreview = data.videos.find(v => v.id === previewVideoId);
                const ytId = activePreview ? getYouTubeID(activePreview.url) : '';
                
                if (!activePreview || !ytId) {
                  return <p className="text-xs text-slate-400">Invalid YouTube Link format</p>;
                }

                return (
                  <div className="space-y-4">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 relative">
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                        title="Thiru Class Video Player"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{activePreview.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Faculty: {activePreview.faculty} · Subject: {activePreview.subject}</p>
                      <div className="mt-2 text-[10px] text-slate-500 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-850">
                        <strong>Source:</strong> <span className="font-mono text-[9px] break-all text-slate-400">{activePreview.url}</span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-2">
                <Video className="w-10 h-10 text-slate-700 stroke-1" />
                <p className="text-xs font-semibold text-slate-400">No video selected for testing</p>
                <p className="text-[11px] text-slate-600 max-w-[200px]">Click the "Test Stream" button to preview YouTube classes inside this browser window.</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-3 mt-4 text-[10px] text-slate-500 leading-relaxed">
            💡 Streaming tests ensure that high-definition video paths load successfully for student Android, iOS & web portal applications.
          </div>
        </div>
      </div>

      {/* Slide-over Form Overlay Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingVideo ? 'Edit Lecture Details' : 'Add New Lecture'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Configure coaching video settings and publish.</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveVideo} className="space-y-4 text-xs">
                {/* Title */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Lecture Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AP History - Kakatiya Architecture & Sculptures"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Course (Batch) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Coaching Batch *</label>
                    <select
                      value={formCourseId}
                      onChange={(e) => setFormCourseId(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                    >
                      {data.courses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name.split(' - ')[0]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Input / Select */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block text-xs">Subject / Syllabus Topic *</label>
                    <select
                      value={PRESET_SUBJECTS.includes(formSubject) ? formSubject : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setFormSubject('');
                        } else {
                          setFormSubject(val);
                        }
                      }}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                    >
                      {PRESET_SUBJECTS.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                      <option value="custom">✍️ [Type Custom Subject...]</option>
                    </select>

                    {(!PRESET_SUBJECTS.includes(formSubject) || formSubject === '') && (
                      <input
                        type="text"
                        required
                        placeholder="Enter custom subject manually..."
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        className="w-full mt-1.5 p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>

                {/* YouTube Link / Video URL */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">YouTube Video URL / Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://www.youtube.com/watch?v=Xz963x4P2xM"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 italic">Provide standard browser YouTube watch links, share links or embed codes.</p>
                </div>

                {/* Faculty & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Faculty Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Thiru Sir"
                      value={formFaculty}
                      onChange={(e) => setFormFaculty(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Video Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 52 mins, 1 hr 15 mins"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Description & Chapter Chapters covered</label>
                  <textarea
                    rows={4}
                    placeholder="Enter what topics are taught in this lecture so students can search and read..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Status and Publish Option */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Publish Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setFormStatus('Published')}
                        className={`flex-1 py-2 text-center rounded-lg font-semibold transition-colors cursor-pointer ${
                          formStatus === 'Published' 
                            ? 'bg-blue-50 border border-blue-300 text-blue-800' 
                            : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Published
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormStatus('Draft')}
                        className={`flex-1 py-2 text-center rounded-lg font-semibold transition-colors cursor-pointer ${
                          formStatus === 'Draft' 
                            ? 'bg-slate-100 border border-slate-300 text-slate-800' 
                            : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Draft
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer font-bold"
                  >
                    {editingVideo ? 'Save Modifications' : 'Create Video Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* In-Page Confirmation Modal for Delete (Works in Iframe / Sandbox) */}
      {videoToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Video Lecture?</h3>
                <p className="text-xs text-slate-500 mt-0.5">This will permanently remove the video from Firestore.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <p className="font-semibold text-slate-800 line-clamp-2">"{videoToDelete.title}"</p>
              <p className="font-mono text-[10px] text-slate-400 mt-1">ID: {videoToDelete.id}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setVideoToDelete(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
