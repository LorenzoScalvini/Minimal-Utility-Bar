const { ipcRenderer } = require('electron');

// Clock update function
function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  document.getElementById('clock').textContent = `${displayHours}:${minutes} ${ampm}`;
}

// Date update function
function updateDate() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[now.getDay()];
  const day = now.getDate();
  const month = months[now.getMonth()];
  
  document.getElementById('date').textContent = `${dayName}, ${month} ${day}`;
}

// Spotify info update function
async function updateSpotifyInfo() {
  try {
    const spotifyInfo = await ipcRenderer.invoke('get-spotify-info');
    const spotifyElement = document.getElementById('spotify-info');
    
    if (spotifyInfo && spotifyInfo !== 'Paused') {
      // Parse "Artist - Song" format
      const parts = spotifyInfo.split(' - ');
      if (parts.length >= 2) {
        const artist = parts[0];
        const song = parts[1];
        spotifyElement.innerHTML = `<span class="spotify-icon">♪</span> ${artist} - ${song}`;
      } else {
        spotifyElement.innerHTML = `<span class="spotify-icon">♪</span> ${spotifyInfo}`;
      }
      spotifyElement.style.display = 'flex';
    } else if (spotifyInfo === 'Paused') {
      spotifyElement.innerHTML = '<span class="spotify-icon">♪</span> Paused';
      spotifyElement.style.display = 'flex';
    } else {
      spotifyElement.style.display = 'none';
    }
  } catch (error) {
    console.error('Error updating Spotify info:', error);
    document.getElementById('spotify-info').style.display = 'none';
  }
}

// Pomodoro timer
let pomodoroTime = 25 * 60; // 25 minutes in seconds
let breakTime = 5 * 60; // 5 minutes in seconds
let pomodoroInterval = null;
let isRunning = false;
let isBreakTime = false;

function updatePomodoroDisplay() {
  const minutes = Math.floor(pomodoroTime / 60);
  const seconds = pomodoroTime % 60;
  document.getElementById('pomodoro-time').textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Show skip button only during work session
  document.getElementById('pomodoro-skip').style.display = !isBreakTime ? 'block' : 'none';
}

function startPomodoro() {
  if (!isRunning) {
    isRunning = true;
    document.getElementById('pomodoro-toggle').textContent = '⏸';
    pomodoroInterval = setInterval(() => {
      if (pomodoroTime > 0) {
        pomodoroTime--;
        updatePomodoroDisplay();
      } else {
        // Timer finished
        stopPomodoro();
        
        if (!isBreakTime) {
          // Work session finished, start break
          isBreakTime = true;
          pomodoroTime = breakTime;
          alert('Pomodoro finished! Starting 5-minute break.');
          startPomodoro();
        } else {
          // Break finished, reset to work session
          isBreakTime = false;
          resetPomodoro();
          alert('Break finished! Starting new work session.');
          startPomodoro();
        }
      }
    }, 1000);
  }
}

function stopPomodoro() {
  isRunning = false;
  document.getElementById('pomodoro-toggle').textContent = '▶';
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
  }
}

function resetPomodoro() {
  stopPomodoro();
  isBreakTime = false;
  pomodoroTime = 25 * 60;
  updatePomodoroDisplay();
}

function skipToBreak() {
  if (!isBreakTime && isRunning) {
    stopPomodoro();
    isBreakTime = true;
    pomodoroTime = breakTime;
    alert('Skipping to break time.');
    startPomodoro();
  }
}

// Mouse events handling for transparency
document.addEventListener('DOMContentLoaded', () => {
  // Initialize displays
  updateClock();
  updateDate();
  updateSpotifyInfo();
  updatePomodoroDisplay();
  
  // Set up intervals
  setInterval(updateClock, 1000);
  setInterval(updateDate, 60000); // Update date every minute
  setInterval(updateSpotifyInfo, 1000); // Update Spotify info every second
  
  // Pomodoro controls
  document.getElementById('pomodoro-toggle').addEventListener('click', () => {
    if (isRunning) {
      stopPomodoro();
    } else {
      startPomodoro();
    }
  });
  
  document.getElementById('pomodoro-reset').addEventListener('click', resetPomodoro);
  
  // Skip to break button
  document.getElementById('pomodoro-skip').addEventListener('click', skipToBreak);
  
  // Handle mouse events for click-through
  const topBar = document.getElementById('top-bar');
  const interactiveElements = document.querySelectorAll('button, #pomodoro-timer');
  
  topBar.addEventListener('mouseenter', () => {
    ipcRenderer.send('set-ignore-mouse-events', false);
  });
  
  topBar.addEventListener('mouseleave', () => {
    ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
  });
  
  // Aegislash random shiny chance (1% chance every 10 seconds)
  setInterval(() => {
    const aegislash = document.getElementById('aegislash-gif');
    if (Math.random() < 0.01) {
      // Cambia lo sprite in shiny
      aegislash.src = "assets/icons/aegi-shiny.gif";
      setTimeout(() => {
        // Ritorna allo sprite normale dopo 5 secondi
        aegislash.src = "assets/icons/aegi.gif";
      }, 5000);
    }
  }, 10000);
});