document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const notesContainer = document.getElementById('notes-container');
    const newNoteBtn = document.getElementById('new-note-btn');
    const editorModal = document.getElementById('editor-modal');
    const closeEditorBtn = document.getElementById('close-editor');
    const saveNoteBtn = document.getElementById('save-note');
    const noteTitleInput = document.getElementById('note-title');
    const noteContentEditable = document.getElementById('note-content');
    const pinNoteBtn = document.getElementById('pin-note');
    const archiveNoteBtn = document.getElementById('archive-note');
    const deleteNoteBtn = document.getElementById('delete-note');
    const noteTagsSelect = document.getElementById('note-tags');
    const wordCountElement = document.querySelector('.word-count');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const formattingTools = document.querySelectorAll('.formatting-tools .btn-icon');
    
    // App State
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    let currentNoteId = null;
    let isDarkMode = localStorage.getItem('darkMode') === 'true';

    // Initialize the app
    function init() {
        applyTheme();
        renderNotes();
        setupEventListeners();
    }

    // Set up event listeners
    function setupEventListeners() {
        newNoteBtn.addEventListener('click', createNewNote);
        closeEditorBtn.addEventListener('click', closeEditor);
        saveNoteBtn.addEventListener('click', saveNote);
        pinNoteBtn.addEventListener('click', togglePinNote);
        archiveNoteBtn.addEventListener('click', toggleArchiveNote);
        deleteNoteBtn.addEventListener('click', deleteCurrentNote);
        themeToggleBtn.addEventListener('click', toggleTheme);
        
        // Formatting tools
        formattingTools.forEach(tool => {
            tool.addEventListener('click', function() {
                const command = this.getAttribute('data-command');
                document.execCommand(command, false, null);
                noteContentEditable.focus();
            });
        });
        
        // Word count
        noteContentEditable.addEventListener('input', updateWordCount);
    }

    // Render all notes
    function renderNotes() {
        notesContainer.innerHTML = '';
        
        if (notes.length === 0) {
            notesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sticky-note"></i>
                    <h3>No Notes Yet</h3>
                    <p>Click the "New Note" button to create your first note</p>
                </div>
            `;
            return;
        }
        
        // Sort pinned notes first
        const sortedNotes = [...notes].sort((a, b) => (b.pinned - a.pinned) || (new Date(b.updatedAt) - new Date(a.updatedAt)));
        
        sortedNotes.forEach(note => {
            if (note.deleted) return;
            
            const noteCard = document.createElement('div');
            noteCard.className = `note-card ${note.pinned ? 'pinned' : ''}`;
            noteCard.innerHTML = `
                <h3>${note.title || 'Untitled Note'}</h3>
                <div class="note-content">${formatNotePreview(note.content)}</div>
                <div class="note-footer">
                    ${note.tag ? `<span class="note-tag ${note.tag}">${note.tag}</span>` : ''}
                    <span>${formatDate(note.updatedAt)}</span>
                </div>
            `;
            
            noteCard.addEventListener('click', () => openEditor(note.id));
            notesContainer.appendChild(noteCard);
        });
    }

    // Format note preview (strip HTML and limit length)
    function formatNotePreview(content) {
        if (!content) return '';
        const div = document.createElement('div');
        div.innerHTML = content;
        const text = div.textContent || div.innerText || '';
        return text.length > 150 ? text.substring(0, 150) + '...' : text;
    }

    // Format date
    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Create a new note
    function createNewNote() {
        currentNoteId = null;
        noteTitleInput.value = '';
        noteContentEditable.innerHTML = '';
        noteTagsSelect.value = '';
        updateWordCount();
        openEditor();
    }

    // Open editor with a note
    function openEditor(noteId = null) {
        if (noteId) {
            const note = notes.find(n => n.id === noteId);
            if (note) {
                currentNoteId = note.id;
                noteTitleInput.value = note.title;
                noteContentEditable.innerHTML = note.content;
                noteTagsSelect.value = note.tag || '';
                pinNoteBtn.innerHTML = note.pinned 
                    ? '<i class="fas fa-bookmark"></i>' 
                    : '<i class="far fa-bookmark"></i>';
                archiveNoteBtn.innerHTML = note.archived 
                    ? '<i class="fas fa-archive"></i>' 
                    : '<i class="fas fa-archive"></i>';
            }
        } else {
            pinNoteBtn.innerHTML = '<i class="far fa-bookmark"></i>';
            archiveNoteBtn.innerHTML = '<i class="fas fa-archive"></i>';
        }
        
        editorModal.classList.add('active');
        noteTitleInput.focus();
    }

    // Close editor
    function closeEditor() {
        editorModal.classList.remove('active');
    }

    // Save note
    function saveNote() {
        const title = noteTitleInput.value.trim();
        const content = noteContentEditable.innerHTML;
        const tag = noteTagsSelect.value;
        
        if (!title && !content) {
            alert('Note cannot be empty');
            return;
        }
        
        if (currentNoteId) {
            // Update existing note
            notes = notes.map(note => 
                note.id === currentNoteId 
                    ? { 
                        ...note, 
                        title, 
                        content, 
                        tag,
                        updatedAt: new Date().toISOString()
                    } 
                    : note
            );
        } else {
            // Create new note
            const newNote = {
                id: Date.now(),
                title,
                content,
                tag,
                pinned: false,
                archived: false,
                deleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            notes.unshift(newNote);
            currentNoteId = newNote.id;
        }
        
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes();
        closeEditor();
    }

    // Toggle pin status
    function togglePinNote() {
        if (!currentNoteId) return;
        
        notes = notes.map(note => 
            note.id === currentNoteId 
                ? { ...note, pinned: !note.pinned } 
                : note
        );
        
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes();
        
        pinNoteBtn.innerHTML = notes.find(n => n.id === currentNoteId).pinned 
            ? '<i class="fas fa-bookmark"></i>' 
            : '<i class="far fa-bookmark"></i>';
    }

    // Toggle archive status
    function toggleArchiveNote() {
        if (!currentNoteId) return;
        
        notes = notes.map(note => 
            note.id === currentNoteId 
                ? { ...note, archived: !note.archived } 
                : note
        );
        
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes();
        closeEditor();
    }

    // Delete current note
    function deleteCurrentNote() {
        if (!currentNoteId || !confirm('Are you sure you want to delete this note?')) return;
        
        notes = notes.map(note => 
            note.id === currentNoteId 
                ? { ...note, deleted: true } 
                : note
        );
        
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes();
        closeEditor();
    }

    // Update word count
    function updateWordCount() {
        const text = noteContentEditable.textContent || '';
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        wordCountElement.textContent = `${wordCount} words`;
    }

    // Toggle theme
    function toggleTheme() {
        isDarkMode = !isDarkMode;
        localStorage.setItem('darkMode', isDarkMode);
        applyTheme();
    }

    // Apply theme
    function applyTheme() {
        if (isDarkMode) {
            document.body.classList.add('dark-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        } else {
            document.body.classList.remove('dark-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        }
    }

    // Initialize the app
    init();
});