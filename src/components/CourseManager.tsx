import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, X } from 'lucide-react';
import { ThiruData, Course } from '../types';
import { deleteCourseFromFirebase } from '../utils/firebase';

interface CourseManagerProps {
  data: ThiruData;
  onUpdate: (updatedCourses: Course[]) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function CourseManager({ data, onUpdate, showToast }: CourseManagerProps) {
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [fees, setFees] = useState(10000);
  const [activeStudents, setActiveStudents] = useState(100);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setName('');
    setCode('GS-NEW-2026');
    setDescription('');
    setFees(10000);
    setActiveStudents(150);
    setStatus('Active');
    setIsOpen(true);
  };

  const handleOpenEdit = (c: Course) => {
    setEditingCourse(c);
    setName(c.name);
    setCode(c.code);
    setDescription(c.description);
    setFees(c.fees);
    setActiveStudents(c.activeStudents);
    setStatus(c.status);
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return showToast('Name and Batch Code are required!', 'error');

    const courseData: Course = {
      id: editingCourse ? editingCourse.id : `course-${Date.now()}`,
      name,
      code: code.toUpperCase(),
      description,
      fees: Number(fees),
      activeStudents: Number(activeStudents),
      status
    };

    let nextCourses = [...data.courses];
    if (editingCourse) {
      nextCourses = nextCourses.map(c => c.id === editingCourse.id ? courseData : c);
      showToast(`Updated Batch: "${name}"`, 'success');
    } else {
      nextCourses.push(courseData);
      showToast(`Created Batch: "${name}"`, 'success');
    }

    onUpdate(nextCourses);
    setIsOpen(false);
  };

  const handleDeleteClick = (id: string, name: string) => {
    // Check if courses are linked to existing videos/exams/materials
    const isLinked = data.videos.some(v => v.courseId === id) || 
                     data.exams.some(e => e.courseId === id) || 
                     data.materials.some(m => m.courseId === id);

    if (isLinked) {
      return showToast(`Cannot delete "${name}". This batch is linked with existing videos, materials or exams. Re-assign them first.`, 'error');
    }

    setCourseToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    const { id, name } = courseToDelete;
    setIsDeleting(true);
    try {
      await deleteCourseFromFirebase(id);
      showToast(`Deleted Batch "${name}"`, 'success');
      setCourseToDelete(null);
    } catch (err: any) {
      console.error("FIRESTORE DELETE ERROR:", err);
      let errorMsg = err.message || err;
      if (err.code === 'permission-denied') {
        errorMsg = "Permission Denied: Check your Firestore Security Rules.";
      }
      showToast(`Failed to delete course: ${errorMsg}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Active Batches & Courses</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define coaching targets, track fee benchmarks, and manage enrolled strength.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm hover:shadow-blue-500/10 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          Add Batch / Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.courses.map(course => (
          <div key={course.id} className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    {course.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{course.name}</h3>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  course.status === 'Active' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'
                }`}>
                  {course.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{course.description || 'No custom syllabus description specified.'}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-x-4 text-[11px] text-slate-500">
                <div>
                  <span className="text-slate-400 block">Enrolled Count</span>
                  <strong className="text-slate-900 text-xs">{course.activeStudents} Aspirants</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Admission Fee</span>
                  <strong className="text-slate-900 text-xs">₹{(Number(course?.fees) || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(course)}
                  className="p-1.5 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-blue-600 rounded cursor-pointer"
                  title="Modify Course"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(course.id, course.name)}
                  className="p-1.5 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-red-600 rounded cursor-pointer"
                  title="Remove Course"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
              <h3 className="text-sm font-extrabold">{editingCourse ? 'Configure Batch' : 'Create Coaching Batch'}</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Batch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APPSC Group II Mains Special Batch"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Batch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AP-G2-M"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  >
                    <option value="Active">Active Admissions</option>
                    <option value="Inactive">Closed / Archival</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Admission Fees (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={fees}
                    onChange={(e) => setFees(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Initial Student Enrollment</label>
                  <input
                    type="number"
                    min={0}
                    value={activeStudents}
                    onChange={(e) => setActiveStudents(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Course / Syllabus Syllabus Description</label>
                <textarea
                  rows={3}
                  placeholder="Briefly state syllabus areas targeted..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-Page Confirmation Modal for Delete (Works in Iframe / Sandbox) */}
      {courseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Coaching Batch?</h3>
                <p className="text-xs text-slate-500 mt-0.5">This will permanently remove the batch from Firestore.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <p className="font-semibold text-slate-800 line-clamp-2">"{courseToDelete.name}"</p>
              <p className="font-mono text-[10px] text-slate-400 mt-1">ID: {courseToDelete.id}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCourseToDelete(null)}
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
