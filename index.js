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

  let shinyCheckInterval = null
  let isShiny = false

  function checkForShiny() {
    const random = Math.random()
    const aegislashGif = document.getElementById("aegislash-gif")

    if (random < 0.05) {
      // 5% chance
      if (!isShiny) {
        console.log("Aegislash diventa shiny!")
        aegislashGif.src = "assets/icons/aegi-shiny.gif"
        aegislashGif.classList.add("shiny")
        isShiny = true

        // Torna normale dopo 30 secondi
        setTimeout(() => {
          aegislashGif.src = "assets/icons/aegi.gif"
          aegislashGif.classList.remove("shiny")
          isShiny = false
          console.log("Aegislash torna normale")
        }, 30000)
      }
    }
  }

  function startShinyCheck() {
    shinyCheckInterval = setInterval(checkForShiny, 420000) // 7 minutes
  }

  // Inizializza il timer pomodoro
  updatePomodoroTimer()

  function setupPomodoroEvents() {
    const toggleButton = document.getElementById("pomodoro-toggle")
    const resetButton = document.getElementById("pomodoro-reset")

    console.log("Setting up pomodoro events...")
    console.log("Toggle button:", toggleButton)
    console.log("Reset button:", resetButton)

    if (toggleButton) {
      toggleButton.removeEventListener("click", handleToggleClick)
      toggleButton.addEventListener("click", handleToggleClick)
      console.log("Toggle button event listener added")
    } else {
      console.error("Toggle button not found")
    }

    if (resetButton) {
      resetButton.removeEventListener("click", resetPomodoro)
      resetButton.addEventListener("click", resetPomodoro)
      console.log("Reset button event listener added")
    } else {
      console.error("Reset button not found")
    }
  }

  function handleToggleClick(event) {
    event.preventDefault()
    event.stopPropagation()
    console.log("Toggle button clicked, pomodoroRunning:", pomodoroRunning)

    if (pomodoroRunning) {
      pausePomodoro()
    } else {
      startPomodoro()
    }
  }

  // Aggiorna orologio e data ogni secondo
  updateClock()
  updateDate()

  setInterval(updateClock, 1000)
  setInterval(updateDate, 60000)

  startShinyCheck()

  // Gestione eventi mouse per il pass-through
  const topBar = document.getElementById("top-bar")

  // Quando il mouse entra nella barra, abilita gli eventi
  topBar.addEventListener("mouseenter", () => {
    console.log("Mouse entered top bar")
    ipcRenderer.send("set-ignore-mouse-events", false)
  })

  // Quando il mouse esce dalla barra, disabilita gli eventi
  topBar.addEventListener("mouseleave", () => {
    console.log("Mouse left top bar")
    ipcRenderer.send("set-ignore-mouse-events", true, { forward: true })
  })

  setupPomodoroEvents()
  setTimeout(setupPomodoroEvents, 500)

  console.log("DOM Content Loaded, all event listeners should be set up")
})
