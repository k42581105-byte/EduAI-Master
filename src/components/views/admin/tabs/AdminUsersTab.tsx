import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Shield,
  GraduationCap,
  Heart,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Edit2,
  Ban,
  RotateCcw,
  Sparkles,
  Eye,
  X
} from 'lucide-react';
import { AdminUserRecord, UserRole } from '../../../../types';
import { AdminService } from '../../../../services/adminService';
import { Card } from '../../../common/Card';
import { Badge } from '../../../common/Badge';
import { Button } from '../../../common/Button';

interface AdminUsersTabProps {
  onRefreshStats?: () => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ onRefreshStats }) => {
  const [users, setUsers] = useState<AdminUserRecord[]>(() => AdminService.getUsersList());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newClassGrade, setNewClassGrade] = useState('10');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.emailMasked.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.classGrade && u.classGrade.includes(searchQuery));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const showToast = (text: string, isError = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRoleChange = (uid: string, nextRole: UserRole) => {
    const res = AdminService.updateUserRole(uid, nextRole);
    if (res.success) {
      setUsers(AdminService.getUsersList());
      showToast(res.message);
      if (onRefreshStats) onRefreshStats();
    } else {
      showToast(res.message, true);
    }
  };

  const handleToggleStatus = (uid: string) => {
    const res = AdminService.toggleUserSuspension(uid);
    if (res.success) {
      setUsers(AdminService.getUsersList());
      showToast(`User status set to ${res.newStatus}.`);
      if (onRefreshStats) onRefreshStats();
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast('Please provide both name and email', true);
      return;
    }

    const emailParts = newEmail.split('@');
    const masked = emailParts[0].substring(0, 3) + '***@' + (emailParts[1] || 'domain.com');

    const newUser: AdminUserRecord = {
      uid: `usr-${Date.now()}`,
      displayName: newName.trim(),
      emailMasked: masked,
      role: newRole,
      classGrade: newRole === 'student' ? newClassGrade : undefined,
      board: 'CBSE',
      status: 'active',
      lastActive: 'Just now',
      createdAt: new Date().toISOString(),
      xpEarned: newRole === 'student' ? 120 : 0,
      quizzesTaken: 0,
      questionsSolved: 0,
      isVerified: true,
    };

    const updated = [newUser, ...users];
    AdminService.saveUsersList(updated);
    setUsers(updated);
    AdminService.logAudit(
      'Principal Admin',
      'User Registered',
      'user_management',
      `Registered new ${newRole} account: ${newName.trim()} (${masked}).`
    );

    setIsAddModalOpen(false);
    setNewName('');
    setNewEmail('');
    showToast(`User ${newName.trim()} created successfully.`);
    if (onRefreshStats) onRefreshStats();
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'student':
        return <GraduationCap className="w-3.5 h-3.5 text-blue-500" />;
      case 'parent':
        return <Heart className="w-3.5 h-3.5 text-purple-500 fill-current" />;
      case 'teacher':
        return <Briefcase className="w-3.5 h-3.5 text-teal-500" />;
      case 'admin':
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  const getStatusBadge = (status: AdminUserRecord['status']) => {
    switch (status) {
      case 'online':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Online</span>
          </span>
        );
      case 'active':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Active</span>
          </span>
        );
      case 'idle':
        return (
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
            Idle
          </span>
        );
      case 'suspended':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md">
            <Ban className="w-3 h-3" />
            <span>Suspended</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in ${
            feedback.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            User Management & Access Controls
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Privacy-safe user directory with role assignment and account state management
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="text-xs shadow-xs shrink-0"
          onClick={() => setIsAddModalOpen(true)}
          icon={<UserPlus className="w-3.5 h-3.5" />}
        >
          Add New User
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, class, or masked email..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'student', 'parent', 'teacher', 'admin'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all active:scale-95 ${
                roleFilter === role
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-300 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              {role === 'all' ? 'All Roles' : `${role}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Class / Grade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Activity & Stats</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.uid}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* User Details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs border border-indigo-200/50 dark:border-indigo-800">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {user.displayName}
                            {user.isVerified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" title="Verified Account" />
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {user.emailMasked}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {getRoleIcon(user.role)}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold py-1 px-2 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="student">Student</option>
                          <option value="parent">Parent</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {user.classGrade ? `Class ${user.classGrade}` : '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(user.status)}
                    </td>

                    {/* Stats */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                      <div>Last active: {user.lastActive}</div>
                      {user.role === 'student' && (
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          {user.xpEarned || 0} XP • {user.quizzesTaken || 0} quizzes • {user.questionsSolved || 0} solved
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
                          title="Inspect User Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.uid)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.status === 'suspended'
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                              : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                          }`}
                          title={user.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
                        >
                          {user.status === 'suspended' ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                Register New User Account
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Display Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Aryan Mittal"
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="aryan@eduaimaster.com"
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    User Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-medium"
                  >
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {newRole === 'student' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Class Level
                    </label>
                    <select
                      value={newClassGrade}
                      onChange={(e) => setNewClassGrade(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-medium"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                        <option key={cls} value={cls.toString()}>
                          Class {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                User Account Overview
              </h4>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                  {selectedUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedUser.displayName}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedUser.emailMasked}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedUser.status)}
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Account UID</p>
                  <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 truncate">{selectedUser.uid}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Created Date</p>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 text-[10px] font-bold uppercase">XP Earned</p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold mt-0.5">
                    {selectedUser.xpEarned || 0} XP
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Quizzes Completed</p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold mt-0.5">
                    {selectedUser.quizzesTaken || 0} Quizzes
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="primary"
                size="sm"
                className="text-xs"
                onClick={() => setSelectedUser(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
