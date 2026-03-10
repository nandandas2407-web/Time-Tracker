/**
 * ============================================
 * JEE STUDY TRACKER - MAIN APPLICATION
 * A comprehensive study tracking system with timer, analytics, and notes
 * ============================================
 */

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const CONFIG = {
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Bengali', 'English', 'Computer Science'],
    activities: ['Watching Lecture', 'Taking Notes', 'Problem Solving', 'Reading', 'Writing', 'Coding'],
    pomodoro: {
        studyDuration: 50 * 60, // 50 minutes in seconds
        breakDuration: 10 * 60  // 10 minutes in seconds
    },
    storage: {
        auth: 'jee_tracker_auth',
        session: 'jee_tracker_session',
        data: 'jee_tracker_data',
        targets: 'jee_tracker_targets',
        darkMode: 'jee_tracker_darkmode',
        pomodoroMode: 'jee_tracker_pomodoro'
    }
};

// ============================================
// STATE MANAGEMENT
// ============================================

const STATE = {
    // Timer state
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedTime: 0,
    elapsedSeconds: 0,
    timerInterval: null,
    
    // Session state
    currentSubject: '',
    currentActivity: '',
    currentSession: null,
    
    // Pomodoro state
    pomodoroEnabled: false,
    pomodoroPhase: 'study', // 'study' or 'break'
    pomodoroStartTime: null,
    pomodoroInterval: null,
    
    // Page visibility
    isPageVisible: true,
    
    // User data
    username: '',
    studyData: {},
    targets: {}
};

// ============================================
// DOM ELEMENTS
// ============================================

const DOM = {
    // Timer elements
    timerDisplay: document.getElementById('timerDisplay'),
    timerStatus: document.getElementById('timerStatus'),
    focusIndicator: document.getElementById('focusIndicator'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    stopBtn: document.getElementById('stopBtn'),
    
    // Selection elements
    subjectSelect: document.getElementById('subjectSelect'),
    activitySelect: document.getElementById('activitySelect'),
    
    // User elements
    currentUsername: document.getElementById('currentUsername'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Feature toggles
    darkModeToggle: document.getElementById('darkModeToggle'),
    pomodoroToggle: document.getElementById('pomodoroToggle'),
    
    // Pomodoro elements
    pomodoroInfo: document.getElementById('pomodoroInfo'),
    pomodoroPhase: document.getElementById('pomodoroPhase'),
    pomodoroTimer: document.getElementById('pomodoroTimer'),
    pomodoroBar: document.getElementById('pomodoroBar'),
    
    // Stats elements
    todayTotal: document.getElementById('todayTotal'),
    streakCount: document.getElementById('streakCount'),
    
    // Progress elements
    progressSection: document.getElementById('progressSection'),
    setTargetBtn: document.getElementById('setTargetBtn'),
    targetModal: document.getElementById('targetModal'),
    targetForm: document.getElementById('targetForm'),
    closeTargetModal: document.getElementById('closeTargetModal'),
    cancelTargetBtn: document.getElementById('cancelTargetBtn'),
    saveTargetBtn: document.getElementById('saveTargetBtn'),
    
    // Notes elements
    notesMeta: document.getElementById('notesMeta'),
    notesArea: document.getElementById('notesArea'),
    notesCount: document.getElementById('notesCount'),
    saveNotesBtn: document.getElementById('saveNotesBtn'),
    notesHistory: document.getElementById('notesHistory'),
    
    // Analytics elements
    analyticsToday: document.getElementById('analyticsToday'),
    analyticsEfficiency: document.getElementById('analyticsEfficiency'),
    weeklyTotal: document.getElementById('weeklyTotal'),
    dailySubjectBreakdown: document.getElementById('dailySubjectBreakdown'),
    weeklyChart: document.getElementById('weeklyChart'),
    subjectDistribution: document.getElementById('subjectDistribution'),
    activityDistribution: document.getElementById('activityDistribution'),
    
    // Streak elements
    streakNumber: document.getElementById('streakNumber'),
    streakCalendar: document.getElementById('streakCalendar'),
    
    // Quick action elements
    viewDataBtn: document.getElementById('viewDataBtn'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    resetDayBtn: document.getElementById('resetDayBtn'),
    
    // Quick entry elements
    quickHours: document.getElementById('quickHours'),
    quickMinutes: document.getElementById('quickMinutes'),
    quickAddBtn: document.getElementById('quickAddBtn'),
    
    // Reminder elements
    reminderList: document.getElementById('reminderList')
};

// ============================================
// INITIALIZATION
// ============================================

function init() {
    // Check authentication
    if (!checkAuth()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Load user data
    loadUserData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load saved state
    loadSavedState();
    
    // Apply preferences
    applyPreferences();
    
    // Update UI
    updateAllUI();
    
    // Setup page visibility handling
    setupPageVisibility();
    
    // Setup beforeunload protection
    setupUnloadProtection();
    
    // Setup auto-save
    setupAutoSave();
}

/**
 * Check if user is authenticated
 */
function checkAuth() {
    const session = localStorage.getItem(CONFIG.storage.session);
    
    if (!session) {
        return false;
    }
    
    try {
        const sessionData = JSON.parse(session);
        const now = Date.now();
        
        if (sessionData.expiry > now) {
            STATE.username = sessionData.username;
            DOM.currentUsername.textContent = sessionData.username;
            return true;
        }
    } catch (e) {
        console.error('Session validation error:', e);
    }
    
    return false;
}

/**
 * Load user's study data from localStorage
 */
function loadUserData() {
    try {
        const stored = localStorage.getItem(CONFIG.storage.data);
        if (stored) {
            STATE.studyData = JSON.parse(stored);
        } else {
            STATE.studyData = {};
        }
        
        const targets = localStorage.getItem(CONFIG.storage.targets);
        if (targets) {
            STATE.targets = JSON.parse(targets);
        } else {
            STATE.targets = {};
        }
    } catch (e) {
        console.error('Error loading user data:', e);
        STATE.studyData = {};
        STATE.targets = {};
    }
}

/**
 * Save user data to localStorage
 */
function saveUserData() {
    try {
        localStorage.setItem(CONFIG.storage.data, JSON.stringify(STATE.studyData));
        localStorage.setItem(CONFIG.storage.targets, JSON.stringify(STATE.targets));
    } catch (e) {
        console.error('Error saving user data:', e);
        alert('Failed to save data. Storage might be full.');
    }
}

/**
 * Load saved timer state (in case of refresh during active session)
 */
function loadSavedState() {
    const saved = sessionStorage.getItem('timer_state');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            
            // Restore if timer was running less than 5 minutes ago
            const timeSinceLastSave = Date.now() - state.lastSave;
            if (timeSinceLastSave < 5 * 60 * 1000) {
                STATE.currentSubject = state.subject;
                STATE.currentActivity = state.activity;
                STATE.startTime = state.startTime;
                STATE.pausedTime = state.pausedTime;
                
                // Restore selections
                DOM.subjectSelect.value = state.subject;
                DOM.activitySelect.value = state.activity;
                
                // Ask user if they want to resume
                if (confirm('You had an active study session. Resume?')) {
                    resumeTimer();
                } else {
                    sessionStorage.removeItem('timer_state');
                }
            }
        } catch (e) {
            console.error('Error loading saved state:', e);
        }
    }
}

/**
 * Apply user preferences (dark mode, pomodoro)
 */
function applyPreferences() {
    // Dark mode
    const darkMode = localStorage.getItem(CONFIG.storage.darkMode);
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
        DOM.darkModeToggle.querySelector('.icon').textContent = '☀️';
    }
    
    // Pomodoro mode
    const pomodoroMode = localStorage.getItem(CONFIG.storage.pomodoroMode);
    if (pomodoroMode === 'true') {
        STATE.pomodoroEnabled = true;
        DOM.pomodoroToggle.classList.add('active');
        DOM.pomodoroInfo.style.display = 'block';
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Timer controls
    DOM.startBtn.addEventListener('click', startTimer);
    DOM.pauseBtn.addEventListener('click', pauseTimer);
    DOM.stopBtn.addEventListener('click', stopTimer);
    
    // Selection changes
    DOM.subjectSelect.addEventListener('change', handleSelectionChange);
    DOM.activitySelect.addEventListener('change', handleSelectionChange);
    
    // User actions
    DOM.logoutBtn.addEventListener('click', handleLogout);
    DOM.darkModeToggle.addEventListener('click', toggleDarkMode);
    DOM.pomodoroToggle.addEventListener('click', togglePomodoro);
    
    // Target modal
    DOM.setTargetBtn.addEventListener('click', openTargetModal);
    DOM.closeTargetModal.addEventListener('click', closeTargetModal);
    DOM.cancelTargetBtn.addEventListener('click', closeTargetModal);
    DOM.saveTargetBtn.addEventListener('click', saveTargets);
    
    // Click outside modal to close
    DOM.targetModal.addEventListener('click', (e) => {
        if (e.target === DOM.targetModal) {
            closeTargetModal();
        }
    });
    
    // Notes
    DOM.saveNotesBtn.addEventListener('click', saveNotes);
    
    // Keyboard shortcut for saving notes (Ctrl+S)
    DOM.notesArea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveNotes();
        }
    });
    
    // Analytics tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Quick actions
    DOM.viewDataBtn.addEventListener('click', viewAllData);
    DOM.exportDataBtn.addEventListener('click', exportData);
    DOM.resetDayBtn.addEventListener('click', resetToday);
    
    // Quick entry
    DOM.quickAddBtn.addEventListener('click', quickAddTime);
}

// ============================================
// TIMER FUNCTIONS
// ============================================

/**
 * Start the study timer
 */
function startTimer() {
    // Validate selections
    if (!DOM.subjectSelect.value || !DOM.activitySelect.value) {
        alert('Please select both subject and activity before starting.');
        return;
    }
    
    STATE.currentSubject = DOM.subjectSelect.value;
    STATE.currentActivity = DOM.activitySelect.value;
    
    if (!STATE.isRunning) {
        // Starting fresh
        STATE.startTime = Date.now() - (STATE.pausedTime * 1000);
        STATE.isRunning = true;
        STATE.isPaused = false;
        
        // Start pomodoro if enabled
        if (STATE.pomodoroEnabled) {
            startPomodoro();
        }
    } else if (STATE.isPaused) {
        // Resuming from pause
        STATE.startTime = Date.now() - (STATE.pausedTime * 1000);
        STATE.isPaused = false;
    }
    
    // Update UI
    updateTimerUI();
    
    // Start interval
    STATE.timerInterval = setInterval(updateTimer, 1000);
    
    // Update button states
    DOM.startBtn.disabled = true;
    DOM.pauseBtn.disabled = false;
    DOM.stopBtn.disabled = false;
    
    // Disable selection changes during timer
    DOM.subjectSelect.disabled = true;
    DOM.activitySelect.disabled = true;
    
    // Enable notes
    DOM.notesArea.disabled = false;
    DOM.saveNotesBtn.disabled = false;
    
    // Update notes context
    updateNotesContext();
    
    // Save state
    saveTimerState();
}

/**
 * Pause the timer
 */
function pauseTimer() {
    if (!STATE.isRunning || STATE.isPaused) return;
    
    STATE.isPaused = true;
    STATE.pausedTime = Math.floor((Date.now() - STATE.startTime) / 1000);
    
    clearInterval(STATE.timerInterval);
    
    // Pause pomodoro
    if (STATE.pomodoroEnabled) {
        pausePomodoro();
    }
    
    updateTimerUI();
    
    // Update buttons
    DOM.startBtn.disabled = false;
    DOM.pauseBtn.disabled = true;
    
    saveTimerState();
}

/**
 * Stop the timer and save the session
 */
function stopTimer() {
    if (!STATE.isRunning) return;
    
    // Calculate final time
    const endTime = STATE.isPaused ? STATE.pausedTime : Math.floor((Date.now() - STATE.startTime) / 1000);
    
    // Save the study session
    saveStudySession(endTime);
    
    // Auto-save notes if any
    if (DOM.notesArea.value.trim()) {
        saveNotes();
    }
    
    // Reset state
    resetTimerState();
    
    // Update UI
    updateAllUI();
    
    // Clear saved state
    sessionStorage.removeItem('timer_state');
}

/**
 * Resume timer from saved state
 */
function resumeTimer() {
    STATE.isRunning = true;
    STATE.isPaused = false;
    
    // Calculate elapsed time
    STATE.startTime = Date.now() - (STATE.pausedTime * 1000);
    
    // Start interval
    STATE.timerInterval = setInterval(updateTimer, 1000);
    
    // Update UI
    updateTimerUI();
    
    // Update buttons
    DOM.startBtn.disabled = true;
    DOM.pauseBtn.disabled = false;
    DOM.stopBtn.disabled = false;
    DOM.subjectSelect.disabled = true;
    DOM.activitySelect.disabled = true;
    
    // Enable notes
    DOM.notesArea.disabled = false;
    DOM.saveNotesBtn.disabled = false;
    updateNotesContext();
}

/**
 * Reset timer state
 */
function resetTimerState() {
    STATE.isRunning = false;
    STATE.isPaused = false;
    STATE.startTime = null;
    STATE.pausedTime = 0;
    STATE.elapsedSeconds = 0;
    STATE.currentSubject = '';
    STATE.currentActivity = '';
    
    clearInterval(STATE.timerInterval);
    
    if (STATE.pomodoroEnabled) {
        stopPomodoro();
    }
    
    // Reset UI
    DOM.timerDisplay.textContent = '00:00:00';
    DOM.timerStatus.textContent = 'Ready';
    DOM.focusIndicator.classList.remove('active');
    
    // Reset buttons
    DOM.startBtn.disabled = false;
    DOM.pauseBtn.disabled = true;
    DOM.stopBtn.disabled = true;
    
    // Enable selections
    DOM.subjectSelect.disabled = false;
    DOM.activitySelect.disabled = false;
    
    // Disable notes
    DOM.notesArea.disabled = true;
    DOM.notesArea.value = '';
    DOM.saveNotesBtn.disabled = true;
    DOM.notesMeta.querySelector('.notes-context').textContent = 'No active session';
}

/**
 * Update timer display every second
 */
function updateTimer() {
    if (!STATE.isRunning || STATE.isPaused) return;
    
    STATE.elapsedSeconds = Math.floor((Date.now() - STATE.startTime) / 1000);
    displayTime(STATE.elapsedSeconds);
    
    // Save state periodically (every 10 seconds)
    if (STATE.elapsedSeconds % 10 === 0) {
        saveTimerState();
    }
}

/**
 * Display time in HH:MM:SS format
 */
function displayTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    DOM.timerDisplay.textContent = 
        `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

/**
 * Pad number with leading zero
 */
function pad(num) {
    return num.toString().padStart(2, '0');
}

/**
 * Update timer UI status
 */
function updateTimerUI() {
    if (STATE.isRunning && !STATE.isPaused) {
        DOM.timerStatus.textContent = 'Running';
        DOM.timerStatus.style.background = 'rgba(16, 185, 129, 0.2)';
        DOM.focusIndicator.classList.add('active');
    } else if (STATE.isPaused) {
        DOM.timerStatus.textContent = 'Paused';
        DOM.timerStatus.style.background = 'rgba(245, 158, 11, 0.2)';
        DOM.focusIndicator.classList.remove('active');
    } else {
        DOM.timerStatus.textContent = 'Ready';
        DOM.timerStatus.style.background = 'rgba(255, 255, 255, 0.2)';
        DOM.focusIndicator.classList.remove('active');
    }
}

/**
 * Save timer state to sessionStorage
 */
function saveTimerState() {
    const state = {
        subject: STATE.currentSubject,
        activity: STATE.currentActivity,
        startTime: STATE.startTime,
        pausedTime: STATE.pausedTime,
        lastSave: Date.now()
    };
    
    sessionStorage.setItem('timer_state', JSON.stringify(state));
}

// ============================================
// DATA PERSISTENCE
// ============================================

/**
 * Save study session to data structure
 * Structure: Date → Subject → Activity → { time, notes[] }
 */
function saveStudySession(durationSeconds) {
    const today = getDateKey();
    
    // Initialize structure if needed
    if (!STATE.studyData[today]) {
        STATE.studyData[today] = {};
    }
    
    if (!STATE.studyData[today][STATE.currentSubject]) {
        STATE.studyData[today][STATE.currentSubject] = {};
    }
    
    if (!STATE.studyData[today][STATE.currentSubject][STATE.currentActivity]) {
        STATE.studyData[today][STATE.currentSubject][STATE.currentActivity] = {
            time: 0,
            notes: []
        };
    }
    
    // Add time
    STATE.studyData[today][STATE.currentSubject][STATE.currentActivity].time += durationSeconds;
    
    // Save to localStorage
    saveUserData();
    
    // Show notification
    const minutes = Math.floor(durationSeconds / 60);
    showNotification(`✅ Saved ${minutes} minutes of ${STATE.currentActivity} in ${STATE.currentSubject}`);
}

/**
 * Get current date key (YYYY-MM-DD)
 */
function getDateKey(date = new Date()) {
    return date.toISOString().split('T')[0];
}

/**
 * Format seconds to readable time
 */
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

// ============================================
// NOTES SYSTEM
// ============================================

/**
 * Save notes for current session
 */
function saveNotes() {
    const noteText = DOM.notesArea.value.trim();
    
    if (!noteText) {
        alert('Please enter some notes to save.');
        return;
    }
    
    if (!STATE.currentSubject || !STATE.currentActivity) {
        alert('No active session. Start the timer first.');
        return;
    }
    
    const today = getDateKey();
    
    // Ensure data structure exists
    if (!STATE.studyData[today]) {
        STATE.studyData[today] = {};
    }
    if (!STATE.studyData[today][STATE.currentSubject]) {
        STATE.studyData[today][STATE.currentSubject] = {};
    }
    if (!STATE.studyData[today][STATE.currentSubject][STATE.currentActivity]) {
        STATE.studyData[today][STATE.currentSubject][STATE.currentActivity] = {
            time: 0,
            notes: []
        };
    }
    
    // Add note with timestamp
    const note = {
        text: noteText,
        timestamp: new Date().toISOString()
    };
    
    STATE.studyData[today][STATE.currentSubject][STATE.currentActivity].notes.push(note);
    
    // Save
    saveUserData();
    
    // Clear textarea
    DOM.notesArea.value = '';
    
    // Update UI
    updateNotesDisplay();
    showNotification('📝 Note saved successfully!');
}

/**
 * Update notes context display
 */
function updateNotesContext() {
    const context = `${STATE.currentSubject} - ${STATE.currentActivity} (${getDateKey()})`;
    DOM.notesMeta.querySelector('.notes-context').textContent = context;
}

/**
 * Update notes display
 */
function updateNotesDisplay() {
    const today = getDateKey();
    let totalNotes = 0;
    
    // Count today's notes
    if (STATE.studyData[today]) {
        for (const subject in STATE.studyData[today]) {
            for (const activity in STATE.studyData[today][subject]) {
                totalNotes += STATE.studyData[today][subject][activity].notes.length;
            }
        }
    }
    
    DOM.notesCount.textContent = `${totalNotes} note${totalNotes !== 1 ? 's' : ''} saved today`;
    
    // Display recent notes
    displayNotesHistory();
}

/**
 * Display notes history for today
 */
function displayNotesHistory() {
    const today = getDateKey();
    const notes = [];
    
    if (STATE.studyData[today]) {
        for (const subject in STATE.studyData[today]) {
            for (const activity in STATE.studyData[today][subject]) {
                const sessionNotes = STATE.studyData[today][subject][activity].notes;
                sessionNotes.forEach(note => {
                    notes.push({
                        ...note,
                        subject,
                        activity
                    });
                });
            }
        }
    }
    
    // Sort by timestamp (newest first)
    notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Display
    if (notes.length === 0) {
        DOM.notesHistory.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 1rem;">No notes yet today</p>';
        return;
    }
    
    DOM.notesHistory.innerHTML = notes.slice(0, 5).map(note => {
        const time = new Date(note.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="note-item">
                <div class="note-header">
                    <span>${note.subject} - ${note.activity}</span>
                    <span>${time}</span>
                </div>
                <div class="note-content">${escapeHtml(note.text)}</div>
            </div>
        `;
    }).join('');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// PROGRESS & TARGETS
// ============================================

/**
 * Handle selection change
 */
function handleSelectionChange() {
    updateProgressDisplay();
}

/**
 * Update progress display
 */
function updateProgressDisplay() {
    const subject = DOM.subjectSelect.value;
    const activity = DOM.activitySelect.value;
    
    if (!subject || !activity) {
        DOM.progressSection.innerHTML = `
            <div class="progress-placeholder">
                <span class="icon-large">🎯</span>
                <p>Select subject and activity to see progress</p>
            </div>
        `;
        return;
    }
    
    const today = getDateKey();
    const targetKey = `${subject}:${activity}`;
    const target = STATE.targets[targetKey] || 3600; // Default 1 hour
    
    let currentTime = 0;
    if (STATE.studyData[today] && 
        STATE.studyData[today][subject] && 
        STATE.studyData[today][subject][activity]) {
        currentTime = STATE.studyData[today][subject][activity].time;
    }
    
    const percentage = Math.min(100, Math.round((currentTime / target) * 100));
    
    DOM.progressSection.innerHTML = `
        <div class="progress-item">
            <div class="progress-header">
                <span class="progress-label">${subject} - ${activity}</span>
                <span class="progress-text">${formatTime(currentTime)} / ${formatTime(target)}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${percentage}%">
                    <span class="progress-percentage">${percentage}%</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Open target setting modal
 */
function openTargetModal() {
    // Generate form for all subject-activity combinations
    let html = '';
    
    CONFIG.subjects.forEach(subject => {
        CONFIG.activities.forEach(activity => {
            const key = `${subject}:${activity}`;
            const currentTarget = STATE.targets[key] || 3600;
            const hours = Math.floor(currentTarget / 3600);
            const minutes = Math.floor((currentTarget % 3600) / 60);
            
            html += `
                <div class="target-group">
                    <label>${subject} - ${activity}</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="number" 
                               min="0" 
                               max="12" 
                               value="${hours}" 
                               data-key="${key}" 
                               data-type="hours" 
                               placeholder="Hours"
                               style="flex: 1">
                        <input type="number" 
                               min="0" 
                               max="59" 
                               value="${minutes}" 
                               data-key="${key}" 
                               data-type="minutes" 
                               placeholder="Minutes"
                               style="flex: 1">
                    </div>
                </div>
            `;
        });
    });
    
    DOM.targetForm.innerHTML = html;
    DOM.targetModal.classList.add('active');
}

/**
 * Close target modal
 */
function closeTargetModal() {
    DOM.targetModal.classList.remove('active');
}

/**
 * Save targets
 */
function saveTargets() {
    const inputs = DOM.targetForm.querySelectorAll('input');
    const newTargets = {};
    
    inputs.forEach(input => {
        const key = input.dataset.key;
        const type = input.dataset.type;
        const value = parseInt(input.value) || 0;
        
        if (!newTargets[key]) {
            newTargets[key] = 0;
        }
        
        if (type === 'hours') {
            newTargets[key] += value * 3600;
        } else {
            newTargets[key] += value * 60;
        }
    });
    
    STATE.targets = newTargets;
    saveUserData();
    
    closeTargetModal();
    updateProgressDisplay();
    showNotification('🎯 Targets updated successfully!');
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Update all UI components
 */
function updateAllUI() {
    updateStats();
    updateProgressDisplay();
    updateNotesDisplay();
    updateAnalytics();
    updateStreak();
}

/**
 * Update quick stats
 */
function updateStats() {
    const today = getDateKey();
    let totalToday = 0;
    
    if (STATE.studyData[today]) {
        for (const subject in STATE.studyData[today]) {
            for (const activity in STATE.studyData[today][subject]) {
                totalToday += STATE.studyData[today][subject][activity].time;
            }
        }
    }
    
    DOM.todayTotal.textContent = formatTime(totalToday);
    DOM.analyticsToday.textContent = formatTime(totalToday);
    
    // Calculate efficiency (problem-solving vs lectures)
    let problemSolvingTime = 0;
    let lectureTime = 0;
    
    if (STATE.studyData[today]) {
        for (const subject in STATE.studyData[today]) {
            if (STATE.studyData[today][subject]['Problem Solving']) {
                problemSolvingTime += STATE.studyData[today][subject]['Problem Solving'].time;
            }
            if (STATE.studyData[today][subject]['Watching Lecture']) {
                lectureTime += STATE.studyData[today][subject]['Watching Lecture'].time;
            }
        }
    }
    
    const efficiency = lectureTime > 0 ? Math.round((problemSolvingTime / lectureTime) * 100) : 0;
    DOM.analyticsEfficiency.textContent = `${efficiency}%`;
}

/**
 * Update analytics displays
 */
function updateAnalytics() {
    updateDailyAnalytics();
    updateWeeklyAnalytics();
    updateDistribution();
}

/**
 * Update daily subject breakdown
 */
function updateDailyAnalytics() {
    const today = getDateKey();
    const subjectTotals = {};
    
    if (STATE.studyData[today]) {
        for (const subject in STATE.studyData[today]) {
            subjectTotals[subject] = 0;
            for (const activity in STATE.studyData[today][subject]) {
                subjectTotals[subject] += STATE.studyData[today][subject][activity].time;
            }
        }
    }
    
    // Find max for scaling
    const maxTime = Math.max(...Object.values(subjectTotals), 1);
    
    // Generate bars
    const html = CONFIG.subjects.map(subject => {
        const time = subjectTotals[subject] || 0;
        const percentage = (time / maxTime) * 100;
        
        return `
            <div class="subject-bar-item">
                <span class="subject-name">${subject}</span>
                <div class="subject-bar">
                    <div class="subject-bar-fill" style="width: ${percentage}%">
                        ${time > 0 ? `<span class="subject-time">${formatTime(time)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    DOM.dailySubjectBreakdown.innerHTML = html || '<p style="color: var(--text-tertiary); text-align: center;">No data yet today</p>';
}

/**
 * Update weekly analytics
 */
function updateWeeklyAnalytics() {
    const days = [];
    let weeklyTotal = 0;
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = getDateKey(date);
        
        let dayTotal = 0;
        if (STATE.studyData[key]) {
            for (const subject in STATE.studyData[key]) {
                for (const activity in STATE.studyData[key][subject]) {
                    dayTotal += STATE.studyData[key][subject][activity].time;
                }
            }
        }
        
        weeklyTotal += dayTotal;
        days.push({
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
            time: dayTotal
        });
    }
    
    DOM.weeklyTotal.textContent = formatTime(weeklyTotal);
    
    // Find max for scaling
    const maxTime = Math.max(...days.map(d => d.time), 1);
    
    // Generate chart
    const html = days.map(day => {
        const heightPercent = (day.time / maxTime) * 100;
        
        return `
            <div class="day-bar">
                <div class="day-label">${day.label}</div>
                <div class="day-bar-container">
                    ${day.time > 0 ? `<span class="day-time">${formatTime(day.time)}</span>` : ''}
                    <div class="day-bar-fill" style="height: ${heightPercent}%"></div>
                </div>
            </div>
        `;
    }).join('');
    
    DOM.weeklyChart.innerHTML = html;
}

/**
 * Update distribution analytics
 */
function updateDistribution() {
    const today = getDateKey();
    const subjectTotals = {};
    const activityTotals = {};
    
    if (STATE.studyData[today]) {
        for (const subject in STATE.studyData[today]) {
            subjectTotals[subject] = 0;
            for (const activity in STATE.studyData[today][subject]) {
                const time = STATE.studyData[today][subject][activity].time;
                subjectTotals[subject] += time;
                activityTotals[activity] = (activityTotals[activity] || 0) + time;
            }
        }
    }
    
    // Subject distribution
    let subjectHtml = '';
    for (const subject in subjectTotals) {
        subjectHtml += `
            <div class="distribution-item">
                <span class="distribution-name">${subject}</span>
                <span class="distribution-value">${formatTime(subjectTotals[subject])}</span>
            </div>
        `;
    }
    DOM.subjectDistribution.innerHTML = subjectHtml || '<p style="color: var(--text-tertiary); text-align: center;">No data</p>';
    
    // Activity distribution
    let activityHtml = '';
    for (const activity in activityTotals) {
        activityHtml += `
            <div class="distribution-item">
                <span class="distribution-name">${activity}</span>
                <span class="distribution-value">${formatTime(activityTotals[activity])}</span>
            </div>
        `;
    }
    DOM.activityDistribution.innerHTML = activityHtml || '<p style="color: var(--text-tertiary); text-align: center;">No data</p>';
}

/**
 * Switch analytics tab
 */
function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// ============================================
// STREAK TRACKING
// ============================================

/**
 * Update study streak
 */
function updateStreak() {
    let streak = 0;
    const today = new Date();
    
    // Count consecutive days with study data
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const key = getDateKey(date);
        
        if (STATE.studyData[key]) {
            let hasData = false;
            for (const subject in STATE.studyData[key]) {
                for (const activity in STATE.studyData[key][subject]) {
                    if (STATE.studyData[key][subject][activity].time > 0) {
                        hasData = true;
                        break;
                    }
                }
                if (hasData) break;
            }
            
            if (hasData) {
                streak++;
            } else if (i > 0) {
                // Break streak if day has no data (but allow today to be empty)
                break;
            }
        } else if (i > 0) {
            break;
        }
    }
    
    DOM.streakNumber.textContent = streak;
    DOM.streakCount.textContent = `${streak} 🔥`;
    
    // Update calendar
    updateStreakCalendar();
}

/**
 * Update streak calendar (last 7 days)
 */
function updateStreakCalendar() {
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = getDateKey(date);
        
        let hasData = false;
        if (STATE.studyData[key]) {
            for (const subject in STATE.studyData[key]) {
                for (const activity in STATE.studyData[key][subject]) {
                    if (STATE.studyData[key][subject][activity].time > 0) {
                        hasData = true;
                        break;
                    }
                }
                if (hasData) break;
            }
        }
        
        days.push({
            label: date.getDate(),
            active: hasData
        });
    }
    
    DOM.streakCalendar.innerHTML = days.map(day => 
        `<div class="streak-day ${day.active ? 'active' : ''}">${day.label}</div>`
    ).join('');
}

// ============================================
// POMODORO MODE
// ============================================

/**
 * Toggle pomodoro mode
 */
function togglePomodoro() {
    STATE.pomodoroEnabled = !STATE.pomodoroEnabled;
    localStorage.setItem(CONFIG.storage.pomodoroMode, STATE.pomodoroEnabled);
    
    if (STATE.pomodoroEnabled) {
        DOM.pomodoroToggle.classList.add('active');
        DOM.pomodoroInfo.style.display = 'block';
    } else {
        DOM.pomodoroToggle.classList.remove('active');
        DOM.pomodoroInfo.style.display = 'none';
        stopPomodoro();
    }
}

/**
 * Start pomodoro timer
 */
function startPomodoro() {
    STATE.pomodoroPhase = 'study';
    STATE.pomodoroStartTime = Date.now();
    
    updatePomodoroDisplay();
    
    STATE.pomodoroInterval = setInterval(() => {
        updatePomodoroDisplay();
    }, 1000);
}

/**
 * Pause pomodoro
 */
function pausePomodoro() {
    clearInterval(STATE.pomodoroInterval);
}

/**
 * Stop pomodoro
 */
function stopPomodoro() {
    clearInterval(STATE.pomodoroInterval);
    STATE.pomodoroPhase = 'study';
    STATE.pomodoroStartTime = null;
    DOM.pomodoroTimer.textContent = '50:00';
    DOM.pomodoroBar.style.width = '0%';
}

/**
 * Update pomodoro display
 */
function updatePomodoroDisplay() {
    if (!STATE.pomodoroStartTime) return;
    
    const elapsed = Math.floor((Date.now() - STATE.pomodoroStartTime) / 1000);
    const duration = STATE.pomodoroPhase === 'study' ? 
        CONFIG.pomodoro.studyDuration : 
        CONFIG.pomodoro.breakDuration;
    
    const remaining = Math.max(0, duration - elapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    DOM.pomodoroTimer.textContent = `${pad(minutes)}:${pad(seconds)}`;
    
    const progress = ((duration - remaining) / duration) * 100;
    DOM.pomodoroBar.style.width = `${progress}%`;
    
    // Switch phases
    if (remaining === 0) {
        if (STATE.pomodoroPhase === 'study') {
            STATE.pomodoroPhase = 'break';
            STATE.pomodoroStartTime = Date.now();
            DOM.pomodoroPhase.textContent = 'Break Time';
            showNotification('🍅 Time for a break!');
            
            // Auto-pause timer
            if (STATE.isRunning) {
                pauseTimer();
            }
        } else {
            STATE.pomodoroPhase = 'study';
            STATE.pomodoroStartTime = Date.now();
            DOM.pomodoroPhase.textContent = 'Study Phase';
            showNotification('🍅 Back to studying!');
        }
    }
    
    DOM.pomodoroPhase.textContent = STATE.pomodoroPhase === 'study' ? 'Study Phase' : 'Break Time';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    localStorage.setItem(CONFIG.storage.darkMode, isDark);
    DOM.darkModeToggle.querySelector('.icon').textContent = isDark ? '☀️' : '🌙';
}

/**
 * Handle logout
 */
function handleLogout() {
    if (STATE.isRunning) {
        if (!confirm('You have an active session. Stop timer and logout?')) {
            return;
        }
        stopTimer();
    }
    
    localStorage.removeItem(CONFIG.storage.session);
    sessionStorage.clear();
    window.location.href = 'index.html';
}

/**
 * Show notification
 */
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--bg-primary);
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 16px var(--shadow);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyle);

/**
 * View all data (debugging/transparency)
 */
function viewAllData() {
    const dataStr = JSON.stringify(STATE.studyData, null, 2);
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head><title>Study Data</title></head>
        <body style="font-family: monospace; padding: 20px; background: #1f2937; color: #f9fafb;">
        <h2>Your Study Data</h2>
        <pre>${dataStr}</pre>
        </body>
        </html>
    `);
}

/**
 * Export data as JSON
 */
function exportData() {
    const dataStr = JSON.stringify({
        studyData: STATE.studyData,
        targets: STATE.targets,
        exportDate: new Date().toISOString()
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jee-study-data-${getDateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('📥 Data exported successfully!');
}

/**
 * Reset today's data
 */
function resetToday() {
    if (!confirm('Are you sure you want to reset all data for today? This cannot be undone.')) {
        return;
    }
    
    const today = getDateKey();
    delete STATE.studyData[today];
    saveUserData();
    updateAllUI();
    
    showNotification('🔄 Today\'s data has been reset');
}

/**
 * Quick add time manually (for when you studied without the timer)
 */
function quickAddTime() {
    const subject = DOM.subjectSelect.value;
    const activity = DOM.activitySelect.value;
    const hours = parseFloat(DOM.quickHours.value) || 0;
    const minutes = parseInt(DOM.quickMinutes.value) || 0;
    
    // Validate inputs
    if (!subject || !activity) {
        alert('Please select both subject and activity first.');
        DOM.subjectSelect.focus();
        return;
    }
    
    if (hours === 0 && minutes === 0) {
        alert('Please enter hours and/or minutes.');
        DOM.quickHours.focus();
        return;
    }
    
    if (hours > 12) {
        alert('Maximum 12 hours can be added at once.');
        return;
    }
    
    if (minutes > 59) {
        alert('Minutes must be between 0 and 59.');
        return;
    }
    
    // Calculate total seconds
    const totalSeconds = (hours * 3600) + (minutes * 60);
    
    // Add to data
    const today = getDateKey();
    
    if (!STATE.studyData[today]) {
        STATE.studyData[today] = {};
    }
    
    if (!STATE.studyData[today][subject]) {
        STATE.studyData[today][subject] = {};
    }
    
    if (!STATE.studyData[today][subject][activity]) {
        STATE.studyData[today][subject][activity] = {
            time: 0,
            notes: []
        };
    }
    
    STATE.studyData[today][subject][activity].time += totalSeconds;
    
    // Save
    saveUserData();
    
    // Clear inputs
    DOM.quickHours.value = '';
    DOM.quickMinutes.value = '';
    
    // Update UI
    updateAllUI();
    
    // Show notification
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    showNotification(`✅ Added ${timeStr} to ${subject} - ${activity}`);
}

/**
 * Setup page visibility handling (auto-pause when tab inactive)
 */
function setupPageVisibility() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            STATE.isPageVisible = false;
            if (STATE.isRunning && !STATE.isPaused) {
                // Auto-pause when tab becomes hidden
                pauseTimer();
                showNotification('⏸️ Timer auto-paused (tab inactive)');
            }
        } else {
            STATE.isPageVisible = true;
        }
    });
}

/**
 * Setup beforeunload protection
 */
function setupUnloadProtection() {
    window.addEventListener('beforeunload', (e) => {
        if (STATE.isRunning) {
            // Save current state
            saveTimerState();
            
            // Show confirmation
            e.preventDefault();
            e.returnValue = 'You have an active study session. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
}

/**
 * Setup auto-save (every 30 seconds)
 */
function setupAutoSave() {
    setInterval(() => {
        if (STATE.isRunning) {
            saveTimerState();
        }
    }, 30000);
}

// ============================================
// INITIALIZE APPLICATION
// ============================================

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
