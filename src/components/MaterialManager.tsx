import React, { useState, useMemo } from 'react';
import { FileText, Plus, Trash2, Edit2, Search, X, Check, ArrowUpRight, Download } from 'lucide-react';
import { ThiruData, StudyMaterial, Course } from '../types';
import { deleteMaterialFromFirebase } from '../utils/firebase';

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

interface MaterialManagerProps {
  data: ThiruData;
  onUpdate: (updatedMaterials: StudyMaterial[]) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function MaterialManager({ data, onUpdate, showToast }: MaterialManagerProps) {
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [courseId, setCourseId] = useState('');
  const [fileType, setFileType] = useState<'PDF' | 'Doc' | 'Link' | 'Image'>('PDF');
  const [url, setUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Published');

  const filteredMaterials = useMemo(() => {
    return data.materials.filter(mat => {
      const matchesSearch = mat.title.toLowerCase().includes(search.toLowerCase()) ||
                            mat.subject.toLowerCase().includes(search.toLowerCase());
      const matchesCourse = selectedCourse === 'all' || mat.courseId === selectedCourse;
      return matchesSearch && matchesCourse;
    });
  }, [data.materials, search, selectedCourse]);

  const handleOpenAdd = () => {
    setEditingMaterial(null);
    setTitle('');
    setSubject('General Studies');
    setCourseId(data.courses[0]?.id || '');
    setFileType('PDF');
    setUrl('https://example.com/polity_notes.pdf');
    setFileSize('4.5 MB');
    setStatus('Published');
    setIsOpen(true);
  };

  const handleOpenEdit = (mat: StudyMaterial) => {
    setEditingMaterial(mat);
    setTitle(mat.title);
    setSubject(mat.subject);
    setCourseId(mat.courseId);
    setFileType(mat.fileType);
    setUrl(mat.url);
    setFileSize(mat.fileSize);
    setStatus(mat.status);
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return showToast('Please enter Title and Resource URL!', 'error');

    const materialData: StudyMaterial = {
      id: editingMaterial ? editingMaterial.id : `mat-${Date.now()}`,
      title,
      subject,
      courseId,
      fileType,
      url,
      fileSize: fileType === 'Link' ? 'Web Link' : (fileSize || '2.0 MB'),
      downloadsCount: editingMaterial ? editingMaterial.downloadsCount : 0,
      status,
      createdAt: editingMaterial ? editingMaterial.createdAt : new Date().toISOString().split('T')[0]
    };

    let nextMaterials = [...data.materials];
    if (editingMaterial) {
      nextMaterials = nextMaterials.map(m => m.id === editingMaterial.id ? materialData : m);
      showToast(`Updated: "${title}"`, 'success');
    } else {
      nextMaterials.unshift(materialData);
      showToast(`Added: "${title}"`, 'success');
    }

    onUpdate(nextMaterials);
    setIsOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!materialToDelete) return;
    const { id, title } = materialToDelete;
    setIsDeleting(true);
    try {
      await deleteMaterialFromFirebase(id);
      showToast(`Deleted "${title}"`, 'success');
      setMaterialToDelete(null);
    } catch (err: any) {
      console.error("FIRESTORE DELETE ERROR:", err);
      let errorMsg = err.message || err;
      if (err.code === 'permission-denied') {
        errorMsg = "Permission Denied: Check your Firestore Security Rules.";
      }
      showToast(`Failed to delete material: ${errorMsg}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Study Materials & Notes</h2>
          <p className="text-xs text-slate-500 mt-0.5">Distribute downloadable PDFs, syllabus keys, reference manuals, or external links.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm hover:shadow-blue-500/10 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          Add Study Material
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by note title or subject..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 min-w-[180px]"
        >
          <option value="all">All Batches</option>
          {data.courses.map(c => (
            <option key={c.id} value={c.id}>{c.code} - {c.name.split(' - ')[0]}</option>
          ))}
        </select>
      </div>

      {/* Materials List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="p-4">Title & Subject</th>
                <th className="p-4">Batch</th>
                <th className="p-4">Type</th>
                <th className="p-4">Resource Info</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No documents found. Click "Add Study Material" to populate this directory.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map(mat => {
                  const course = data.courses.find(c => c.id === mat.courseId);
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">{mat.subject}</span>
                            <h4 className="font-bold text-slate-800 line-clamp-1">{mat.title}</h4>
                            <span className="text-[10px] text-slate-400">Added {mat.createdAt}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          {course?.code || 'GS'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="uppercase text-[10px] font-bold text-slate-500">
                          {mat.fileType}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-[11px] text-slate-600">
                          <p>{mat.fileSize}</p>
                          <p className="text-[10px] text-slate-400">{(mat.downloadsCount ?? 0).toLocaleString()} downloads</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          mat.status === 'Published' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 bg-slate-100'
                        }`}>
                          {mat.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={mat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900"
                            title="Open Link"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleOpenEdit(mat)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setMaterialToDelete({ id: mat.id, title: mat.title })}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Form */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-150">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {editingMaterial ? 'Edit Material Details' : 'Add New Material'}
                </h3>
                <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Material / E-Book Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AP Socio-Economic Outlook Highlights"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Subject / Category *</label>
                    <select
                      value={PRESET_SUBJECTS.includes(subject) ? subject : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setSubject('');
                        } else {
                          setSubject(val);
                        }
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none"
                    >
                      {PRESET_SUBJECTS.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                      <option value="custom">✍️ [Type Custom Subject...]</option>
                    </select>
                    
                    {(!PRESET_SUBJECTS.includes(subject) || subject === '') && (
                      <input
                        type="text"
                        required
                        placeholder="Enter custom subject manually..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full mt-1.5 p-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Batch Target *</label>
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none"
                    >
                      {data.courses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name.split(' - ')[0]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Resource Type</label>
                    <select
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none"
                    >
                      <option value="PDF">PDF E-Book</option>
                      <option value="Doc">Word Document</option>
                      <option value="Link">External Web Link</option>
                      <option value="Image">Infographic / Chart</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Approx. File Size</label>
                    <input
                      type="text"
                      disabled={fileType === 'Link'}
                      placeholder="e.g. 5.4 MB"
                      value={fileSize}
                      onChange={(e) => setFileSize(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Document URL / Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/polity_notes.pdf"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Publishing Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setStatus('Published')}
                      className={`flex-1 py-1.5 text-center rounded font-semibold cursor-pointer ${
                        status === 'Published' 
                          ? 'bg-blue-50 border border-blue-300 text-blue-800' 
                          : 'bg-slate-50 border border-slate-200 text-slate-600'
                      }`}
                    >
                      Published
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('Draft')}
                      className={`flex-1 py-1.5 text-center rounded font-semibold cursor-pointer ${
                        status === 'Draft' 
                          ? 'bg-slate-100 border border-slate-300 text-slate-800' 
                          : 'bg-slate-50 border border-slate-200 text-slate-600'
                      }`}
                    >
                      Draft
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer font-bold"
                  >
                    {editingMaterial ? 'Save Changes' : 'Publish Material'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* In-Page Confirmation Modal for Delete (Works in Iframe / Sandbox) */}
      {materialToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Study Material?</h3>
                <p className="text-xs text-slate-500 mt-0.5">This will permanently remove the material from Firestore.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <p className="font-semibold text-slate-800 line-clamp-2">"{materialToDelete.title}"</p>
              <p className="font-mono text-[10px] text-slate-400 mt-1">ID: {materialToDelete.id}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setMaterialToDelete(null)}
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
