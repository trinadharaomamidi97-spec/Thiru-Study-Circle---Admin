import React, { useState } from 'react';
import { AppUser, Course } from '../types';
import { 
  Users, Trash2, Check, X, ShieldAlert, BookOpen, Clock, AlertTriangle, Search, Filter 
} from 'lucide-react';

interface UserManagerProps {
  users: AppUser[];
  courses: Course[];
  onSaveUser: (user: AppUser) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function UserManager({ 
  users, 
  courses, 
  onSaveUser, 
  onDeleteUser, 
  showToast 
}: UserManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'Pending' | 'Rejected'>('All');
  const [roleFilter, setRoleFilter] = useState<'All' | 'admin' | 'student'>('All');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleApprove = async (user: AppUser) => {
    try {
      await onSaveUser({
        ...user,
        status: 'Approved'
      });
      showToast(`Approved ${user.name} successfully!`, 'success');
    } catch (err) {
      showToast('Failed to approve user.', 'error');
    }
  };

  const handleReject = async (user: AppUser) => {
    try {
      await onSaveUser({
        ...user,
        status: 'Rejected'
      });
      showToast(`Rejected access for ${user.name}.`, 'success');
    } catch (err) {
      showToast('Failed to reject user.', 'error');
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    try {
      await onDeleteUser(userId);
      showToast(`Deleted ${userName} successfully. They can no longer access the courses!`, 'success');
      setIsDeletingId(null);
    } catch (err) {
      showToast('Failed to delete user.', 'error');
    }
  };

  const handleToggleCourseEnrollment = async (user: AppUser, courseId: string) => {
    try {
      const updatedCourses = user.enrolledCourses?.includes(courseId)
        ? user.enrolledCourses.filter(id => id !== courseId)
        : [...(user.enrolledCourses || []), courseId];

      await onSaveUser({
        ...user,
        enrolledCourses: updatedCourses
      });
      showToast(`Updated course enrollment for ${user.name}.`, 'success');
    } catch (err) {
      showToast('Failed to update course enrollments.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            User Access & Security Control
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authorize new registrations, assign/enroll them into courses, or completely delete unknown or unwanted accounts.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-500">Aspirants</span>
            <span className="text-xl font-extrabold text-blue-400">{users.filter(u => u.role === 'student').length}</span>
          </div>
          <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-500">Pending Approval</span>
            <span className="text-xl font-extrabold text-amber-500">{users.filter(u => u.status === 'Pending').length}</span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-600 font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <select
              value={roleFilter}
              onChange={(e: any) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-600 font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="student">Students</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Directory Cards/List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="bg-slate-50 rounded-xl py-12 text-center border border-dashed border-slate-200">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500">No users match your filters.</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting search or filter tags.</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div 
              key={user.id} 
              className={`bg-white border rounded-xl p-5 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-slate-300 ${
                user.status === 'Pending' ? 'border-l-4 border-l-amber-500' : ''
              }`}
            >
              {/* Profile & Metadata Column */}
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm ${
                  user.role === 'admin' 
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-500' 
                    : 'bg-gradient-to-tr from-blue-600 to-sky-500'
                }`}>
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-extrabold text-slate-800">{user.name || 'Anonymous Aspirant'}</h3>
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>

                    {/* Status Pill */}
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide rounded-full ${
                      user.status === 'Approved' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : user.status === 'Pending'
                        ? 'bg-amber-100 text-amber-700 animate-pulse'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {user.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                  
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>
              </div>

              {/* Course Enrollment Selection Column (Only for Students) */}
              {user.role === 'student' && (
                <div className="border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-5 flex-1 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Assigned / Enrolled Courses:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {courses.map(course => {
                      const isEnrolled = user.enrolledCourses?.includes(course.id);
                      return (
                        <button
                          key={course.id}
                          onClick={() => handleToggleCourseEnrollment(user, course.id)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                            isEnrolled
                              ? 'bg-blue-50 border-blue-200 text-blue-600'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{course.name}</span>
                          {isEnrolled && <span className="text-blue-500 ml-0.5">✓</span>}
                        </button>
                      );
                    })}
                    {courses.length === 0 && (
                      <span className="text-[10px] text-slate-400 italic">No courses found to enroll.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions Column */}
              <div className="border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0 flex items-center gap-2 self-end lg:self-center shrink-0">
                {user.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(user)}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                      title="Approve student access"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReject(user)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Reject student access"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}

                {user.status === 'Approved' && user.role !== 'admin' && (
                  <button
                    onClick={() => handleReject(user)}
                    className="text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-600 font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Revoke / Disapprove user access"
                  >
                    Revoke Access
                  </button>
                )}

                {user.status === 'Rejected' && (
                  <button
                    onClick={() => handleApprove(user)}
                    className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Restore / Approve access"
                  >
                    Re-Approve
                  </button>
                )}

                {/* Secure Delete Option (Prevents deleting themselves) */}
                {isDeletingId === user.id ? (
                  <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 p-1.5 rounded-lg">
                    <span className="text-[10px] text-red-600 font-bold">Confirm delete?</span>
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setIsDeletingId(null)}
                      className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-semibold rounded"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsDeletingId(user.id)}
                    className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                    title="Delete User Account Permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
