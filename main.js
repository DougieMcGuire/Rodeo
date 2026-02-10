// 🔥 PUT YOUR OWN VALUES HERE (DO NOT SHARE KEYS)
const supabase = supabaseJs.createClient(
  "https://unxiyhasvyiymgyqgzmd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVueGl5aGFzdnlpeW1neXFnem1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTE3NjUsImV4cCI6MjA4NjMyNzc2NX0.QrLILtXwlAdcabjD-BCaPU4I26oTGDvW_EWdqkKja1I"
)

// utils
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

function getPlayer() {
  return {
    id: localStorage.getItem("playerId") || crypto.randomUUID(),
    name: document.getElementById("nameInput")?.value || localStorage.getItem("name"),
    avatar: document.getElementById("avatarInput")?.value || localStorage.getItem("avatar")
  }
}

// HOME
async function hostRoom() {
  const player = getPlayer()
  localStorage.setItem("playerId", player.id)
  localStorage.setItem("name", player.name)
  localStorage.setItem("avatar", player.avatar)

  const roomCode = generateRoomCode()

  await supabase.from("rooms").insert({ id: roomCode })
  await supabase.from("players").insert({
    room_id: roomCode,
    player_id: player.id,
    name: player.name,
    avatar: player.avatar
  })

  window.location.href = `lobby.html?room=${roomCode}`
}

async function joinRoom() {
  const roomCode = document.getElementById("roomInput").value.toUpperCase()
  const player = getPlayer()

  localStorage.setItem("playerId", player.id)
  localStorage.setItem("name", player.name)
  localStorage.setItem("avatar", player.avatar)

  await supabase.from("players").insert({
    room_id: roomCode,
    player_id: player.id,
    name: player.name,
    avatar: player.avatar
  })

  window.location.href = `lobby.html?room=${roomCode}`
}

// LOBBY
const params = new URLSearchParams(window.location.search)
const roomCode = params.get("room")

if (roomCode) {
  document.getElementById("roomCode").innerText = roomCode
  subscribeToPlayers()
}

async function subscribeToPlayers() {
  const list = document.getElementById("playerList")

  const renderPlayers = async () => {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("room_id", roomCode)

    list.innerHTML = ""
    data.forEach(p => {
      const li = document.createElement("li")
      li.innerHTML = `<img src="${p.avatar}" /> ${p.name}`
      list.appendChild(li)
    })
  }

  renderPlayers()

  supabase
    .channel("players")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomCode}` },
      renderPlayers
    )
    .subscribe()
}

async function leaveRoom() {
  const playerId = localStorage.getItem("playerId")

  await supabase
    .from("players")
    .delete()
    .eq("player_id", playerId)
    .eq("room_id", roomCode)

  window.location.href = "index.html"
}
