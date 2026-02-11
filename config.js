// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBaJXCqGmUaGumvcWNE7w4FOOzTJVDH-yg",
    authDomain: "polorfriends.firebaseapp.com",
    projectId: "polorfriends",
    storageBucket: "polorfriends.firebasestorage.app",
    messagingSenderId: "328546525972",
    appId: "1:328546525972:web:a6fe0f0a45b4565a7b1801",
    measurementId: "G-07B4713DQQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

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
    const fileName = `avatars/${playerId}.${fileExt}`;
    
    const storageRef = storage.ref(fileName);
    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    
    return downloadURL;
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

console.log('Firebase config loaded');
