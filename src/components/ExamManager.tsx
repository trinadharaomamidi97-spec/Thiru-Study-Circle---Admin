import React, { useState } from 'react';
import { Award, Plus, Trash2, Edit2, Search, X, Check, HelpCircle, Eye, ChevronRight, Play } from 'lucide-react';
import { ThiruData, Exam, Question, Course } from '../types';
import { deleteExamFromFirebase } from '../utils/firebase';

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

interface ExamManagerProps {
  data: ThiruData;
  onUpdate: (updatedExams: Exam[]) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function ExamManager({ data, onUpdate, showToast }: ExamManagerProps) {
  const [search, setSearch] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isExamFormOpen, setIsExamFormOpen] = useState(false);
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<{ id: string; title: string } | null>(null);
  const [questionToDeleteId, setQuestionToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Exam Form
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [examCourseId, setExamCourseId] = useState('');
  const [examDuration, setExamDuration] = useState(30);
  const [examTotalMarks, setExamTotalMarks] = useState(100);
  const [examPassingMarks, setExamPassingMarks] = useState(40);
  const [examNegativeMarking, setExamNegativeMarking] = useState(0.25);
  const [examInstructions, setExamInstructions] = useState('');
  const [examStatus, setExamStatus] = useState<'Published' | 'Draft'>('Published');

  // Question Form
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState<'a' | 'b' | 'c' | 'd'>('a');
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [qTopic, setQTopic] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Simulator State
  const [activeSimIndex, setActiveSimIndex] = useState(0);
  const [simAnswers, setSimAnswers] = useState<Record<string, string>>({});
  const [simCompleted, setSimCompleted] = useState(false);

  const filteredExams = data.exams.filter(ex =>
    ex.title.toLowerCase().includes(search.toLowerCase()) ||
    ex.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAddExam = () => {
    setSelectedExam(null);
    setExamTitle('');
    setExamSubject('General Studies');
    setExamCourseId(data.courses[0]?.id || '');
    setExamDuration(30);
    setExamTotalMarks(50);
    setExamPassingMarks(20);
    setExamNegativeMarking(0.33);
    setExamInstructions('Attempt all multiple choice questions. Correct answer adds weight, incorrect answer incurs penalty.');
    setExamStatus('Published');
    setIsExamFormOpen(true);
  };

  const handleOpenEditExam = (ex: Exam) => {
    setSelectedExam(ex);
    setExamTitle(ex.title);
    setExamSubject(ex.subject);
    setExamCourseId(ex.courseId);
    setExamDuration(ex.duration);
    setExamTotalMarks(ex.totalMarks);
    setExamPassingMarks(ex.passingMarks);
    setExamNegativeMarking(ex.negativeMarking);
    setExamInstructions(ex.instructions);
    setExamStatus(ex.status);
    setIsExamFormOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) return showToast('Exam Title is required!', 'error');

    const updatedExam: Exam = {
      id: selectedExam ? selectedExam.id : `exam-${Date.now()}`,
      title: examTitle,
      subject: examSubject,
      courseId: examCourseId,
      duration: Number(examDuration),
      totalMarks: Number(examTotalMarks),
      passingMarks: Number(examPassingMarks),
      negativeMarking: Number(examNegativeMarking),
      instructions: examInstructions,
      status: examStatus,
      questions: selectedExam ? selectedExam.questions : []
    };

    let nextExams = [...data.exams];
    if (selectedExam) {
      nextExams = nextExams.map(ex => ex.id === selectedExam.id ? updatedExam : ex);
      showToast(`Saved exam settings for "${examTitle}"`, 'success');
    } else {
      nextExams.unshift(updatedExam);
      showToast(`Created new exam: "${examTitle}"`, 'success');
    }
    onUpdate(nextExams);
    setIsExamFormOpen(false);
    setSelectedExam(updatedExam);
  };

  const handleConfirmDeleteExam = async () => {
    if (!examToDelete) return;
    const { id, title } = examToDelete;
    setIsDeleting(true);
    try {
      await deleteExamFromFirebase(id);
      showToast(`Deleted exam "${title}"`, 'success');
      if (selectedExam?.id === id) setSelectedExam(null);
      setExamToDelete(null);
    } catch (err: any) {
      console.error("FIRESTORE DELETE ERROR:", err);
      let errorMsg = err.message || err;
      if (err.code === 'permission-denied') {
        errorMsg = "Permission Denied: Check your Firestore Security Rules.";
      }
      showToast(`Failed to delete exam: ${errorMsg}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAddQuestion = () => {
    setEditingQuestionId(null);
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectOpt('a');
    setQExplanation('');
    setQDifficulty('Medium');
    setQTopic('');
    setIsQuestionFormOpen(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setQText(q.questionText);
    setOptA(q.options.a);
    setOptB(q.options.b);
    setOptC(q.options.c);
    setOptD(q.options.d);
    setCorrectOpt(q.correctOption);
    setQExplanation(q.explanation);
    setQDifficulty(q.difficulty);
    setQTopic(q.topic);
    setIsQuestionFormOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    if (!qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      return showToast('Please fill out the question and all 4 options', 'error');
    }

    const newQ: Question = {
      id: editingQuestionId || `q-${Date.now()}`,
      questionText: qText,
      options: { a: optA, b: optB, c: optC, d: optD },
      correctOption: correctOpt,
      explanation: qExplanation,
      difficulty: qDifficulty,
      topic: qTopic || selectedExam.subject
    };

    let nextQs = [...selectedExam.questions];
    if (editingQuestionId) {
      nextQs = nextQs.map(q => q.id === editingQuestionId ? newQ : q);
      showToast('Question updated', 'success');
    } else {
      nextQs.push(newQ);
      showToast('New question appended to exam paper', 'success');
    }

    const updatedExam = { ...selectedExam, questions: nextQs };
    const nextExams = data.exams.map(ex => ex.id === selectedExam.id ? updatedExam : ex);
    onUpdate(nextExams);
    setSelectedExam(updatedExam);
    setIsQuestionFormOpen(false);
  };

  const handleConfirmDeleteQuestion = (qId: string) => {
    if (!selectedExam) return;
    const nextQs = selectedExam.questions.filter(q => q.id !== qId);
    const updatedExam = { ...selectedExam, questions: nextQs };
    const nextExams = data.exams.map(ex => ex.id === selectedExam.id ? updatedExam : ex);
    onUpdate(nextExams);
    setSelectedExam(updatedExam);
    showToast('Question deleted', 'info');
    setQuestionToDeleteId(null);
  };

  const startSimulator = () => {
    if (!selectedExam || selectedExam.questions.length === 0) {
      return showToast('Add some questions to this exam before running test simulator!', 'error');
    }
    setActiveSimIndex(0);
    setSimAnswers({});
    setSimCompleted(false);
    setIsSimulatorOpen(true);
  };

  const computeSimResults = () => {
    if (!selectedExam) return { score: 0, right: 0, wrong: 0, skipped: 0 };
    let right = 0;
    let wrong = 0;
    let skipped = 0;
    selectedExam.questions.forEach(q => {
      const ans = simAnswers[q.id];
      if (!ans) skipped++;
      else if (ans === q.correctOption) right++;
      else wrong++;
    });
    const perQuestionMarks = selectedExam.totalMarks / selectedExam.questions.length;
    const penalty = selectedExam.negativeMarking * perQuestionMarks;
    const score = (right * perQuestionMarks) - (wrong * penalty);
    return { score: Number(score.toFixed(2)), right, wrong, skipped };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">OMR / CBT Exam Builder</h2>
          <p className="text-xs text-slate-500 mt-0.5">Author standard practice tests, design multiple-choice question sheets, configure negative marking and run simulations.</p>
        </div>
        <button
          onClick={handleOpenAddExam}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm hover:shadow-blue-500/10 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          Create New Exam Paper
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exams List (1 Column) */}
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search exams..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredExams.map(ex => (
              <div
                key={ex.id}
                onClick={() => setSelectedExam(ex)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-xs ${
                  selectedExam?.id === ex.id
                    ? 'border-blue-600 bg-blue-50/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{ex.subject}</span>
                    <h4 className="font-bold text-slate-900 mt-0.5">{ex.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Questions: <strong className="text-slate-700">{ex.questions?.length || 0}</strong> · Time: <strong>{ex.duration} mins</strong></p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    ex.status === 'Published' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 bg-slate-100'
                  }`}>
                    {ex.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Exam Dashboard / Question Builder (2 Columns) */}
        <div className="lg:col-span-2">
          {selectedExam ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              {/* Exam Metadata summary */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <span className="text-xs text-blue-600 font-semibold">{selectedExam.subject}</span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{selectedExam.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                    <span>Duration: <strong>{selectedExam.duration} mins</strong></span>
                    <span>Total Marks: <strong>{selectedExam.totalMarks}</strong></span>
                    <span>Pass Marks: <strong>{selectedExam.passingMarks}</strong></span>
                    <span>Negative Penalty: <strong className="text-red-600">-{selectedExam.negativeMarking}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start">
                  <button
                    onClick={() => handleOpenEditExam(selectedExam)}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded text-xs text-slate-600 cursor-pointer font-semibold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Configure Exam
                  </button>
                  <button
                    onClick={() => setExamToDelete({ id: selectedExam.id, title: selectedExam.title })}
                    className="p-2 border border-red-200 hover:bg-red-50 text-red-600 rounded text-xs cursor-pointer"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">Question Sheets ({selectedExam.questions?.length || 0})</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={startSimulator}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Student Practice Run
                  </button>
                  <button
                    onClick={handleOpenAddQuestion}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Question
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {selectedExam.questions?.length === 0 ? (
                  <div className="text-center p-8 border border-dashed border-slate-200 rounded-lg">
                    <HelpCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">No questions added yet. Push "Add Question" above to insert your first exam item.</p>
                  </div>
                ) : (
                  selectedExam.questions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 relative">
                      <div className="absolute top-4 right-4 flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditQuestion(q)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-blue-600 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setQuestionToDeleteId(q.id)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-red-600 cursor-pointer"
                          title="Delete question"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-xs">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-slate-400 font-mono">Q{idx + 1}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            q.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                            q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {q.difficulty}
                          </span>
                          <span className="text-[10px] text-slate-500">{q.topic}</span>
                        </div>

                        <p className="font-semibold text-slate-800 mb-3">{q.questionText}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {Object.entries(q.options).map(([key, val]) => (
                            <div 
                              key={key} 
                              className={`p-2 rounded border text-[11px] flex items-center gap-2 ${
                                q.correctOption === key 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium' 
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <span className="uppercase font-mono font-extrabold w-4 h-4 bg-slate-200/60 rounded flex items-center justify-center text-[10px]">
                                {key}
                              </span>
                              <span>{val}</span>
                            </div>
                          ))}
                        </div>

                        {q.explanation && (
                          <div className="bg-blue-50/50 p-2.5 rounded border border-blue-100/50 text-[11px] text-slate-600 leading-relaxed">
                            <strong className="text-blue-800">Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
              <Award className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Exam Selected</h3>
              <p className="text-xs mt-1">Select an exam from the list to manage and review questions, or click "Create New Exam Paper" to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Exam metadata creator modal */}
      {isExamFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-extrabold">{selectedExam ? 'Configure Exam Settings' : 'Create Exam Paper'}</h3>
              <button onClick={() => setIsExamFormOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveExam} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Mini Mock - Indian Polity"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Subject / Syllabus Topic *</label>
                  <select
                    value={PRESET_SUBJECTS.includes(examSubject) ? examSubject : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setExamSubject('');
                      } else {
                        setExamSubject(val);
                      }
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  >
                    {PRESET_SUBJECTS.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    <option value="custom">✍️ [Type Custom Subject...]</option>
                  </select>

                  {(!PRESET_SUBJECTS.includes(examSubject) || examSubject === '') && (
                    <input
                      type="text"
                      required
                      placeholder="Enter custom subject manually..."
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      className="w-full mt-1.5 p-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Batch *</label>
                  <select
                    value={examCourseId}
                    onChange={(e) => setExamCourseId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  >
                    {data.courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name.split(' - ')[0]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Duration (mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={examDuration}
                    onChange={(e) => setExamDuration(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Total Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={examTotalMarks}
                    onChange={(e) => setExamTotalMarks(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Pass Marks</label>
                  <input
                    type="number"
                    min={0}
                    value={examPassingMarks}
                    onChange={(e) => setExamPassingMarks(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Negative Marking Value</label>
                  <select
                    value={examNegativeMarking}
                    onChange={(e) => setExamNegativeMarking(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  >
                    <option value={0}>No Negative Marking</option>
                    <option value={0.25}>0.25 (1/4th penalty)</option>
                    <option value={0.33}>0.33 (1/3rd penalty)</option>
                    <option value={0.5}>0.5 (Half penalty)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Status</label>
                  <select
                    value={examStatus}
                    onChange={(e) => setExamStatus(e.target.value as 'Published' | 'Draft')}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Exam Instructions</label>
                <textarea
                  rows={3}
                  value={examInstructions}
                  onChange={(e) => setExamInstructions(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExamFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold cursor-pointer"
                >
                  Save settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {isQuestionFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-extrabold">{editingQuestionId ? 'Modify MCQ Question' : 'Add MCQ Question'}</h3>
              <button onClick={() => setIsQuestionFormOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Question Content *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Which Constitutional Amendment guaranteed Right to Education?"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Multiple Choice Options (A, B, C, D) *</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono bg-slate-100 text-slate-600 w-6 h-6 rounded flex items-center justify-center shrink-0">A</span>
                    <input type="text" required placeholder="Option A" value={optA} onChange={e => setOptA(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono bg-slate-100 text-slate-600 w-6 h-6 rounded flex items-center justify-center shrink-0">B</span>
                    <input type="text" required placeholder="Option B" value={optB} onChange={e => setOptB(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono bg-slate-100 text-slate-600 w-6 h-6 rounded flex items-center justify-center shrink-0">C</span>
                    <input type="text" required placeholder="Option C" value={optC} onChange={e => setOptC(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono bg-slate-100 text-slate-600 w-6 h-6 rounded flex items-center justify-center shrink-0">D</span>
                    <input type="text" required placeholder="Option D" value={optD} onChange={e => setOptD(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Correct Option *</label>
                  <select
                    value={correctOpt}
                    onChange={(e) => setCorrectOpt(e.target.value as 'a' | 'b' | 'c' | 'd')}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none font-bold"
                  >
                    <option value="a">Option A</option>
                    <option value="b">Option B</option>
                    <option value="c">Option C</option>
                    <option value="d">Option D</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Difficulty Level</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Topic tag / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Fundamental Rights"
                  value={qTopic}
                  onChange={(e) => setQTopic(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">In-depth Solution / Explanation</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this option is correct for learning reference..."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuestionFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold cursor-pointer"
                >
                  {editingQuestionId ? 'Save Question' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CBT practice Simulator Modal */}
      {isSimulatorOpen && selectedExam && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 text-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{selectedExam.subject}</span>
                <h3 className="text-sm font-extrabold text-white">Student simulator: {selectedExam.title}</h3>
              </div>
              <button 
                onClick={() => setIsSimulatorOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-full hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!simCompleted ? (
              <div className="p-6 space-y-6">
                {/* Active Question */}
                {selectedExam.questions[activeSimIndex] && (
                  (() => {
                    const currentQ = selectedExam.questions[activeSimIndex];
                    const selectedAns = simAnswers[currentQ.id];
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Question <strong>{activeSimIndex + 1}</strong> of <strong>{selectedExam.questions.length}</strong></span>
                          <span className="bg-slate-800 px-2 py-0.5 rounded font-mono">Timer: Simulation Active</span>
                        </div>

                        <p className="text-sm font-semibold text-slate-100 leading-relaxed bg-slate-900 p-4 rounded-lg border border-slate-800">
                          {currentQ.questionText}
                        </p>

                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(currentQ.options).map(([key, val]) => (
                            <button
                              type="button"
                              key={key}
                              onClick={() => setSimAnswers({ ...simAnswers, [currentQ.id]: key })}
                              className={`p-3 rounded-lg border text-xs text-left flex items-center gap-3 transition-colors cursor-pointer ${
                                selectedAns === key
                                  ? 'bg-blue-900/30 border-blue-500 text-blue-200 font-semibold'
                                  : 'bg-slate-900/55 border-slate-800 hover:bg-slate-900 text-slate-300'
                              }`}
                            >
                              <span className={`uppercase font-mono font-bold w-5 h-5 rounded flex items-center justify-center text-[11px] ${
                                selectedAns === key ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
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

                {/* Footer buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="flex gap-2">
                    <button
                      disabled={activeSimIndex === 0}
                      onClick={() => setActiveSimIndex(activeSimIndex - 1)}
                      className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      disabled={activeSimIndex === selectedExam.questions.length - 1}
                      onClick={() => setActiveSimIndex(activeSimIndex + 1)}
                      className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                    >
                      Next
                    </button>
                  </div>

                  <button
                    onClick={() => setSimCompleted(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer"
                  >
                    Submit Exam Paper
                  </button>
                </div>
              </div>
            ) : (
              (() => {
                const results = computeSimResults();
                return (
                  <div className="p-6 text-center space-y-6">
                    <div className="space-y-1">
                      <h4 className="text-lg font-extrabold text-emerald-400">Exam Successfully Submitted</h4>
                      <p className="text-xs text-slate-400">Scorecard evaluation completed instantly under study circle norms.</p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="p-3 bg-slate-900 rounded-lg">
                        <span className="text-xl font-bold block text-white">{results.score} / {selectedExam.totalMarks}</span>
                        <span className="text-[10px] text-slate-400">Final Marks</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg">
                        <span className="text-xl font-bold block text-emerald-400">{results.right}</span>
                        <span className="text-[10px] text-emerald-500">Correct Answers</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg">
                        <span className="text-xl font-bold block text-red-400">{results.wrong}</span>
                        <span className="text-[10px] text-red-500">Wrong (Penalized)</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg">
                        <span className="text-xl font-bold block text-slate-400">{results.skipped}</span>
                        <span className="text-[10px] text-slate-400">Skipped</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-lg text-left max-h-[220px] overflow-y-auto space-y-3 border border-slate-800">
                      <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Review Answers:</h5>
                      {selectedExam.questions.map((q, idx) => {
                        const correct = simAnswers[q.id] === q.correctOption;
                        return (
                          <div key={idx} className="border-b border-slate-800 pb-2 text-[11px] last:border-none last:pb-0">
                            <p className="font-semibold text-slate-200">Q{idx + 1}. {q.questionText}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-slate-400">Your Answer: <strong className={correct ? 'text-emerald-400' : 'text-red-400'}>{simAnswers[q.id]?.toUpperCase() || 'Skipped'}</strong></span>
                              <span>·</span>
                              <span className="text-slate-400">Correct: <strong className="text-emerald-400">{q.correctOption.toUpperCase()}</strong></span>
                            </div>
                            {q.explanation && (
                              <p className="text-[10px] text-slate-500 mt-1 italic">Explanation: {q.explanation}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-center gap-3 pt-2">
                      <button
                        onClick={() => { setSimAnswers({}); setSimCompleted(false); setActiveSimIndex(0); }}
                        className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 rounded text-xs font-semibold cursor-pointer"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => setIsSimulatorOpen(false)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer"
                      >
                        Finish Review
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* In-Page Confirmation Modal for Exam Delete */}
      {examToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Exam Paper?</h3>
                <p className="text-xs text-slate-500 mt-0.5">This will delete this exam and all associated questions from Firestore.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <p className="font-semibold text-slate-800 line-clamp-2">"{examToDelete.title}"</p>
              <p className="font-mono text-[10px] text-slate-400 mt-1">ID: {examToDelete.id}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setExamToDelete(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteExam}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Page Confirmation Modal for Question Delete */}
      {questionToDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Remove Question?</h3>
                <p className="text-xs text-slate-500 mt-0.5">This will delete this question from the exam paper.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQuestionToDeleteId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteQuestion(questionToDeleteId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
