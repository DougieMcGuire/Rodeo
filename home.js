// Home screen logic
let selectedFile = null;
let playerData = getPlayerData();

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

// Load saved data
if (playerData) {
    nameInput.value = playerData.name;
    if (playerData.avatarUrl) {
        avatarPlaceholder.style.display = 'none';
        avatarPreview.src = playerData.avatarUrl;
        avatarPreview.style.display = 'block';
    }
}

// Avatar upload
avatarUpload.addEventListener('click', () => {
    avatarInput.click();
});

avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        selectedFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
            avatarPlaceholder.style.display = 'none';
            avatarPreview.src = event.target.result;
            avatarPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Format room code input
codeInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
    if (value.length > 6) value = value.substr(0, 6);
    if (value.length > 3) {
        e.target.value = value.substr(0, 3) + ' ' + value.substr(3);
    } else {
        e.target.value = value;
    }
});

// Check for QR code join
const urlParams = new URLSearchParams(window.location.search);
const joinCode = urlParams.get('join');
if (joinCode) {
    codeInput.value = joinCode.substr(0, 3) + ' ' + joinCode.substr(3);
}

// Host button
hostBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter your name');
        return;
    }

    if (!avatarPreview.src && !playerData?.avatarUrl) {
        alert('Please select a profile picture');
        return;
    }

    hostBtn.disabled = true;
    hostBtn.textContent = 'CREATING...';

    try {
        const playerId = generateId();
        let avatarUrl = playerData?.avatarUrl;

        // Upload new avatar if selected
        if (selectedFile) {
            avatarUrl = await uploadAvatar(playerId, selectedFile);
        }

        // Save player data
        savePlayerData(playerId, name, avatarUrl);

        // Create room
        const roomCode = generateRoomCode();
        const { error: roomError } = await supabase
            .from('rooms')
            .insert({
                id: roomCode,
                host_id: playerId,
                state: 'game_select'
            });

        if (roomError) throw roomError;

        // Add player to room
        const { error: playerError } = await supabase
            .from('players')
            .insert({
                room_id: roomCode,
                player_id: playerId,
                name: name,
                avatar_url: avatarUrl,
                join_order: 1
            });

        if (playerError) throw playerError;

        setCurrentRoom(roomCode);
        window.location.href = `game-select.html?room=${roomCode}`;

    } catch (error) {
        console.error('Error creating room:', error);
        alert('Failed to create room. Please try again.');
        hostBtn.disabled = false;
        hostBtn.textContent = 'HOST';
    }
});

// Join button
joinBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter your name');
        return;
    }

    if (!avatarPreview.src && !playerData?.avatarUrl) {
        alert('Please select a profile picture');
        return;
    }

    joinModal.classList.add('active');
});

cancelJoinBtn.addEventListener('click', () => {
    joinModal.classList.remove('active');
});

submitJoinBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const code = codeInput.value.replace(/\s/g, '');

    if (!code || code.length !== 6) {
        alert('Please enter a valid 6-digit code');
        return;
    }

    submitJoinBtn.disabled = true;
    submitJoinBtn.textContent = 'JOINING...';

    try {
        // Check if room exists
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', code)
            .single();

        if (roomError || !room) {
            throw new Error('Room not found');
        }

        const playerId = generateId();
        let avatarUrl = playerData?.avatarUrl;

        // Upload new avatar if selected
        if (selectedFile) {
            avatarUrl = await uploadAvatar(playerId, selectedFile);
        }

        // Save player data
        savePlayerData(playerId, name, avatarUrl);

        // Get current player count for join order
        const { data: players } = await supabase
            .from('players')
            .select('join_order')
            .eq('room_id', code)
            .order('join_order', { ascending: false })
            .limit(1);

        const joinOrder = players && players.length > 0 ? players[0].join_order + 1 : 1;

        // Add player to room
        const { error: playerError } = await supabase
            .from('players')
            .insert({
                room_id: code,
                player_id: playerId,
                name: name,
                avatar_url: avatarUrl,
                join_order: joinOrder
            });

        if (playerError) throw playerError;

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
        alert('Failed to join room. Please check the code and try again.');
        submitJoinBtn.disabled = false;
        submitJoinBtn.textContent = 'Join';
    }
});
