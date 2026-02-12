// Home screen logic
console.log('home.js loaded');

// Wait for localStorage to be ready (important for PWA/mobile)
function waitForLocalStorage() {
    return new Promise((resolve) => {
        let attempts = 0;
        const check = () => {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                console.log('localStorage is ready');
                resolve();
            } catch (e) {
                attempts++;
                if (attempts < 10) {
                    console.log('Waiting for localStorage...', attempts);
                    setTimeout(check, 100);
                } else {
                    console.error('localStorage not available after 10 attempts');
                    resolve(); // Continue anyway
                }
            }
        };
        check();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, waiting for localStorage...');
    
    // Wait for localStorage to be ready
    await waitForLocalStorage();
    
    console.log('Initializing...');

    let selectedFile = null;
    let playerData = null;
    
    try {
        playerData = getPlayerData();
        console.log('Player data:', playerData);
    } catch (e) {
        console.error('Error loading player data:', e);
    }

    const avatarUpload = document.getElementById('avatarUpload');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    const avatarPreview = document.getElementById('avatarPreview');
    const nameInput = document.getElementById('nameInput');
    const hostBtn = document.getElementById('hostBtn');
    const joinBtn = document.getElementById('joinBtn');
    const joinModal = document.getElementById('joinModal');
    const codeInput = document.getElementById('codeInput');
    const cancelJoinBtn = document.getElementById('cancelJoinBtn');
    const submitJoinBtn = document.getElementById('submitJoinBtn');

    console.log('All elements:', { avatarUpload, nameInput, hostBtn, joinBtn });

    // Load saved data
    if (playerData) {
        nameInput.value = playerData.name || '';
        if (playerData.avatarUrl) {
            avatarPlaceholder.style.display = 'none';
            avatarPreview.src = playerData.avatarUrl;
            avatarPreview.style.display = 'block';
        }
    }

    // Save name to localStorage as user types
    nameInput.addEventListener('input', () => {
        const currentData = getPlayerData() || {};
        currentData.name = nameInput.value;
        localStorage.setItem('playerData', JSON.stringify(currentData));
        console.log('Saved name to localStorage:', currentData);
    });

    // Avatar upload
    avatarUpload.addEventListener('click', () => {
        console.log('Avatar clicked');
        avatarInput.click();
    });

    avatarInput.addEventListener('change', (e) => {
        console.log('File selected');
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = (event) => {
                avatarPlaceholder.style.display = 'none';
                avatarPreview.src = event.target.result;
                avatarPreview.style.display = 'block';
                
                // Save preview to localStorage immediately
                const currentData = getPlayerData() || {};
                currentData.avatarUrl = event.target.result;
                localStorage.setItem('playerData', JSON.stringify(currentData));
                console.log('Saved avatar to localStorage, size:', event.target.result.length);
                
                // Verify it was saved
                setTimeout(() => {
                    const verify = getPlayerData();
                    console.log('Verified save - has avatar:', !!verify?.avatarUrl);
                }, 100);
            };
            reader.readAsDataURL(file);
        }
    });

    // Format room code input
    codeInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
        if (value.length > 6) value = value.substring(0, 6);
        if (value.length > 3) {
            e.target.value = value.substring(0, 3) + ' ' + value.substring(3);
        } else {
            e.target.value = value;
        }
    });

    // Check for QR code join
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    if (joinCode && joinCode.length === 6) {
        codeInput.value = joinCode.substring(0, 3) + ' ' + joinCode.substring(3);
    }

    // Host button - just go to game select, don't create room yet
    hostBtn.addEventListener('click', () => {
        console.log('HOST clicked');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('Please enter your name');
            return;
        }

        // Check if we have an avatar (either preview showing OR saved data)
        const hasAvatar = (avatarPreview.style.display === 'block') || (playerData && playerData.avatarUrl);
        
        if (!hasAvatar) {
            alert('Please select a profile picture');
            return;
        }

        // Generate player ID if we don't have one
        const tempData = getPlayerData() || {};
        if (!tempData.playerId) {
            tempData.playerId = generateId();
        }
        tempData.name = name;
        if (avatarPreview.style.display === 'block') {
            tempData.avatarUrl = avatarPreview.src;
        }
        localStorage.setItem('playerData', JSON.stringify(tempData));
        
        console.log('Saved player data:', tempData);
        
        // Go to game select - room will be created when game is chosen
        window.location.href = 'game-select.html';
    });

    // Join button
    joinBtn.addEventListener('click', () => {
        console.log('JOIN clicked');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('Please enter your name');
            return;
        }

        const hasAvatar = (avatarPreview.style.display === 'block') || (playerData && playerData.avatarUrl);
        
        if (!hasAvatar) {
            alert('Please select a profile picture');
            return;
        }

        joinModal.classList.add('active');
    });

    cancelJoinBtn.addEventListener('click', () => {
        joinModal.classList.remove('active');
    });

    submitJoinBtn.addEventListener('click', async () => {
        console.log('Submit join clicked');
        const name = nameInput.value.trim();
        const code = codeInput.value.replace(/\s/g, '');

        if (!code || code.length !== 6) {
            alert('Please enter a valid 6-digit code');
            return;
        }

        submitJoinBtn.disabled = true;
        submitJoinBtn.textContent = 'JOINING...';

        try {
            console.log('Checking room:', code);
            
            // Check if room exists
            const roomSnapshot = await database.ref('rooms/' + code).once('value');
            
            if (!roomSnapshot.exists()) {
                throw new Error('Room not found');
            }

            const room = roomSnapshot.val();
            console.log('Room found:', room);

            const playerId = generateId();
            let avatarUrl = playerData?.avatarUrl;

            // Upload new avatar if selected
            if (selectedFile) {
                console.log('Uploading avatar...');
                avatarUrl = await uploadAvatar(playerId, selectedFile);
            }

            // Save player data
            savePlayerData(playerId, name, avatarUrl);

            // Get current player count for join order
            const playersSnapshot = await database.ref('rooms/' + code + '/players').once('value');
            const players = playersSnapshot.val() || {};
            const joinOrder = Object.keys(players).length + 1;

            // Add player to room
            await database.ref('rooms/' + code + '/players/' + playerId).set({
                playerId: playerId,
                name: name,
                avatarUrl: avatarUrl,
                joinOrder: joinOrder,
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            });

            console.log('Joined successfully!');
            setCurrentRoom(code);
            
            // Redirect based on room state
            if (room.state === 'game_select') {
                window.location.href = `lobby.html?room=${code}`;
            } else if (room.state === 'playing') {
                window.location.href = `game.html?room=${code}`;
            } else {
                window.location.href = `lobby.html?room=${code}`;
            }

        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room: ' + error.message);
            submitJoinBtn.disabled = false;
            submitJoinBtn.textContent = 'Join';
        }
    });

    console.log('home.js initialization complete');
});