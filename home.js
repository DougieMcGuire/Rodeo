// Home screen logic
console.log('home.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');

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

    // Host button
    hostBtn.addEventListener('click', async () => {
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

        hostBtn.disabled = true;
        hostBtn.textContent = 'CREATING...';

        try {
            console.log('Creating room...');
            const playerId = generateId();
            console.log('Player ID:', playerId);
            
            let avatarUrl = playerData?.avatarUrl;

            // Upload new avatar if selected
            if (selectedFile) {
                console.log('Uploading avatar...');
                avatarUrl = await uploadAvatar(playerId, selectedFile);
                console.log('Avatar uploaded:', avatarUrl);
            }

            // Save player data
            savePlayerData(playerId, name, avatarUrl);
            console.log('Player data saved');

            // Create room
            const roomCode = generateRoomCode();
            console.log('Room code:', roomCode);
            
            await db.collection('rooms').doc(roomCode).set({
                hostId: playerId,
                state: 'game_select',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('Room created');

            // Add player to room
            await db.collection('rooms').doc(roomCode).collection('players').doc(playerId).set({
                playerId: playerId,
                name: name,
                avatarUrl: avatarUrl,
                joinOrder: 1,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('Room created successfully!');
            setCurrentRoom(roomCode);
            window.location.href = `game-select.html?room=${roomCode}`;

        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room: ' + error.message);
            hostBtn.disabled = false;
            hostBtn.textContent = 'HOST';
        }
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
            const roomDoc = await db.collection('rooms').doc(code).get();
            
            if (!roomDoc.exists) {
                throw new Error('Room not found');
            }

            const room = roomDoc.data();
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
            const playersSnapshot = await db.collection('rooms').doc(code).collection('players')
                .orderBy('joinOrder', 'desc')
                .limit(1)
                .get();

            const joinOrder = playersSnapshot.empty ? 1 : playersSnapshot.docs[0].data().joinOrder + 1;

            // Add player to room
            await db.collection('rooms').doc(code).collection('players').doc(playerId).set({
                playerId: playerId,
                name: name,
                avatarUrl: avatarUrl,
                joinOrder: joinOrder,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
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
