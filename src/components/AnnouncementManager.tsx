import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, Edit2, X, AlertTriangle } from 'lucide-react';
import { ThiruData, Announcement } from '../types';
import { deleteAnnouncementFromFirebase } from '../utils/firebase';

interface AnnouncementManagerProps {
  data: ThiruData;
  onUpdate: (updatedAnnouncements: Announcement[]) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function AnnouncementManager({ data, onUpdate, showToast }: AnnouncementManagerProps) {
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [annToDelete, setAnnToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'Alert' | 'News' | 'Exam' | 'General'>('General');
  const [isPinned, setIsPinned] = useState(false);

  const handleOpenAdd = () => {
    setEditingAnn(null);
    setTitle('');
    setContent('');
    setType('General');
    setIsPinned(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingAnn(ann);
    setTitle(ann.title);
    setContent(ann.content);
    setType(ann.type);
    setIsPinned(ann.isPinned);
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return showToast('Please supply both Title and Alert Notice!', 'error');

    const annData: Announcement = {
      id: editingAnn ? editingAnn.id : `ann-${Date.now()}`,
      title,
      content,
      type,
      isPinned,
      createdAt: editingAnn ? editingAnn.createdAt : new Date().toISOString().split('T')[0]
    };

    let nextAnn = [...data.announcements];
    if (editingAnn) {
      nextAnn = nextAnn.map(a => a.id === editingAnn.id ? annData : a);
      showToast(`Updated announcement: "${title}"`, 'success');
    } else {
      nextAnn.unshift(annData);
      showToast(`Posted new notification: "${title}"`, 'success');
    }

    onUpdate(nextAnn);
    setIsOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!annToDelete) return;
    const { id, title } = annToDelete;
    setIsDeleting(true);
    try {
      await deleteAnnouncementFromFirebase(id);
      showToast(`Deleted notice "${title}"`, 'success');
      setAnnToDelete(null);
    } catch (err: any) {
      console.error("FIRESTORE DELETE ERROR:", err);
      let errorMsg = err.message || err;
      if (err.code === 'permission-denied') {
        errorMsg = "Permission Denied: Check your Firestore Security Rules.";
      }
      showToast(`Failed to delete notice: ${errorMsg}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sticky Notice Board & Flash Alerts</h2>
          <p className="text-xs text-slate-500 mt-0.5">Post instant scrolling ticker alerts, admit card reminders, or holiday updates for aspirants.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm hover:shadow-blue-500/10 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          Publish Alert Notice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.announcements.map(ann => (
          <div 
            key={ann.id} 
            className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 transition-all ${
              ann.isPinned 
                ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/10' 
                : 'bg-white border-slate-200 hover:shadow-sm'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                  ann.type === 'Exam' ? 'bg-red-100 text-red-800' :
                  ann.type === 'Alert' ? 'bg-amber-100 text-amber-800' :
                  ann.type === 'News' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {ann.type}
                </span>
                
                <span className="text-[10px] text-slate-400">{ann.createdAt}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {ann.isPinned && <span className="mr-1">📌</span>}
                  {ann.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed break-words">{ann.content}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                {ann.isPinned ? 'Sticky Top Priority' : 'Normal Feed'}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(ann)}
                  className="p-1 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-blue-600 rounded cursor-pointer"
                  title="Edit notice"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setAnnToDelete({ id: ann.id, title: ann.title })}
                  className="p-1 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-red-600 rounded cursor-pointer"
                  title="Delete notice"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-extrabold">{editingAnn ? 'Configure Notice' : 'Post New Notice'}</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Notice Header Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🚨 APPSC Hall Tickets Release Notification"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Category Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  >
                    <option value="General">General News</option>
                    <option value="Exam">Exam Alert</option>
                    <option value="Alert">Urgent Notice</option>
                    <option value="News">Batch Announcements</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Pin Settings</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="isPinned"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="isPinned" className="text-slate-700 cursor-pointer select-none">
                      Pin to top of feed
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Announcement Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write full announcements details including links or dates for classroom reference..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold cursor-pointer"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-Page Confirmation Modal for Delete (Works in Iframe / Sandbox) */}
      {annToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Announcement?</h3>
                <p className="text-xs text-slate-500 mt-0.5">This will permanently remove the notice from Firestore.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <p className="font-semibold text-slate-800 line-clamp-2">"{annToDelete.title}"</p>
              <p className="font-mono text-[10px] text-slate-400 mt-1">ID: {annToDelete.id}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setAnnToDelete(null)}
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
