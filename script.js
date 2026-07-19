// ============================================================
// HolyPhuck's Community Server loading screen
// Edit SERVER_NAME, TAGLINE, ADMINS_ONLINE, TIPS, and
// BACKGROUND_IMAGES below to customize.
// Colors live in style.css as CSS variables (:root { ... }).
// ============================================================

var SERVER_NAME = "HolyPhuck's Community Server"; // <-- change this to your server's name
var TAGLINE = "Welcome back. Let's get you loaded in.";

// Static list of admins/staff to display. Not live server data — just
// edit this list by hand when your staff roster changes.
var ADMINS_ONLINE = [
  "HolyPhuck",
  "Admin2",
  "Admin3"
];

// Rotating tips shown in the small panel. Add/remove as many as you like.
var TIPS = [
  "TIP: Press F1 to open the admin menu if you have access.",
  "TIP: Type !rules in chat to see the full server rules.",
  "TIP: Loot decays over time — don't hoard, use it or lose it.",
  "TIP: Friendly fire is OFF in safe zones, ON everywhere else.",
  "RULE: No RDM. No prop-killing without a valid RP reason.",
  "RULE: Mic spam and racism = instant ban. Be decent.",
  "TIP: Discord invite is in the server MOTD if you need support."
];
var TIPS_ROTATE_MS = 5000;

// If /img/ contains screenshots, list their filenames here to cycle them
// as dimmed backgrounds. Leave empty to use the plain textured fallback.
var BACKGROUND_IMAGES = [
  "img/garrysmod-slideshow.jpeg",
  "img/garrysmod-slideshow -2.jpeg",
  "img/garrysmod-slideshow-3.jpeg",
  "img/garrysmod-slideshow-4.jpeg",
  "img/garrysmod-slideshow-5.jpeg"
];
var BACKGROUND_ROTATE_MS = 8000;

// ------------------------------------------------------------
// Internal state
// ------------------------------------------------------------
var state = {
  filesTotal: 0,
  filesNeeded: 0
};

var MAX_LOG_LINES = 6;

// ------------------------------------------------------------
// DOM helpers (guarded so missing elements never throw)
// ------------------------------------------------------------
function setText(id, value) {
  var el = document.getElementById(id);
  if (el && value !== undefined && value !== null && value !== "") {
    el.textContent = value;
  }
}

function getParam(name) {
  try {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  } catch (e) {
    return null;
  }
}

// ============================================================
// GMod Loading Screen API
// These functions are called directly by the game engine.
// https://wiki.facepunch.com/gmod/Loading_Screens
// ============================================================

// Called once when the loading screen is ready with server/player info.
function GameDetails(servername, serverurl, mapname, maxplayers, steamid, gamemode) {
  setText("field-map", mapname || "Loading map...");
  setText("field-gamemode", gamemode || "Loading gamemode...");
  setText("field-maxplayers", maxplayers || "--");
  setText("field-player", steamid || "Unknown Survivor");

  if (servername) {
    document.title = servername;
  }
}

// Renders the static ADMINS_ONLINE list as chips in the main panel.
function renderAdmins() {
  var list = document.getElementById("admins-list");
  if (!list) return;

  list.innerHTML = "";

  if (!ADMINS_ONLINE || ADMINS_ONLINE.length === 0) {
    var empty = document.createElement("div");
    empty.className = "admins-empty";
    empty.textContent = "No admins currently online.";
    list.appendChild(empty);
    return;
  }

  ADMINS_ONLINE.forEach(function (name) {
    var chip = document.createElement("div");
    chip.className = "admin-chip";
    chip.textContent = name;
    list.appendChild(chip);
  });
}

// Total number of files that will be checked/downloaded this session.
function SetFilesTotal(total) {
  state.filesTotal = parseInt(total, 10) || 0;
  updateProgressBar();
}

// Number of files still needed (counts down to 0 as downloads finish).
function SetFilesNeeded(needed) {
  state.filesNeeded = parseInt(needed, 10) || 0;
  updateProgressBar();
}

function updateProgressBar() {
  var percent = 0;
  if (state.filesTotal > 0) {
    percent = ((state.filesTotal - state.filesNeeded) / state.filesTotal) * 100;
  }
  percent = Math.max(0, Math.min(100, percent));

  var bar = document.getElementById("progress-bar");
  var label = document.getElementById("progress-label");
  if (bar) bar.style.width = percent.toFixed(0) + "%";
  if (label) label.textContent = percent.toFixed(0) + "%";
}

// Engine status text, e.g. "Retrieving server info", "Sending client info".
function SetStatusChanged(status) {
  setText("status-line", status || "Retrieving server info...");
}

// Called once per file as it downloads.
function DownloadingFile(fileName) {
  setText("current-download", "Downloading: " + (fileName || ""));
  appendLogLine(fileName);
}

function appendLogLine(fileName) {
  var log = document.getElementById("file-log");
  if (!log || !fileName) return;

  var line = document.createElement("div");
  line.textContent = "> " + fileName;
  log.appendChild(line);

  while (log.children.length > MAX_LOG_LINES) {
    log.removeChild(log.firstChild);
  }

  log.scrollTop = log.scrollHeight;
}

// ============================================================
// Tips rotation
// ============================================================
function startTipsRotation() {
  var tipsEl = document.getElementById("tips-text");
  if (!tipsEl || TIPS.length === 0) return;

  var index = 0;
  tipsEl.textContent = TIPS[0];

  setInterval(function () {
    index = (index + 1) % TIPS.length;
    tipsEl.textContent = TIPS[index];
  }, TIPS_ROTATE_MS);
}

// ============================================================
// Background screenshot crossfade (falls back to plain texture
// if no images are configured)
// ============================================================
function startBackgroundCycle() {
  if (!BACKGROUND_IMAGES || BACKGROUND_IMAGES.length === 0) {
    document.body.classList.add("no-screenshots");
    return;
  }

  var layerA = document.getElementById("bg-layer");
  var layerB = document.getElementById("bg-layer-2");
  if (!layerA || !layerB) return;

  var index = 0;
  var showingA = true;

  layerA.style.backgroundImage = "url('" + encodeURI(BACKGROUND_IMAGES[0]) + "')";
  layerA.style.opacity = "1";

  if (BACKGROUND_IMAGES.length === 1) return;

  setInterval(function () {
    index = (index + 1) % BACKGROUND_IMAGES.length;
    var nextImage = BACKGROUND_IMAGES[index];
    var showLayer = showingA ? layerB : layerA;
    var hideLayer = showingA ? layerA : layerB;

    showLayer.style.backgroundImage = "url('" + encodeURI(nextImage) + "')";
    showLayer.style.opacity = "1";
    hideLayer.style.opacity = "0";

    showingA = !showingA;
  }, BACKGROUND_ROTATE_MS);
}

// ============================================================
// Local browser preview / demo mode
// Reads GMod's URL query params as a fallback, and simulates a
// fake download sequence when opened directly (not from GMod)
// so the page is fully viewable by just opening index.html.
// ============================================================
function initDemoMode() {
  var steamidParam = getParam("steamid");
  var mapParam = getParam("mapname");

  GameDetails(
    SERVER_NAME,
    window.location.href,
    mapParam || "gm_flatgrass",
    "32",
    steamidParam || "Player123",
    "DarkRP"
  );

  SetStatusChanged("Retrieving server info...");

  var demoFiles = [
    "materials/community/logo_sheet.vtf",
    "models/props_community/vending_01.mdl",
    "sound/ambient/community_lobby_loop.wav",
    "materials/hud/community_hud_sheet.vtf",
    "lua/autorun/community_core.lua",
    "resource/fonts/community_ui.ttf",
    "models/weapons/w_pistol.mdl",
    "materials/skybox/community_sky.vtf"
  ];

  var total = demoFiles.length;
  SetFilesTotal(total);
  SetFilesNeeded(total);
  SetStatusChanged("Downloading required files...");

  var i = 0;
  var demoInterval = setInterval(function () {
    if (i >= total) {
      clearInterval(demoInterval);
      SetFilesNeeded(0);
      SetStatusChanged("Starting game...");
      setText("current-download", "All files downloaded.");
      return;
    }

    DownloadingFile(demoFiles[i]);
    i++;
    SetFilesNeeded(total - i);
  }, 900);
}

// ============================================================
// Init
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  setText("logo-text", SERVER_NAME);
  setText("tagline", TAGLINE);
  renderAdmins();

  startTipsRotation();
  startBackgroundCycle();

  // If GMod hasn't called GameDetails() shortly after load, assume
  // we're being previewed in a normal browser and run the demo.
  setTimeout(function () {
    if (!window.__gmodCalledIn) {
      initDemoMode();
    }
  }, 300);
});

// Wrap the API functions to flag that GMod is actually driving the page,
// so demo mode doesn't stomp on real data if both somehow fire.
(function wrapGmodEntryPoints() {
  var realGameDetails = GameDetails;
  GameDetails = function () {
    window.__gmodCalledIn = true;
    return realGameDetails.apply(this, arguments);
  };
})();
