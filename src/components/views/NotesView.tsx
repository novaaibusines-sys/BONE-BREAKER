import React, { useState, useMemo, useEffect } from 'react';
import { Note } from '../../types';
import { sounds } from '../../utils/sound';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Pin, 
  PinOff, 
  Search, 
  Tag, 
  Calendar, 
  Check, 
  FileText 
} from 'lucide-react';

interface NotesViewProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);

  // Active note in editor
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  // Editor local form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  // Sync editor when active note changes
  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title);
      setEditContent(activeNote.content);
      setEditTags((activeNote.tags || []).join(', '));
    } else if (notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    }
  }, [activeNote?.id]);

  // Auto-save while typing debounced
  useEffect(() => {
    if (!activeNote) return;

    // Only update if something changed
    const currentTagsArr = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (
      editTitle !== activeNote.title ||
      editContent !== activeNote.content ||
      JSON.stringify(currentTagsArr) !== JSON.stringify(activeNote.tags)
    ) {
      const timer = setTimeout(() => {
        onUpdateNote({
          ...activeNote,
          title: editTitle.trim() || 'Untitled Entry',
          content: editContent,
          tags: currentTagsArr,
          updatedAt: new Date().toISOString(),
        });
        setIsSavedIndicator(true);
        setTimeout(() => setIsSavedIndicator(false), 1500);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [editTitle, editContent, editTags]);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => (n.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  // Filtered & sorted notes (pinned first, then by updatedAt desc)
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (selectedTag !== 'all' && !(n.tags || []).includes(selectedTag)) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          const matchTags = (n.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, selectedTag, searchQuery]);

  const handleCreateNewNote = () => {
    sounds.playClick();
    const newNoteObj: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
      title: 'New Codex Entry',
      content: '',
      pinned: false,
      tags: ['Tactics'],
    };
    onAddNote(newNoteObj);
    sounds.playAlert();
  };

  const handleTogglePin = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    onUpdateNote({
      ...note,
      pinned: !note.pinned,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-[#231b19] border border-[#382d2a] p-4 sm:p-5 clip-angular flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#E0262B]" />
            <h1 className="font-warrior text-xl sm:text-2xl font-bold text-[#EDEFF1]">
              WARRIOR CODEX & NOTES
            </h1>
          </div>
          <p className="text-xs text-[#9A9DA1] mt-1">
            Capture strategic philosophies, battle reflections, and training logs. Auto-saved.
          </p>
        </div>

        <button
          onClick={handleCreateNewNote}
          className="flex items-center justify-center gap-2 bg-[#E0262B] hover:bg-[#c01d22] active:scale-95 text-white px-4 py-2.5 text-xs sm:text-sm font-bold font-warrior transition glow-red clip-angular-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          NEW CODEX ENTRY
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Note List & Filters */}
        <div className="space-y-3">
          {/* Search & Tag Filter */}
          <div className="bg-[#231b19] border border-[#382d2a] p-3 clip-angular space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9A9DA1] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search codex..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181211] border border-[#382d2a] pl-8 pr-3 py-1.5 text-xs text-[#EDEFF1] focus:border-[#E0262B] outline-none"
              />
            </div>

            {/* Tag pills */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                    selectedTag === 'all'
                      ? 'bg-[#E0262B] text-white'
                      : 'bg-[#181211] text-[#9A9DA1] hover:text-[#EDEFF1]'
                  }`}
                >
                  ALL
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded shrink-0 ${
                      selectedTag === t
                        ? 'bg-[#E0262B] text-white'
                        : 'bg-[#181211] text-[#9A9DA1] hover:text-[#EDEFF1]'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <div className="p-6 text-center text-[#9A9DA1] bg-[#231b19] border border-[#382d2a] clip-angular">
                <p className="text-xs">No entries match your query.</p>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = note.id === selectedNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedNoteId(note.id);
                    }}
                    className={`p-3.5 border transition cursor-pointer clip-angular ${
                      isSelected
                        ? 'bg-[#281e1c] border-[#E0262B] glow-red'
                        : 'bg-[#231b19] border-[#382d2a] hover:border-[#9A9DA1]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-warrior text-sm font-bold text-[#EDEFF1] truncate flex-1">
                        {note.title || 'Untitled Entry'}
                      </span>
                      <button
                        onClick={(e) => handleTogglePin(note, e)}
                        className={`p-1 transition ${
                          note.pinned ? 'text-[#E0262B]' : 'text-[#9A9DA1] hover:text-[#EDEFF1]'
                        }`}
                        title={note.pinned ? 'Unpin' : 'Pin to top'}
                      >
                        {note.pinned ? (
                          <Pin className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <PinOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-[#9A9DA1] line-clamp-2 mt-1.5 leading-relaxed">
                      {note.content || 'Empty entry...'}
                    </p>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#382d2a]/60 text-[10px] text-[#9A9DA1] font-mono">
                      <span>
                        {new Date(note.updatedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {note.tags && note.tags.length > 0 && (
                        <span className="text-[#E0262B]">
                          #{note.tags[0]}
                          {note.tags.length > 1 ? ` +${note.tags.length - 1}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Full Editor */}
        <div className="md:col-span-2">
          {activeNote ? (
            <div className="bg-[#231b19] border border-[#382d2a] p-5 clip-angular shadow-xl flex flex-col h-full min-h-[500px]">
              {/* Editor Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#382d2a] gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Entry Title..."
                    className="bg-transparent font-warrior text-lg sm:text-xl font-bold text-[#EDEFF1] outline-none border-b border-transparent focus:border-[#E0262B] transition w-full"
                  />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Auto-save status indicator */}
                  <span className="text-[11px] font-mono text-[#9A9DA1] flex items-center gap-1">
                    {isSavedIndicator ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#E0262B]" />
                        <span className="text-[#E0262B]">SAVED</span>
                      </>
                    ) : (
                      <span>AUTO-SAVE READY</span>
                    )}
                  </span>

                  {/* Pin Toggle */}
                  <button
                    onClick={(e) => handleTogglePin(activeNote, e)}
                    className={`p-1.5 rounded transition ${
                      activeNote.pinned
                        ? 'bg-[#181211] text-[#E0262B] border border-[#E0262B]'
                        : 'bg-[#181211] text-[#9A9DA1] border border-[#382d2a]'
                    }`}
                    title={activeNote.pinned ? 'Unpin' : 'Pin to top'}
                  >
                    <Pin className={`w-4 h-4 ${activeNote.pinned ? 'fill-current' : ''}`} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this codex entry permanently?')) {
                        sounds.playClick();
                        onDeleteNote(activeNote.id);
                        setSelectedNoteId(null);
                      }
                    }}
                    className="p-1.5 bg-[#181211] text-[#9A9DA1] hover:text-[#E0262B] border border-[#382d2a] rounded transition"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tag Input */}
              <div className="py-2.5 flex items-center gap-2 border-b border-[#382d2a]/60">
                <Tag className="w-3.5 h-3.5 text-[#E0262B] shrink-0" />
                <input
                  type="text"
                  placeholder="Tags separated by commas (e.g. Tactics, Mindset, Bench)..."
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#EDEFF1] placeholder-[#9A9DA1]/70 outline-none font-mono"
                />
              </div>

              {/* Text Area */}
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write your tactical creed, workout reflection, or mission breakdown here..."
                rows={18}
                className="flex-1 w-full bg-transparent mt-3 text-xs sm:text-sm text-[#EDEFF1] leading-relaxed placeholder-[#9A9DA1]/50 outline-none resize-none font-sans"
              />

              {/* Editor Footer */}
              <div className="pt-3 border-t border-[#382d2a] flex items-center justify-between text-[11px] text-[#9A9DA1] font-mono">
                <span>
                  CREATED:{' '}
                  {new Date(activeNote.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span>
                  {editContent.length} chars | {editContent.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#231b19] border border-[#382d2a] p-12 text-center clip-angular min-h-[400px] flex flex-col items-center justify-center">
              <FileText className="w-10 h-10 text-[#9A9DA1] mb-2 opacity-50" />
              <h3 className="font-warrior text-base font-bold text-[#EDEFF1]">
                NO ENTRY SELECTED
              </h3>
              <p className="text-xs text-[#9A9DA1] mt-1 max-w-sm">
                Select an entry from the list or create a new codex document.
              </p>
              <button
                onClick={handleCreateNewNote}
                className="mt-4 bg-[#E0262B] text-white px-4 py-2 text-xs font-bold font-warrior clip-angular-sm glow-red"
              >
                + NEW CODEX ENTRY
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
