const { ipcRenderer } = require("electron")

document.addEventListener("DOMContentLoaded", () => {
  // Funzioni per la barra superiore
  function updateClock() {
    const now = new Date()
    let hours = now.getHours()
    let minutes = now.getMinutes()
    const ampm = hours >= 12 ? "PM" : "AM"

    hours = hours % 12
    hours = hours ? hours : 12
    minutes = minutes < 10 ? "0" + minutes : minutes

    const timeString = `${hours}:${minutes} ${ampm}`
    document.getElementById("clock").textContent = timeString
  }

  function updateDate() {
    const now = new Date()
    const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"]
    const months = [
      "Gennaio",
      "Febbraio",
      "Marzo",
      "Aprile",
      "Maggio",
      "Giugno",
      "Luglio",
      "Agosto",
      "Settembre",
      "Ottobre",
      "Novembre",
      "Dicembre",
    ]

    const dayName = days[now.getDay()]
    const day = now.getDate()
    const monthName = months[now.getMonth()]

    const dateString = `${dayName} ${day} ${monthName}`
    document.getElementById("date").textContent = dateString
  }

  // Pomodoro Timer
  let pomodoroInterval = null
  let pomodoroTimeLeft = 25 * 60
  let pomodoroRunning = false
  let lastUpdateTime = Date.now()

  function updatePomodoroTimer() {
    const minutes = Math.floor(pomodoroTimeLeft / 60)
    const seconds = pomodoroTimeLeft % 60
    document.getElementById("pomodoro-time").textContent =
      `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  function startPomodoro() {
    if (pomodoroRunning) return

    pomodoroRunning = true
    lastUpdateTime = Date.now()
    document.getElementById("pomodoro-toggle").textContent = "||"

    pomodoroInterval = setInterval(() => {
      const currentTime = Date.now()
      const deltaTime = Math.floor((currentTime - lastUpdateTime) / 1000)

      if (deltaTime >= 1) {
        pomodoroTimeLeft -= deltaTime
        lastUpdateTime = currentTime
        updatePomodoroTimer()

        if (pomodoroTimeLeft <= 0) {
          clearInterval(pomodoroInterval)
          pomodoroRunning = false
          pomodoroTimeLeft = 0
          updatePomodoroTimer()

          // Notifica visiva
          document.getElementById("pomodoro-time").style.color = "#ff5555"
          setTimeout(() => {
            document.getElementById("pomodoro-time").style.color = "white"
          }, 1000)
          document.getElementById("pomodoro-toggle").textContent = "▶"
        }
      }
    }, 100)
  }

  function pausePomodoro() {
    if (!pomodoroRunning) return

    clearInterval(pomodoroInterval)
    pomodoroRunning = false
    document.getElementById("pomodoro-toggle").textContent = "▶"
  }

  function resetPomodoro() {
    clearInterval(pomodoroInterval)
    pomodoroTimeLeft = 25 * 60
    pomodoroRunning = false
    updatePomodoroTimer()
    document.getElementById("pomodoro-toggle").textContent = "▶"
    document.getElementById("pomodoro-time").style.color = "white"
  }

  // Inizializza il timer pomodoro
  updatePomodoroTimer()

  document.getElementById("pomodoro-toggle").addEventListener("click", () => {
    if (pomodoroRunning) {
      pausePomodoro()
    } else {
      startPomodoro()
    }
  })

  document.getElementById("pomodoro-reset").addEventListener("click", resetPomodoro)

  // Monitoraggio sistema (simulato)
  let systemStatsThrottle = 0
  function updateSystemStats() {
    systemStatsThrottle++
    if (systemStatsThrottle % 50 !== 0) return

    // Simula l'utilizzo della GPU e CPU
    const gpuUsage = Math.floor(Math.random() * 30) + 5
    const cpuUsage = Math.floor(Math.random() * 40) + 10

    document.getElementById("gpu-usage").textContent = `GPU: ${gpuUsage.toString().padStart(2, " ")}%`
    document.getElementById("cpu-usage").textContent = `CPU: ${cpuUsage.toString().padStart(2, " ")}%`
  }

  // Aggiorna orologio e data ogni secondo
  updateClock()
  updateDate()
  updateSystemStats()

  setInterval(updateClock, 1000)
  setInterval(updateDate, 60000)
  setInterval(updateSystemStats, 100)

  // Gestione eventi mouse per il pass-through
  const topBar = document.getElementById("top-bar")

  // Quando il mouse entra nella barra, abilita gli eventi
  topBar.addEventListener("mouseenter", () => {
    ipcRenderer.send("set-ignore-mouse-events", false)
  })

  // Quando il mouse esce dalla barra, disabilita gli eventi
  topBar.addEventListener("mouseleave", () => {
    ipcRenderer.send("set-ignore-mouse-events", true, { forward: true })
  })
})