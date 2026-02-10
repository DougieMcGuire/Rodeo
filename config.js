// Supabase configuration
const SUPABASE_URL = 'https://unxiyhasvyiymgyqgzmd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVueGl5aGFzdnlpeW1neXFnem1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTE3NjUsImV4cCI6MjA4NjMyNzc2NX0.QrLILtXwlAdcabjD-BCaPU4I26oTGDvW_EWdqkKja1I';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate unique player ID
function generatePlayerId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate room code
function generateRoomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Get current player data from localStorage
function getCurrentPlayer() {
    return {
        playerId: localStorage.getItem('playerId'),
        name: localStorage.getItem('playerName'),
        avatarUrl: localStorage.getItem('avatarUrl')
    };
}

// Save player data to localStorage
function savePlayerData(playerId, name, avatarUrl) {
    localStorage.setItem('playerId', playerId);
    localStorage.setItem('playerName', name);
    localStorage.setItem('avatarUrl', avatarUrl);
}
