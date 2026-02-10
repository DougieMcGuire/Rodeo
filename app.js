// Home screen logic
let selectedFile = null;

document.addEventListener('DOMContentLoaded', () => {
    const playerNameInput = document.getElementById('playerName');
    const avatarUploadInput = document.getElementById('avatarUpload');
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const uploadBtnText = document.getElementById('uploadBtnText');
    const avatarPreview = document.getElementById('avatarPreview');
    const previewImg = document.getElementById('previewImg');
    const hostGameBtn = document.getElementById('hostGameBtn');
    const joinGameBtn = document.getElementById('joinGameBtn');
    const roomCodeInput = document.getElementById('roomCode');
    const loadingMessage = document.getElementById('loadingMessage');
    const loadingText = document.getElementById('loadingText');

    // Auto-format room code input
    roomCodeInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '').replace(/\D/g, ''); // Remove spaces and non-digits
        if (value.length > 6) value = value.substr(0, 6);
        if (value.length > 3) {
            e.target.value = value.substr(0, 3) + ' ' + value.substr(3);
        } else {
            e.target.value = value;
        }
    });

    // Check if coming from QR code
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    if (joinCode && joinCode.length === 6) {
        roomCodeInput.value = joinCode.substr(0, 3) + ' ' + joinCode.substr(3);
    }

    // Load saved player data if exists
    const savedName = localStorage.getItem('playerName');
    const savedAvatarUrl = localStorage.getItem('avatarUrl');
    
    if (savedName) {
        playerNameInput.value = savedName;
    }
    
    if (savedAvatarUrl) {
        previewImg.src = savedAvatarUrl;
        avatarPreview.style.display = 'flex';
        uploadBtnText.textContent = 'Change Photo';
        // Create a fake file object so user can still change
        selectedFile = 'existing';
    }

    // Avatar upload
    avatarUploadBtn.addEventListener('click', () => {
        avatarUploadInput.click();
    });

    avatarUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            uploadBtnText.textContent = file.name;
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                avatarPreview.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        }
    });

    // Host game
    hostGameBtn.addEventListener('click', async () => {
        const name = playerNameInput.value.trim();
        
        if (!name) {
            alert('Please enter your name');
            return;
        }

        const savedAvatarUrl = localStorage.getItem('avatarUrl');
        if (!selectedFile && !savedAvatarUrl) {
            alert('Please select a profile picture');
            return;
        }

        showLoading('Creating room...');

        try {
            // Generate IDs
            const playerId = generatePlayerId();
            const roomCode = generateRoomCode();

            // Upload avatar if new file selected, otherwise use saved
            let avatarUrl;
            if (selectedFile && selectedFile !== 'existing') {
                loadingText.textContent = 'Uploading avatar...';
                avatarUrl = await uploadAvatar(playerId, selectedFile);
            } else {
                avatarUrl = savedAvatarUrl;
            }

            // Save player data
            savePlayerData(playerId, name, avatarUrl);

            // Create room
            loadingText.textContent = 'Setting up game...';
            const { error: roomError } = await supabase
                .from('rooms')
                .insert({
                    id: roomCode,
                    host_id: playerId,
                    state: 'lobby',
                    created_at: new Date().toISOString()
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
                    has_submitted: false
                });

            if (playerError) throw playerError;

            // Store room code and redirect
            localStorage.setItem('currentRoom', roomCode);
            window.location.href = `lobby.html?room=${roomCode}`;

        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
            hideLoading();
        }
    });

    // Join game
    joinGameBtn.addEventListener('click', async () => {
        const name = playerNameInput.value.trim();
        const roomCode = roomCodeInput.value.trim().replace(/\s/g, '');

        if (!name) {
            alert('Please enter your name');
            return;
        }

        const savedAvatarUrl = localStorage.getItem('avatarUrl');
        if (!selectedFile && !savedAvatarUrl) {
            alert('Please select a profile picture');
            return;
        }

        if (!roomCode || roomCode.length !== 6) {
            alert('Please enter a valid 6-digit room code');
            return;
        }

        showLoading('Joining room...');

        try {
            // Check if room exists
            const { data: room, error: roomError } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', roomCode)
                .single();

            if (roomError || !room) {
                throw new Error('Room not found');
            }

            // Generate player ID
            const playerId = generatePlayerId();

            // Upload avatar if new file selected, otherwise use saved
            let avatarUrl;
            if (selectedFile && selectedFile !== 'existing') {
                loadingText.textContent = 'Uploading avatar...';
                avatarUrl = await uploadAvatar(playerId, selectedFile);
            } else {
                avatarUrl = savedAvatarUrl;
            }

            // Save player data
            savePlayerData(playerId, name, avatarUrl);

            // Add player to room
            loadingText.textContent = 'Joining game...';
            const { error: playerError } = await supabase
                .from('players')
                .insert({
                    room_id: roomCode,
                    player_id: playerId,
                    name: name,
                    avatar_url: avatarUrl,
                    has_submitted: false
                });

            if (playerError) throw playerError;

            // Store room code and redirect
            localStorage.setItem('currentRoom', roomCode);
            window.location.href = `lobby.html?room=${roomCode}`;

        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room. Please check the code and try again.');
            hideLoading();
        }
    });

    // Upload avatar to Supabase Storage
    async function uploadAvatar(playerId, file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${playerId}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return publicUrl;
    }

    function showLoading(text) {
        loadingText.textContent = text;
        loadingMessage.style.display = 'block';
        hostGameBtn.disabled = true;
        joinGameBtn.disabled = true;
    }

    function hideLoading() {
        loadingMessage.style.display = 'none';
        hostGameBtn.disabled = false;
        joinGameBtn.disabled = false;
    }
});
