import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, X, Search, Check, Sparkles } from 'lucide-react';
import { Conversation, SubjectTeacherMode } from '../../types';

interface ConversationHistoryDrawerProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
}

export const ConversationHistoryDrawer: React.FC<ConversationHistoryDrawerProps> = ({
  conversations,
  activeConversationId,
  isOpen,
  onClose,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (c: Conversation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative z-10 flex w-full max-w-xs sm:max-w-sm flex-col bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Conversation History
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action & Search */}
        <div className="p-3 space-y-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 p-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 transition-colors active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>New AI Doubt Session</span>
          </button>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No conversations found. Start a new session!
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  className={`group relative flex items-center justify-between rounded-xl border p-2.5 transition-all text-xs ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 font-semibold'
                      : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div
                    className="flex flex-1 items-center gap-2 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (!isEditing) {
                        onSelectConversation(conv.id);
                        onClose();
                      }
                    }}
                  >
                    <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />

                    {isEditing ? (
                      <div className="flex flex-1 items-center gap-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(conv.id);
                          }}
                          className="w-full rounded border border-indigo-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(conv.id)}
                          className="p-1 text-emerald-600 hover:text-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 truncate">
                        <p className="truncate text-xs font-medium">{conv.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {conv.messages.length} messages • {new Date(conv.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(conv);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Rename"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(conv.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Delete Conversation?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This action cannot be undone. All messages in this session will be removed.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteConversation(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
