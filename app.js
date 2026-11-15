const audio = document.querySelector("#audio");
const picker = document.querySelector("#file-picker");
const folderPicker = document.querySelector("#folder-picker");
const libraryStatus = document.querySelector("#library-status");
const trackList = document.querySelector("#track-list");
const emptyState = document.querySelector("#empty-state");
const trackSearch = document.querySelector("#track-search");
const noMatches = document.querySelector("#no-matches");
const dropArea = document.querySelector("#drop-area");
const playButton = document.querySelector("#play");
const progress = document.querySelector("#progress");
const shuffleButton = document.querySelector("#shuffle");
const repeatButton = document.querySelector("#repeat");
const installButton = document.querySelector("#install-app");
const appearanceToggle = document.querySelector("#appearance-toggle");
const appearancePanel = document.querySelector("#appearance-panel");
const customBackground = document.querySelector("#custom-background");
const autoThemeToggle = document.querySelector("#auto-theme");
const rhythmCanvas = document.querySelector("#rhythm-background");
const rhythmContext = rhythmCanvas.getContext("2d");
const musicLibrary = window.Capacitor?.Plugins?.MusicLibrary;

const backgrounds = {
  default: { base: "#101116", left: "#202617", right: "#292545", accent: "#c2f266" },
  ocean: { base: "#0d141c", left: "#102e35", right: "#163354", accent: "#67e8d2" },
  violet: { base: "#15111b", left: "#321d3d", right: "#29214e", accent: "#dda1ff" },
  sunset: { base: "#19110f", left: "#48251c", right: "#3d2140", accent: "#ffbd79" },
};

const tracks = [
  {
    title: "Kâtibim",
    artist: "Geleneksel Türk halk müziği",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/00/K%C3%A2tibim.mp3",
    size: 0,
  },
  {
    title: "Üsküdar'a Gider İken",
    artist: "Turku, Nomads of the Silk Road",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/41/Turku_Nomads_of_the_Silk_Road_-_01_-_-Uskudara_Gideriken.ogg",
    size: 0,
  },
  {
    title: "Fidayda",
    artist: "Turku, Nomads of the Silk Road",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Turku_Nomads_of_the_Silk_Road_-_02_-_Fidayda.ogg",
    size: 0,
  },
  {
    title: "Misket",
    artist: "Turku, Nomads of the Silk Road",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/45/Turku_Nomads_of_the_Silk_Road_-_06_-_-Misket.ogg",
    size: 0,
  },
  {
    title: "Sivastopol Marşı",
    artist: "Rifat Bey · Geleneksel",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/df/Sivastopol_Mar%C5%9F%C4%B1_-_19th_Century_Turkish_Military_Music.opus",
    size: 0,
  },
  {
    title: "Sivastopol Önünde Yatar Gemiler",
    artist: "Geleneksel Türk halk müziği",
    url: "https://upload.wikimedia.org/wikipedia/commons/6/60/Sivastopol_%C3%96n%C3%BCnde_Yatar_Gemiler.ogg",
    size: 0,
  },
  {
    title: "Hüseyni Saz Semaisi",
    artist: "Hafız Kemal Bey ve Hayriye Hanım",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Husseyni_Saz_Semayissi_.ogg",
    size: 0,
  },
  {
    title: "Anadolu Kavağı",
    artist: "Turku, Nomads of the Silk Road",
    url: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Turku_Nomads_of_the_Silk_Road_-_04_-_-Anadolu_Kavagi.ogg",
    size: 0,
  },
  {
    title: "Ağrı Dağından Uçtum",
    artist: "Turku, Nomads of the Silk Road",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/46/Turku_Nomads_of_the_Silk_Road_-_-Agri_Dagindan_Uctum.ogg",
    size: 0,
  },
  {
    title: "Yeşilim",
    artist: "Turku, Nomads of the Silk Road",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Turku_Nomads_of_the_Silk_Road_-_08_-_-Yesilim.ogg",
    size: 0,
  },
  {
    title: "Rampi Rampi",
    artist: "Turku, Nomads of the Silk Road",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Turku_Nomads_of_the_Silk_Road_-_05_-_-Rampi_Rampi.ogg",
    size: 0,
  },
];
let currentIndex = -1;
let trackLoadToken = 0;
let shuffle = false;
let repeat = false;
let installPrompt;
const addedFileKeys = new Set();
const audioExtensions = /\.(mp3|ogg|oga|opus|wav|flac|m4a|aac|wma|aiff?)$/i;
let rhythmBackground = false;
let audioContext;
let analyser;
let frequencyData;
let rhythmFrame = 0;
let lastBass = 0;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function persistBackgroundPreference() {
  try {
    const savedBackground = JSON.parse(localStorage.getItem("ritim-background") || "{}");
    savedBackground.rhythmBackground = rhythmBackground;
    localStorage.setItem("ritim-background", JSON.stringify(savedBackground));
  } catch (error) {
    console.warn("Ritim görseli tercihi bu tarayıcıda kaydedilemedi:", error);
  }
}

function resizeRhythmCanvas() {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  rhythmCanvas.width = Math.round(window.innerWidth * scale);
  rhythmCanvas.height = Math.round(window.innerHeight * scale);
  rhythmContext.setTransform(scale, 0, 0, scale, 0, 0);
}

function applyBackground(theme) {
  const colors = backgrounds[theme];
  if (!colors) return;
  document.documentElement.style.setProperty("--page-background", colors.base);
  document.documentElement.style.setProperty("--glow-left", colors.left);
  document.documentElement.style.setProperty("--glow-right", colors.right);
  document.documentElement.style.setProperty("--accent", colors.accent);
  customBackground.value = colors.base;
  document.querySelectorAll(".theme-option").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.theme === theme));
  });
  try {
    localStorage.setItem("ritim-background", JSON.stringify({ theme, rhythmBackground }));
  } catch (error) {
    console.warn("Arka plan tercihi bu tarayıcıda kaydedilemedi:", error);
  }
}

function applyCustomBackground(color) {
  document.documentElement.style.setProperty("--page-background", color);
  document.documentElement.style.setProperty("--glow-left", color);
  document.documentElement.style.setProperty("--glow-right", color);
  document.documentElement.style.setProperty("--accent", "#c2f266");
  document.querySelectorAll(".theme-option").forEach((button) => {
    button.setAttribute("aria-pressed", "false");
  });
  try {
    localStorage.setItem("ritim-background", JSON.stringify({ custom: color, rhythmBackground }));
  } catch (error) {
    console.warn("Arka plan tercihi bu tarayıcıda kaydedilemedi:", error);
  }
}

try {
  const savedBackground = JSON.parse(localStorage.getItem("ritim-background") || "null");
  rhythmBackground = savedBackground?.rhythmBackground === true || savedBackground?.autoTheme === true;
  autoThemeToggle.checked = rhythmBackground;
  if (savedBackground?.custom && /^#[\da-f]{6}$/i.test(savedBackground.custom)) {
    applyCustomBackground(savedBackground.custom);
    customBackground.value = savedBackground.custom;
  } else {
    applyBackground(backgrounds[savedBackground?.theme] ? savedBackground.theme : "default");
  }
} catch (error) {
  console.warn("Kaydedilmiş arka plan ayarı okunamadı; varsayılan tema kullanılacak:", error);
  applyBackground("default");
}

appearanceToggle.addEventListener("click", () => {
  const isExpanded = appearanceToggle.getAttribute("aria-expanded") === "true";
  appearanceToggle.setAttribute("aria-expanded", String(!isExpanded));
  appearancePanel.hidden = isExpanded;
});

document.querySelectorAll(".theme-option").forEach((button) => {
  button.addEventListener("click", () => applyBackground(button.dataset.theme));
});

customBackground.addEventListener("input", () => applyCustomBackground(customBackground.value));

autoThemeToggle.addEventListener("change", () => {
  rhythmBackground = autoThemeToggle.checked;
  persistBackgroundPreference();
  if (rhythmBackground && !audio.paused) startRhythmBackground();
  else stopRhythmBackground();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".appearance")) {
    appearancePanel.hidden = true;
    appearanceToggle.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    appearancePanel.hidden = true;
    appearanceToggle.setAttribute("aria-expanded", "false");
    appearanceToggle.focus();
  }
});

function addFiles(files) {
  const audioFiles = [...files].filter((file) => file.type.startsWith("audio/") || audioExtensions.test(file.name));
  let addedCount = 0;
  for (const file of audioFiles) {
    const fileKey = `${file.webkitRelativePath || file.name}:${file.size}:${file.lastModified}`;
    if (addedFileKeys.has(fileKey)) continue;
    addedFileKeys.add(fileKey);
    tracks.push({
      file,
      url: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, ""),
      size: file.size,
    });
    addedCount++;
  }
  renderTracks();
  if (currentIndex === -1 && tracks.length > 0) loadTrack(0, false);
  libraryStatus.textContent = addedCount
    ? `${addedCount} yeni müzik eklendi.`
    : audioFiles.length
      ? "Bu müzikler zaten listede."
      : "Seçilen yerde müzik dosyası bulunamadı.";
}

async function scanDeviceMusic() {
  if (!musicLibrary) {
    folderPicker.click();
    return;
  }

  libraryStatus.textContent = "Telefondaki müzikler taranıyor…";
  try {
    const { tracks: deviceTracks } = await musicLibrary.listAudio();
    let addedCount = 0;
    for (const deviceTrack of deviceTracks) {
      const fileKey = `android:${deviceTrack.id}`;
      if (addedFileKeys.has(fileKey)) continue;
      addedFileKeys.add(fileKey);
      tracks.push({
        nativeId: deviceTrack.id,
        title: deviceTrack.title || deviceTrack.displayName.replace(/\.[^.]+$/, ""),
        artist: deviceTrack.artist && deviceTrack.artist !== "<unknown>" ? deviceTrack.artist : "",
        size: deviceTrack.size,
      });
      addedCount++;
    }

    renderTracks();
    if (currentIndex === -1 && tracks.length > 0) loadTrack(0, false);
    libraryStatus.textContent = addedCount
      ? `${addedCount} telefon müziği bulundu ve eklendi.`
      : deviceTracks.length
        ? "Telefonundaki müzikler zaten listede."
        : "Telefonda müzik bulunamadı.";
  } catch (error) {
    libraryStatus.textContent = error?.message
      ? `Telefon müzikleri taranamadı: ${error.message}`
      : "Telefon müzikleri taranamadı. Müzik iznini kontrol edip yeniden tara.";
    console.error("Telefon müzikleri taranamadı:", error);
  }
}

function renderTracks() {
  trackList.replaceChildren();
  const query = trackSearch.value.trim().toLocaleLowerCase("tr-TR");
  const matchingTracks = tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => `${track.title} ${track.artist || ""}`.toLocaleLowerCase("tr-TR").includes(query));
  emptyState.hidden = tracks.length > 0;
  trackSearch.hidden = tracks.length === 0;
  noMatches.hidden = tracks.length === 0 || matchingTracks.length > 0;
  document.querySelector("#track-count").textContent = `${tracks.length} parça`;

  matchingTracks.forEach(({ track, index }) => {
    const row = document.createElement("li");
    row.className = `track-row${index === currentIndex ? " active" : ""}`;
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", `${track.title} parçasını çal`);

    const number = document.createElement("span");
    number.className = "track-index";
    number.textContent = index === currentIndex && !audio.paused ? "♫" : String(index + 1).padStart(2, "0");

    const name = document.createElement("span");
    name.className = "track-name";
    name.textContent = track.title;
    name.title = track.title;

    const size = document.createElement("span");
    size.className = "track-size";
    size.textContent = track.file ? formatBytes(track.size) : "";

    row.append(number, name, size);
    row.addEventListener("click", () => loadTrack(index, true));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        loadTrack(index, true);
      }
    });
    trackList.append(row);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function loadTrack(index, autoplay) {
  if (index < 0 || index >= tracks.length) return;
  const loadToken = ++trackLoadToken;
  currentIndex = index;
  stopRhythmBackground();
  document.querySelector("#current-title").textContent = tracks[index].title;
  document.querySelector("#current-artist").textContent = tracks[index].artist || "Yerel müzik dosyası";
  document.querySelector("#current-time").textContent = "0:00";
  document.querySelector("#duration").textContent = "0:00";
  progress.value = 0;
  updateRange(progress);
  renderTracks();
  try {
    const track = tracks[index];
    if (track.nativeId) {
      const { path } = await musicLibrary.getAudioFile({ id: track.nativeId });
      if (loadToken !== trackLoadToken) return;
      audio.removeAttribute("crossorigin");
      audio.src = window.Capacitor.convertFileSrc(path);
    } else {
      audio.crossOrigin = "anonymous";
      audio.src = track.url;
    }
    if (autoplay) await play();
  } catch (error) {
    if (loadToken !== trackLoadToken) return;
    libraryStatus.textContent = "Bu müzik açılamadı. Dosya taşınmış veya erişim izni kaldırılmış olabilir.";
    console.error("Müzik dosyası açılamadı:", error);
  }
}

async function play() {
  if (currentIndex === -1 && tracks.length > 0) loadTrack(0, false);
  if (currentIndex === -1) {
    picker.click();
    return;
  }
  try {
    await audio.play();
    if (rhythmBackground) {
      try {
        await startRhythmBackground();
      } catch (error) {
        console.error("Ritim görseli başlatılamadı:", error);
      }
    }
    playButton.textContent = "Ⅱ";
    playButton.setAttribute("aria-label", "Duraklat");
    renderTracks();
  } catch (error) {
    document.querySelector("#current-artist").textContent = "Bu dosya çalınamadı; başka bir dosya dene.";
    console.error("Ses dosyası çalınamadı:", error);
  }
}

function pause() {
  audio.pause();
  stopRhythmBackground();
  playButton.textContent = "▶";
  playButton.setAttribute("aria-label", "Çal");
  renderTracks();
}

function nextTrack() {
  if (tracks.length === 0) return;
  if (shuffle && tracks.length > 1) {
    let next = currentIndex;
    while (next === currentIndex) next = Math.floor(Math.random() * tracks.length);
    loadTrack(next, true);
  } else {
    loadTrack((currentIndex + 1) % tracks.length, true);
  }
}

document.querySelector("#select-music").addEventListener("click", () => picker.click());
document.querySelector("#scan-folder").addEventListener("click", scanDeviceMusic);
trackSearch.addEventListener("input", renderTracks);
picker.addEventListener("change", (event) => {
  addFiles(event.target.files);
  picker.value = "";
});
folderPicker.addEventListener("change", (event) => {
  addFiles(event.target.files);
  folderPicker.value = "";
});

playButton.addEventListener("click", () => audio.paused ? play() : pause());
document.querySelector("#previous").addEventListener("click", () => {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
  } else if (tracks.length > 0) {
    loadTrack((currentIndex - 1 + tracks.length) % tracks.length, true);
  }
});
document.querySelector("#next").addEventListener("click", nextTrack);
shuffleButton.addEventListener("click", () => {
  shuffle = !shuffle;
  shuffleButton.classList.toggle("active", shuffle);
  shuffleButton.setAttribute("aria-pressed", String(shuffle));
});
repeatButton.addEventListener("click", () => {
  repeat = !repeat;
  audio.loop = repeat;
  repeatButton.classList.toggle("active", repeat);
  repeatButton.setAttribute("aria-pressed", String(repeat));
});
document.querySelector("#volume").addEventListener("input", (event) => {
  audio.volume = Number(event.target.value);
});
progress.addEventListener("input", () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = (progress.value / 1000) * audio.duration;
});
audio.addEventListener("loadedmetadata", () => {
  document.querySelector("#duration").textContent = formatTime(audio.duration);
});
audio.addEventListener("timeupdate", () => {
  document.querySelector("#current-time").textContent = formatTime(audio.currentTime);
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    progress.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
    updateRange(progress);
  }
});
audio.addEventListener("play", () => {
  document.querySelector(".now-playing").classList.add("is-playing");
  if (rhythmBackground) startRhythmBackground().catch((error) => console.error("Ritim görseli başlatılamadı:", error));
  playButton.textContent = "Ⅱ";
  playButton.setAttribute("aria-label", "Duraklat");
  renderTracks();
});
audio.addEventListener("pause", () => {
  document.querySelector(".now-playing").classList.remove("is-playing");
  stopRhythmBackground();
  playButton.textContent = "▶";
  playButton.setAttribute("aria-label", "Çal");
  renderTracks();
});
audio.addEventListener("ended", nextTrack);
audio.addEventListener("error", () => {
  if (!audio.currentSrc) return;
  document.querySelector("#current-artist").textContent = "Parça yüklenemedi. İnternet bağlantını kontrol et.";
});

dropArea.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropArea.classList.add("dragging");
});
dropArea.addEventListener("dragleave", (event) => {
  if (!dropArea.contains(event.relatedTarget)) dropArea.classList.remove("dragging");
});
dropArea.addEventListener("drop", (event) => {
  event.preventDefault();
  dropArea.classList.remove("dragging");
  addFiles(event.dataTransfer.files);
});

audio.volume = 0.8;

function drawRhythmBackground() {
  if (!rhythmBackground || audio.paused || !analyser || !frequencyData) {
    stopRhythmBackground();
    return;
  }

  analyser.getByteFrequencyData(frequencyData);
  const bassBins = Math.max(1, Math.floor(frequencyData.length * 0.12));
  const midStart = bassBins;
  const midEnd = Math.max(midStart + 1, Math.floor(frequencyData.length * 0.48));
  const average = (start, end) => {
    let sum = 0;
    for (let index = start; index < end; index++) sum += frequencyData[index];
    return sum / Math.max(1, end - start) / 255;
  };

  const bass = average(0, bassBins);
  const mids = average(midStart, midEnd);
  const highs = average(midEnd, frequencyData.length);
  lastBass += (bass - lastBass) * 0.32;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const intensity = Math.min(1, 0.12 + lastBass * 1.35);
  rhythmContext.clearRect(0, 0, width, height);

  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#c2f266";
  const drawGlow = (x, y, radius, alpha) => {
    const glow = rhythmContext.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, `${accent}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`);
    glow.addColorStop(1, `${accent}00`);
    rhythmContext.fillStyle = glow;
    rhythmContext.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };

  drawGlow(width * 0.24, height * 0.38, Math.min(width, height) * (0.25 + lastBass * 0.17), 0.07 + intensity * 0.11);
  drawGlow(width * 0.78, height * 0.6, Math.min(width, height) * (0.2 + mids * 0.2), 0.04 + mids * 0.12);
  drawGlow(width * (0.48 + Math.sin(performance.now() * 0.00035) * 0.12), height * 0.9, Math.min(width, height) * (0.12 + highs * 0.12), 0.03 + highs * 0.1);

  rhythmFrame = requestAnimationFrame(drawRhythmBackground);
}

async function startRhythmBackground() {
  if (!rhythmBackground || audio.paused) return;
  if (!audioContext) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) throw new Error("Bu tarayıcı ses analizini desteklemiyor.");
    audioContext = new AudioContextConstructor();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") await audioContext.resume();
  cancelAnimationFrame(rhythmFrame);
  rhythmFrame = requestAnimationFrame(drawRhythmBackground);
}

function stopRhythmBackground() {
  cancelAnimationFrame(rhythmFrame);
  rhythmFrame = 0;
  rhythmContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

resizeRhythmCanvas();
window.addEventListener("resize", resizeRhythmCanvas);

function updateRange(range) {
  const min = Number(range.min) || 0;
  const max = Number(range.max) || 100;
  const value = Number(range.value);
  const percent = ((value - min) / (max - min)) * 100;
  range.style.setProperty("--range-progress", `${percent}%`);
}

document.querySelectorAll(".range").forEach((range) => {
  updateRange(range);
  range.addEventListener("input", () => updateRange(range));
});

renderTracks();
loadTrack(0, false);
if (musicLibrary) scanDeviceMusic();

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!installPrompt) {
    alert("Tarayıcı menüsünü açıp “Uygulamayı yükle” veya “Ana ekrana ekle” seçeneğini kullan.");
    return;
  }
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = undefined;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installPrompt = undefined;
  installButton.hidden = true;
});

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Uygulama çevrimdışı kullanıma hazırlanamadı:", error);
    });
  });
}
