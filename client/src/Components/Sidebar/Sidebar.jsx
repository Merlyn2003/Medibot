import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  XMarkIcon, 
  PlusIcon, 
  PencilIcon,
  MapPinIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  CheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';


const Sidebar = () => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [activeNoteIndex, setActiveNoteIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editNoteIndex, setEditNoteIndex] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem('token');

  const handleNearbyLocation = () => {
    window.open("/address-table", "_blank");
  };

  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:4000/notes', {
          headers: { Authorization: token },
        });
        setNotes(response.data);
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [token]);

  const handleSaveNote = async () => {
    if (!newNote.title.trim() && !newNote.content.trim()) return;
    
    setIsLoading(true);
    try {
      if (isEditing) {
        await axios.put(
          `http://localhost:4000/notes/${notes[editNoteIndex].note_id}`,
          newNote,
          { headers: { Authorization: token } }
        );
      } else {
        await axios.post(
          'http://localhost:4000/notes',
          newNote,
          { headers: { Authorization: token } }
        );
      }

      const response = await axios.get('http://localhost:4000/notes', {
        headers: { Authorization: token },
      });
      setNotes(response.data);
      resetForm();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      setIsLoading(true);
      try {
        await axios.delete(
          `http://localhost:4000/notes/${noteId}`,
          { headers: { Authorization: token } }
        );
        const response = await axios.get('http://localhost:4000/notes', {
          headers: { Authorization: token },
        });
        setNotes(response.data);
        if (activeNoteIndex === editNoteIndex) {
          resetForm();
        }
      } catch (error) {
        console.error('Error deleting note:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetForm = () => {
    setNewNote({ title: '', content: '' });
    setIsAdding(false);
    setIsEditing(false);
    setEditNoteIndex(null);
  };

  const handleViewNote = (index) => {
    setActiveNoteIndex(index === activeNoteIndex ? null : index);
  };

  const handleAddNote = () => {
    setIsAdding(true);
    setNewNote({ title: '', content: '' });
  };

  const handleEditNote = (index, e) => {
    e.stopPropagation();
    setNewNote({ 
      title: notes[index].title,
      content: notes[index].content
    });
    setIsAdding(true);
    setIsEditing(true);
    setEditNoteIndex(index);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

 if (!isSidebarOpen) {
    return (
      <button 
        onClick={toggleSidebar}
        className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-indigo-500 text-white p-2 rounded-r-lg shadow-lg hover:bg-indigo-600 transition-all z-20"
      >
        <ChevronDownIcon className="h-5 w-5 rotate-90" />
      </button>
    );
  }
  return (
    <motion.aside 
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      exit={{ x: -320 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 left-0 w-80 bg-white z-30 border-r border-gray-100 flex flex-col shadow-xl"
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <PencilIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold ">My Notes</h2>
          </div>
          <button
            onClick={toggleSidebar}
            className="text-white/80 bg-transparent hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoading && !isAdding ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence>
              {notes.map((note, index) => (
                <motion.li
                  key={note.note_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-lg hover:shadow-sm transition-all border border-gray-100 overflow-hidden"
                >
                  <div
                    className={`p-3 cursor-pointer ${activeNoteIndex === index ? 'bg-indigo-50/50' : ''}`}
                    onClick={() => handleViewNote(index)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate text-sm">
                          {note.title || 'Untitled Note'}
                        </h3>
                        {activeNoteIndex === index && (
                          <p className="text-gray-500 text-xs mt-1 whitespace-pre-wrap line-clamp-2">
                            {note.content || 'No content'}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => handleEditNote(index, e)}
                          className="text-gray-400 bg-white hover:text-indigo-500 p-1 rounded hover:bg-indigo-50 transition"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteNote(note.note_id, e)}
                          className="text-gray-400 bg-white hover:text-red-500 p-1 rounded hover:bg-red-50 transition"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {activeNoteIndex === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2 pt-2 border-t border-gray-100"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">
                              {new Date(note.created_at).toLocaleDateString()}
                            </span>
                            <button className="text-xs text-indigo-500 hover:text-indigo-700">
                              {activeNoteIndex === index ? (
                                <ChevronUpIcon className="h-3 w-3" />
                              ) : (
                                <ChevronDownIcon className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Add/Edit Note Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="p-4 border-t border-gray-100 bg-white"
          >
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-medium text-gray-700">
                {isEditing ? 'Edit Note' : 'Create New Note'}
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition"
                />
              </div>
              <div>
                <textarea
                  placeholder="Start writing..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  rows="3"
                ></textarea>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNote}
                  disabled={isLoading || (!newNote.title.trim() && !newNote.content.trim())}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition ${
                    isLoading || (!newNote.title.trim() && !newNote.content.trim())
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-500 text-white hover:bg-indigo-600'
                  }`}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckIcon className="h-3.5 w-3.5" />
                      {isEditing ? 'Update' : 'Save'}
                    </>
                  )}
                </button>
                <button
                  onClick={resetForm}
                  className="px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Actions */}
      {!isAdding && (
        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            onClick={handleAddNote}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition"
          >
            <PlusIcon className="h-4 w-4" />
            New Note
          </button>
          <button
            onClick={handleNearbyLocation}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            <MapPinIcon className="h-4 w-4 text-indigo-500" />
            Nearby
          </button>
        </div>
      )}
    </motion.aside>
  );
};


export default Sidebar;