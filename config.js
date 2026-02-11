// Supabase Configuration
// Replace these with your actual Supabase credentials from https://app.supabase.com

const SUPABASE_URL = 'https://chwcuafifndfjtncrugx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNod2N1YWZpZm5kZmp0bmNydWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MDY5MzEsImV4cCI6MjA1MjQ4MjkzMX0.AvXHqQtqmQG9oO4PBWLJ1n3krcZRbvWl3WDc0w1LfTg';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utility functions
function generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getPlayerData() {
    const data = localStorage.getItem('playerData');
    return data ? JSON.parse(data) : null;
}

function savePlayerData(playerId, name, avatarUrl) {
    const data = { playerId, name, avatarUrl };
    localStorage.setItem('playerData', JSON.stringify(data));
    return data;
}

function getCurrentRoom() {
    return localStorage.getItem('currentRoom');
}

function setCurrentRoom(roomCode) {
    localStorage.setItem('currentRoom', roomCode);
}

function clearCurrentRoom() {
    localStorage.removeItem('currentRoom');
}

async function uploadAvatar(playerId, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${playerId}.${fileExt}`;
    
    const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
    
    return publicUrl;
}

// Load scenarios
async function loadScenarios(mode = 'friends') {
    try {
        const response = await fetch('assets/scenarios.txt');
        const text = await response.text();
        const lines = text.split('\n').filter(line => 
            line.trim() && 
            !line.startsWith('#') && 
            line.includes('|')
        );
        
        return lines
            .map(line => {
                const parts = line.split('|').map(p => p.trim());
                if (parts.length >= 3) {
                    return {
                        optionA: parts[0],
                        optionB: parts[1],
                        mode: parts[2]
                    };
                }
                return null;
            })
            .filter(s => s && s.mode === mode);
    } catch (error) {
        console.error('Error loading scenarios:', error);
        return [];
    }
}

// Load charades words
async function loadCharadesWords() {
    try {
        const response = await fetch('assets/charades.txt');
        const text = await response.text();
        return text.split('\n')
            .filter(line => line.trim() && !line.startsWith('#'));
    } catch (error) {
        console.error('Error loading charades words:', error);
        return ['Dog', 'Cat', 'Pizza', 'Dance', 'Sing'];
    }
}

// Load misfit words
async function loadMisfitWords() {
    try {
        const response = await fetch('assets/misfit.txt');
        const text = await response.text();
        return text.split('\n')
            .filter(line => line.trim() && !line.startsWith('#'));
    } catch (error) {
        console.error('Error loading misfit words:', error);
        return ['Apple', 'Banana', 'Ocean', 'Mountain', 'Pizza'];
    }
}
