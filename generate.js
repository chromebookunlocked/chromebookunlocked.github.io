// Add to bookmarks functionality
    function addToBookmarks() {
      const pageTitle = 'Chromebook Unlocked Games';
      const pageUrl = window.location.href.split('#')[0]; // Remove hash
      
      // Try modern API first (Chrome, Edge)
      if (window.chrome && window.chrome.runtime) {
        // Show instructions for Chrome
        showBookmarkInstructions();
      }
      // Try Firefox bookmark API
      else if (window.sidebar && window.sidebar.addPanel) {
        window.sidebar.addPanel(pageTitle, pageUrl, '');
      }
      // Try old IE/Edge method
      else if (window.external && window.external.AddFavorite) {
        window.external.AddFavorite(pageUrl, pageTitle);
      }
      // Fallback: Show keyboard shortcut
      else {
        showBookmarkInstructions();
      }
    }
    
    function showBookmarkInstructions() {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const shortcut = isMac ? 'Cmd+D' : 'Ctrl+D';
      alert('Press ' + shortcut + ' to bookmark this page!\\n\\nOn mobile, tap the menu button and select "Add to Home Screen"');
    }    /* Bookmark Button */
    #bookmarkBtn {
      padding: 0.5rem 1rem;
      background: rgba(255, 102, 255, 0.15);
      border: 1px solid rgba(255, 102, 255, 0.3);
      border-radius: 8px;
      color: var(--accent-light);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all .3s ease;
      font-family: var(--font-main);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      white-space: nowrap;
    }
    
    #bookmarkBtn:hover {
      background: rgba(255, 102, 255, 0.25);
      border-color: var(--accent);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 102, 255, 0.3);
    }
    
    #bookmarkBtn:active {
      transform: translateY(0);
    }
    
    @media (max-width: 768px) {
      #bookmarkBtn {
        font-size: 0.75rem;
        padding: 0.4rem 0.8rem;
      }
      #bookmarkBtn .bookmark-text {
        display: none;
      }
    }const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const gamesDir = path.join(__dirname, "games");
const outputDir = path.join(__dirname, "dist");
const outputFile = path.join(outputDir, "index.html");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Load games
const games = fs.readdirSync(dataDir)
  .filter(f => f.endsWith(".json"))
  .map(f => {
    const json = JSON.parse(fs.readFileSync(path.join(dataDir, f)));
    // Support multiple categories (comma-separated string or array)
    let gameCategories = json.category || json.categories || "Uncategorized";
    if (typeof gameCategories === 'string') {
      gameCategories = gameCategories.split(',').map(c => c.trim());
    }
    if (!Array.isArray(gameCategories)) {
      gameCategories = [gameCategories];
    }
    
    return {
      folder: json.folder || f.replace(".json", ""),
      name: json.name || f.replace(".json", ""),
      categories: gameCategories, // Array of categories
      thumbs: json.thumbs && json.thumbs.length ? json.thumbs : ["thumbnail.png", "thumbnail.jpg"],
      dateAdded: json.dateAdded || null // Support for "Newly Added" sorting
    };
  });

// Group into categories (games can appear in multiple categories)
const categories = {};
games.forEach(g => {
  g.categories.forEach(cat => {
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(g);
  });
});

// Add "Newly Added" category if games have dateAdded
const gamesWithDates = games.filter(g => g.dateAdded).sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
if (gamesWithDates.length > 0) {
  categories['Newly Added'] = gamesWithDates.slice(0, 20); // Show latest 20 games
}

// Utility to find the actual thumb file (existing)
function chooseThumb(game) {
  const thumb = game.thumbs.find(t => fs.existsSync(path.join(gamesDir, game.folder, t)));
  return thumb || game.thumbs[0];
}

// Generate game card string with data-index for JS control
function generateGameCard(game, idx) {
  const thumb = chooseThumb(game);
  return `<div class="card game-card" data-index="${idx}" data-folder="${game.folder}" data-name="${game.name.toLowerCase()}" onclick="prepareGame('${encodeURIComponent(game.folder)}','${encodeURIComponent(game.name)}','games/${game.folder}/${thumb}')">
    <div class="thumb-container" style="--thumb-url: url('games/${game.folder}/${thumb}')">
      <img class="thumb" src="games/${game.folder}/${thumb}" alt="${game.name}">
    </div>
    <div class="card-title">${game.name}</div>
  </div>`;
}

// Sidebar categories - exclude "Newly Added" and "Recently Played"
const sidebarCategories = Object.keys(categories)
  .filter(cat => cat !== "Recently Played" && cat !== "Newly Added")
  .map(cat => `<li onclick="filterCategory('${cat}')">${cat}</li>`)
  .join("");

// Add "Newly Added" at the top if it exists
const newlyAddedItem = categories['Newly Added'] ? 
  `<li onclick="filterCategory('Newly Added')" style="border-bottom: 1px solid rgba(255,102,255,0.3); padding-bottom: 0.8rem; margin-bottom: 0.8rem;">✨ Newly Added</li>` : '';

const finalSidebarCategories = newlyAddedItem + sidebarCategories;

// Full HTML template
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  
  <!-- Primary Meta Tags -->
  <title>Chromebook Unlocked Games - Free Unblocked Games for School</title>
  <meta name="title" content="Chromebook Unlocked Games - Free Unblocked Games for School">
  <meta name="description" content="Play free unblocked games at school on your Chromebook. Access 100+ unlocked online games that work on school computers. No downloads required - play instantly in your browser!">
  <meta name="keywords" content="chromebook unlocked games, unblocked games, free online games, school games, chromebook games, unblocked games at school, online games unblocked, school computer games, free games, browser games, no download games, undetected games, play games at school">
  <meta name="robots" content="index, follow">
  <meta name="language" content="English">
  <meta name="author" content="Chromebook Unlocked Games">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://chromebookunlocked.github.io/">
  <meta property="og:title" content="Chromebook Unlocked Games - Free Unblocked Games for School">
  <meta property="og:description" content="Play free unblocked games at school on your Chromebook. Access 100+ unlocked online games that work on school computers. No downloads required!">
  <meta property="og:image" content="https://chromebookunlocked.github.io/assets/logo.png">
  <meta property="og:site_name" content="Chromebook Unlocked Games">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://chromebookunlocked.github.io/">
  <meta property="twitter:title" content="Chromebook Unlocked Games - Free Unblocked Games for School">
  <meta property="twitter:description" content="Play free unblocked games at school on your Chromebook. Access 100+ unlocked online games that work on school computers. No downloads required!">
  <meta property="twitter:image" content="https://chromebookunlocked.github.io/assets/logo.png">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="assets/logo.png">
  <link rel="apple-touch-icon" href="assets/logo.png">
  <link rel="shortcut icon" type="image/png" href="assets/logo.png">
  
  <!-- Additional SEO -->
  <meta name="theme-color" content="#ff66ff">
  <link rel="canonical" href="https://chromebookunlocked.github.io/">
  
  <!-- Structured Data for Search Engines -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Chromebook Unlocked Games",
    "url": "https://chromebookunlocked.github.io/",
    "description": "Play free unblocked games at school on your Chromebook. Access 100+ unlocked online games that work on school computers.",
    "image": "https://chromebookunlocked.github.io/assets/logo.png",
    "publisher": {
      "@type": "Organization",
      "name": "Chromebook Unlocked Games",
      "logo": {
        "@type": "ImageObject",
        "url": "https://chromebookunlocked.github.io/assets/logo.png"
      }
    }
  }
  <\/script>
  
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
    :root {
      --base-font: clamp(12px, 1.2vw, 18px);
      --thumb-height: clamp(120px, 15vw, 200px);
      --sidebar-width: clamp(45px, 5vw, 70px);
      --accent: #ff66ff;
      --accent-dark: #cc33ff;
      --accent-light: #ff99ff;
      --background-dark: #1c0033;
      --card-bg: #4d0066;
      --card-hover: #660099;
      --font-main: 'Orbitron', sans-serif;
      --content-max-width: 1400px;
      --grid-gap: clamp(0.8rem, 1.5vw, 1.2rem);
    }
    
    /* basics */
    * { box-sizing: border-box; }
    html,body {
      margin:0; padding:0; height:100%;
      background: linear-gradient(135deg, #0d001a 0%, #1c0033 50%, #2d0052 100%);
      font-family:var(--font-main);
      color:#eee;
      font-size:var(--base-font);
      overflow:hidden;
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 10px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.3);
    }
    ::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, var(--accent), var(--accent-dark));
      border-radius: 5px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--accent-light);
    }
    
    /* Sidebar */
    #sidebar {
      width: var(--sidebar-width);
      background: linear-gradient(180deg, #330066 0%, #1a0033 100%);
      padding:1rem 0;
      height:100vh;
      overflow-y:hidden;
      overflow-x:hidden;
      position:fixed;
      left:0; top:0;
      z-index:1000;
      transition: width .3s ease;
      border-right: 2px solid rgba(255, 102, 255, 0.2);
      box-shadow: 5px 0 20px rgba(255, 102, 255, 0.1);
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE/Edge */
    }
    #sidebar::-webkit-scrollbar {
      display: none; /* Chrome/Safari/Opera */
    }
    #sidebar:hover { 
      width:250px;
      box-shadow: 5px 0 30px rgba(255, 102, 255, 0.3);
      overflow-y:auto;
      overflow-x:hidden;
    }
    
    /* Sidebar expand indicator */
    #sidebarIndicator {
      position: absolute;
      right: 2px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.4;
      transition: all .3s ease;
      pointer-events: none;
      font-size: 1.5rem;
      color: rgba(255, 255, 255, 0.6);
    }
    #sidebar:hover #sidebarIndicator {
      opacity: 0.6;
      right: 5px;
    }
    #sidebarIndicator::before {
      content: '›';
      font-weight: 300;
      transition: transform .3s ease;
    }
    #sidebar:hover #sidebarIndicator::before {
      transform: rotate(180deg);
    }
    
    #sidebar header {
      display:flex;
      justify-content:center;
      margin-bottom:2rem;
      cursor: pointer;
    }
    #sidebar header img {
      height:60px;
      width:auto;
      filter: drop-shadow(0 0 10px var(--accent));
      transition: transform .3s ease;
    }
    #sidebar:hover header img {
      transform: scale(1.1);
    }
    #sidebar ul {
      list-style:none;
      padding:0;
      margin:0;
    }
    #sidebar li {
      cursor:pointer;
      padding:.7rem 1rem;
      margin: 0.5rem;
      border-radius:8px;
      transition:.3s ease;
      white-space:nowrap;
      opacity:0;
      transform:translateX(-10px);
      font-family:var(--font-main);
      font-weight: 600;
      border: 1px solid transparent;
    }
    #sidebar:hover li {
      opacity:1;
      transform:translateX(0);
    }
    #sidebar li:hover {
      background: linear-gradient(135deg, #660099, #7700aa);
      border: 1px solid var(--accent);
      box-shadow:0 0 15px var(--accent);
      color:#fff;
      transform: translateX(5px);
    }
    
    /* Content */
    #content {
      padding:0;
      overflow-y:auto;
      overflow-x:hidden;
      margin-left: var(--sidebar-width);
      width: calc(100% - var(--sidebar-width));
      transition: margin-left .3s;
      height:100vh;
      -webkit-overflow-scrolling: touch;
    }
    
    /* Optimize for Chromebook 11.6" screens (1366x768) */
    @media (max-width: 1366px) and (max-height: 768px) {
      :root {
        --thumb-height: clamp(100px, 12vw, 140px);
        --grid-gap: 0.9rem;
      }
    }
    
    /* Small laptops and tablets */
    @media (max-width: 1024px) {
      #content {
        margin-left: 0;
        width: 100%;
        padding-top: env(safe-area-inset-top);
      }
      #sidebar {
        transform: translateX(-100%);
        width: 250px;
        z-index: 2000;
      }
      #sidebar:hover,
      #sidebar:focus-within {
        transform: translateX(0);
      }
      #sidebarIndicator {
        right: -35px;
        opacity: 0.8;
      }
    }
    
    /* Top Header Bar */
    #topHeader {
      background: linear-gradient(135deg, #330066 0%, #1a0033 100%);
      padding: clamp(1rem, 2vw, 1.5rem) clamp(1rem, 3vw, 2rem);
      border-bottom: 2px solid rgba(255, 102, 255, 0.3);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: clamp(0.8rem, 1.5vw, 1.5rem);
      flex-wrap: wrap;
    }
    
    #topHeader h1 {
      margin: 0;
      font-size: clamp(1.1rem, 2.2vw, 2.2rem);
      font-weight: 900;
      background: linear-gradient(135deg, var(--accent), var(--accent-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      white-space: nowrap;
      cursor: pointer;
      transition: transform .3s ease;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 1;
      min-width: 0;
      order: 1;
    }
    
    #topHeader h1:hover {
      transform: scale(1.05);
    }
    
    #bookmarkBtn {
      order: 2;
      flex-shrink: 0;
    }
    
    #searchContainer {
      order: 3;
      flex: 1;
    }
    
    @media (max-width: 768px) {
      #topHeader {
        flex-direction: row;
        gap: 0.8rem;
        padding: 0.8rem 1rem;
      }
      #topHeader h1 {
        font-size: clamp(1rem, 4vw, 1.5rem);
        order: 1;
        flex: 1;
      }
      #bookmarkBtn {
        order: 2;
      }
      #searchContainer {
        order: 3;
        width: 100%;
        flex-basis: 100%;
      }
    }
    
    #searchContainer {
      flex: 1;
      max-width: 500px;
      min-width: 200px;
      position: relative;
      order: 3;
    }
    
    @media (max-width: 768px) {
      #searchContainer {
        max-width: 100%;
        width: 100%;
        order: 3;
        flex-basis: 100%;
      }
    }
    
    #searchIcon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(255, 255, 255, 0.5);
      pointer-events: none;
      font-size: 1.1rem;
    }
    
    #searchBar {
      width: 100%;
      padding: 0.8rem 1.2rem 0.8rem 3rem;
      border: 2px solid rgba(255, 102, 255, 0.3);
      border-radius: 25px;
      background: rgba(0, 0, 0, 0.4);
      color: #fff;
      font-family: var(--font-main);
      font-size: 1rem;
      outline: none;
      transition: all .3s ease;
    }
    
    #searchBar::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
    
    #searchBar:focus {
      border-color: var(--accent);
      box-shadow: 0 0 20px rgba(255, 102, 255, 0.4);
      background: rgba(0, 0, 0, 0.6);
    }
    
    /* Search Results Dropdown */
    #searchDropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      left: 0;
      right: 0;
      background: rgba(26, 0, 51, 0.98);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(255, 102, 255, 0.4);
      border-radius: 15px;
      max-height: 400px;
      overflow-y: auto;
      display: none;
      z-index: 1000;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 102, 255, 0.3);
    }
    
    #searchDropdown.show {
      display: block;
      animation: slideDown 0.3s ease;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .search-result-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.8rem 1rem;
      cursor: pointer;
      transition: all .2s ease;
      border-bottom: 1px solid rgba(255, 102, 255, 0.1);
    }
    
    .search-result-item:last-child {
      border-bottom: none;
    }
    
    .search-result-item:hover {
      background: rgba(102, 0, 153, 0.5);
      padding-left: 1.5rem;
    }
    
    .search-result-thumb {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid rgba(255, 102, 255, 0.3);
    }
    
    .search-result-name {
      font-family: var(--font-main);
      font-weight: 600;
      color: #fff;
      font-size: 0.95rem;
    }
    
    .search-no-results {
      padding: 1.5rem;
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
      font-family: var(--font-main);
    }
    
    .content-wrapper {
      padding: 1.5rem;
    }
    
    /* Controls (buttons) */
    #controls {
      display:none;
      justify-content:space-between;
      align-items:center;
      max-width:1400px;
      margin:0 auto 1rem auto;
      padding:.5rem;
      font-size:1.1em;
    }
    #controls.active {
      display: flex;
    }
    button {
      padding:.7rem 1.3rem;
      border:none;
      border-radius:12px;
      cursor:pointer;
      font-size:1em;
      background:linear-gradient(135deg,var(--accent),var(--accent-dark));
      color:#fff;
      font-weight:700;
      letter-spacing:.5px;
      transition:all .3s ease;
      box-shadow:0 4px 15px rgba(255, 102, 255, 0.3);
      font-family:var(--font-main);
      border: 1px solid rgba(255, 102, 255, 0.4);
    }
    button:hover {
      transform:translateY(-2px) scale(1.05);
      box-shadow:0 6px 25px rgba(255, 102, 255, 0.5);
    }
    button:active {
      transform:translateY(0) scale(1);
    }
    #backBtn {
      background:linear-gradient(135deg,#ff99ff,var(--accent));
    }
    #fullscreenBtn {
      background:linear-gradient(135deg,var(--accent-dark),#9933ff);
    }
    
    /* Viewer */
    .viewer {
      position:relative;
      display:none;
      justify-content:center;
      align-items:center;
      width:100%;
      max-width: 1400px;
      aspect-ratio:16 / 9;
      background:transparent;
      border-radius:15px;
      overflow:hidden;
      margin:0 auto 2rem auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      transition: all 0.3s ease;
    }
    
    /* Fullscreen viewer styles */
    .viewer:fullscreen {
      max-width: 100vw;
      width: 100vw;
      height: 100vh;
      aspect-ratio: auto;
      border-radius: 0;
      margin: 0;
    }
    
    .viewer:-webkit-full-screen {
      max-width: 100vw;
      width: 100vw;
      height: 100vh;
      aspect-ratio: auto;
      border-radius: 0;
      margin: 0;
    }
    
    .viewer:-moz-full-screen {
      max-width: 100vw;
      width: 100vw;
      height: 100vh;
      aspect-ratio: auto;
      border-radius: 0;
      margin: 0;
    }
    
    .viewer:-ms-fullscreen {
      max-width: 100vw;
      width: 100vw;
      height: 100vh;
      aspect-ratio: auto;
      border-radius: 0;
      margin: 0;
    }
    
    .viewer iframe {
      width:100%;
      height:100%;
      border:none;
      background:transparent;
      loading:lazy;
      sandbox: allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-modals;
    }
    
    /* Fullscreen iframe scaling */
    .viewer:fullscreen iframe,
    .viewer:-webkit-full-screen iframe,
    .viewer:-moz-full-screen iframe,
    .viewer:-ms-fullscreen iframe {
      width: 100vw;
      height: 100vh;
      object-fit: contain;
      sandbox: allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-modals;
    }
    
    /* Play overlay */
    #startOverlay {
      position:absolute;
      inset:0;
      background:linear-gradient(135deg,#330066 0%, #1c0033 50%, #0d001a 100%);
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      gap:1.5rem;
      z-index:10;
      transition:opacity .5s ease;
    }
    
    /* Fullscreen overlay adjustments */
    .viewer:fullscreen #startOverlay,
    .viewer:-webkit-full-screen #startOverlay,
    .viewer:-moz-full-screen #startOverlay,
    .viewer:-ms-fullscreen #startOverlay {
      width: 100vw;
      height: 100vh;
    }
    
    #startOverlay img {
      width:clamp(200px,40vw,350px);
      max-width:80%;
      border-radius:15px;
      box-shadow:0 10px 40px rgba(255, 102, 255, 0.4);
      border: 2px solid rgba(255, 102, 255, 0.3);
    }
    #startOverlay h1 {
      margin:0;
      font-size:clamp(1.5rem,2.5vw,3rem);
      color:#fff;
      font-family:var(--font-main);
      text-shadow: 0 0 20px var(--accent);
      font-weight: 900;
    }
    #startButton {
      padding:1rem 2.5rem;
      font-size:clamp(1rem,1.5vw,1.5rem);
      background:linear-gradient(135deg, var(--accent), var(--accent-dark));
      color:#fff;
      border:none;
      border-radius:12px;
      cursor:pointer;
      transition:.3s;
      font-weight:900;
      font-family:var(--font-main);
      box-shadow:0 5px 25px rgba(255, 102, 255, 0.5);
      border: 2px solid var(--accent-light);
    }
    #startButton:hover {
      background:linear-gradient(135deg, var(--accent-light), var(--accent));
      box-shadow:0 8px 35px rgba(255, 102, 255, 0.7);
      transform: translateY(-3px) scale(1.05);
    }
    
    /* Grid & cards */
    .category {
      margin-top:3rem;
      max-width: var(--content-max-width);
      margin-left: auto;
      margin-right: auto;
      padding: 0 clamp(0.5rem, 2vw, 1rem);
    }
    .category:first-of-type {
      margin-top: 1rem;
    }
    .category h2 {
      color:#ffccff;
      margin-bottom:1rem;
      cursor:pointer;
      font-family:var(--font-main);
      font-weight: 900;
      font-size: clamp(1.3rem, 2vw, 2rem);
      text-shadow: 0 0 15px rgba(255, 102, 255, 0.5);
      padding-bottom: 0.5rem;
      border-bottom: 2px solid rgba(255, 102, 255, 0.3);
    }
    .grid {
      display:grid;
      grid-template-columns: repeat(auto-fill, minmax(clamp(140px, 18vw, 220px), 1fr));
      gap: var(--grid-gap);
      justify-items:center;
      width: 100%;
    }
    
    /* Optimized grid for different screen sizes */
    @media (min-width: 1400px) {
      .grid { grid-template-columns: repeat(6, 1fr); }
    }
    @media (min-width: 1200px) and (max-width: 1399px) {
      .grid { grid-template-columns: repeat(5, 1fr); }
    }
    @media (min-width: 900px) and (max-width: 1199px) {
      .grid { grid-template-columns: repeat(4, 1fr); }
    }
    @media (min-width: 600px) and (max-width: 899px) {
      .grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (min-width: 400px) and (max-width: 599px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 399px) {
      .grid { grid-template-columns: 1fr; }
    }
    
    /* Chromebook 11.6" optimization */
    @media (width: 1366px) and (height: 768px) {
      .grid { grid-template-columns: repeat(5, 1fr); }
    }
    
    .card {
      width:100%;
      background: linear-gradient(135deg, var(--card-bg), #5a0077);
      border-radius:15px;
      overflow:hidden;
      cursor:pointer;
      transition: all .3s ease;
      text-align:center;
      display:flex;
      flex-direction:column;
      align-items:center;
      position:relative;
      border: 2px solid rgba(255, 102, 255, 0.2);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .card:hover {
      transform:translateY(-5px) scale(1.03);
      background: linear-gradient(135deg, var(--card-hover), #7700aa);
      border: 2px solid var(--accent);
      box-shadow: 0 8px 30px rgba(255, 102, 255, 0.5);
    }
    
    @media (hover: none) and (pointer: coarse) {
      .card:active {
        transform:scale(0.98);
      }
    }
    
    .thumb-container {
      width:100%;
      height:var(--thumb-height);
      position:relative;
      overflow:hidden;
      border-radius:12px;
      background:#220033;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .thumb-container::before {
      content:"";
      position:absolute;
      inset:0;
      background-size:cover;
      background-position:center;
      filter: blur(20px) brightness(0.5);
      z-index:0;
      transition:transform .3s ease;
      background-image: var(--thumb-url);
    }
    .card:hover .thumb-container::before {
      transform: scale(1.1);
    }
    .thumb {
      position:relative;
      z-index:1;
      width:100%;
      height:100%;
      object-fit:cover;
      object-position: center;
      transition:transform .3s ease;
      loading:lazy;
    }
    .card:hover .thumb {
      transform:scale(1.08);
    }
    
    .card-title {
      margin:.7rem 0 1rem 0;
      font-family:var(--font-main);
      font-weight: 700;
      font-size: clamp(0.85rem, 1vw, 1rem);
    }
    
    /* "more" card - same size as game cards */
    .card.more {
      background: linear-gradient(135deg, rgba(102, 0, 153, 0.3), rgba(77, 0, 102, 0.3));
      backdrop-filter: blur(10px);
      display:flex;
      justify-content:center;
      align-items:center;
      flex-direction:column;
      color: #ffccff;
      border: 2px dashed rgba(255, 102, 255, 0.4);
      min-height: calc(var(--thumb-height) + 3rem);
      transition: all .3s ease;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        border-color: rgba(255, 102, 255, 0.4);
        box-shadow: 0 4px 15px rgba(255, 102, 255, 0.2);
      }
      50% {
        border-color: rgba(255, 102, 255, 0.7);
        box-shadow: 0 4px 25px rgba(255, 102, 255, 0.4);
      }
    }
    
    .card.more:hover {
      background: linear-gradient(135deg, rgba(102, 0, 153, 0.5), rgba(77, 0, 102, 0.5));
      border: 2px dashed var(--accent);
      transform:translateY(-5px) scale(1.03);
      box-shadow: 0 8px 30px rgba(255, 102, 255, 0.6);
      animation: none;
    }
    
    .card.more .dots {
      font-size: clamp(3rem, 5vw, 4rem);
      line-height:1;
      font-weight: 900;
      background: linear-gradient(135deg, var(--accent), var(--accent-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }
    
    .card.more .label {
      font-size: clamp(0.9rem, 1.2vw, 1.1rem);
      opacity: 0.9;
      font-family: var(--font-main);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    /* DMCA */
    #dmcaLink {
      display: block;
      text-align: center;
      background: transparent;
      color: rgba(255, 255, 255, 0.4);
      padding: 0.8rem 1rem;
      font-size: 0.7rem;
      text-decoration: none;
      transition: color .3s;
      font-family: var(--font-main);
      font-weight: 300;
      margin-top: 4rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    #dmcaLink:hover {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: underline;
    }
  </style>
</head>
<body>
  
  <!-- Sidebar -->
  <div id="sidebar">
    <div id="sidebarIndicator"></div>
    <header onclick="goToHome()"><img src="assets/logo.png" alt="Logo"></header>
    <ul id="categoryList">
      <li onclick="filterCategory('Home')">Home</li>
      ${finalSidebarCategories}
    </ul>
  </div>

  <!-- Content -->
  <div id="content">
    <!-- Top Header with Search -->
    <div id="topHeader">
      <h1 onclick="goToHome()">Chromebook Unlocked Games</h1>
      <button id="bookmarkBtn" onclick="addToBookmarks()">
        <span>⭐</span>
        <span class="bookmark-text">Bookmark</span>
      </button>
      <div id="searchContainer">
        <span id="searchIcon">🔍</span>
        <input type="text" id="searchBar" placeholder="Search games..." oninput="searchGames(this.value)">
        <div id="searchDropdown"></div>
      </div>
    </div>

    <div class="content-wrapper">
      <div id="controls">
        <button id="backBtn" onclick="closeGame()">← Back</button>
        <span id="gameTitle"></span>
        <button id="fullscreenBtn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
      </div>
      
      <div class="viewer" id="viewer">
        <div id="startOverlay">
          <img id="startThumb" src="" alt="Game Thumbnail">
          <h1 id="startName"></h1>
          <button id="startButton" onclick="startGame()">▶ Play</button>
        </div>
        <iframe id="gameFrame" src=""></iframe>
      </div>

      <!-- Recently Played -->
      <div class="category" data-category="Recently Played" id="recentlyPlayedSection" style="display:none;">
        <h2>Recently Played</h2>
        <div class="grid" id="recentlyPlayedGrid"></div>
      </div>

      <!-- All category sections (including games for home view) -->
      ${Object.keys(categories).map(cat => {
        const list = categories[cat];
        return `<div class="category" data-category="${cat}">
          <h2>${cat}</h2>
          <div class="grid">
            ${list.map((g, i) => generateGameCard(g, i)).join('')}
          </div>
        </div>`;
      }).join('')}
      
      <a href="dmca.html" id="dmcaLink" target="_blank">DMCA</a>
    </div>
  </div>

  <script>
    const MAX_RECENT = 25;
    const offsets = {}; // offsets[category] = number of revealed rows - 1
    let gameViewActive = false; // Track if game viewer is open
    let currentViewMode = 'home'; // Track current view: 'home' or 'category'
    
    // Get all valid game folders
    function getValidGameFolders() {
      const folders = new Set();
      document.querySelectorAll('.game-card[data-folder]').forEach(card => {
        folders.add(card.getAttribute('data-folder'));
      });
      return folders;
    }
    
    // Clean recently played - remove games that no longer exist
    function cleanRecentlyPlayed() {
      const validFolders = getValidGameFolders();
      let list = [];
      try {
        list = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
      } catch(e) { list = []; }
      
      // Filter out games whose folders don't exist anymore
      const cleaned = list.filter(game => validFolders.has(game.folder));
      
      // Only update if something was removed
      if (cleaned.length !== list.length) {
        localStorage.setItem('recentlyPlayed', JSON.stringify(cleaned));
        console.log('Cleaned recently played:', list.length - cleaned.length, 'games removed');
        return cleaned;
      }
      return list;
    }
    
    // Validate game exists before showing
    function gameExists(folder) {
      const validFolders = getValidGameFolders();
      return validFolders.has(folder);
    }
    
    // Helper: get grid element for a category
    function gridForCategory(cat) {
      return Array.from(document.querySelectorAll('.category'))
        .find(el => el.getAttribute('data-category') === cat)
        ?.querySelector('.grid');
    }
    
    // Helper: compute number of columns currently active for a grid
    function getColumnCount(grid) {
      if (!grid) return 1;
      const style = window.getComputedStyle(grid);
      const cols = style.gridTemplateColumns;
      if (!cols) return 1;
      return cols.split(' ').filter(Boolean).length;
    }
    
    // Create a "more" element
    function createMoreCard(cat) {
      const more = document.createElement('div');
      more.className = 'card more';
      more.innerHTML = '<div class="dots">⋯</div><div class="label">Show More</div>';
      more.addEventListener('click', (e) => {
        offsets[cat] = (offsets[cat] || 0) + 1;
        updateCategoryView(cat);
      });
      return more;
    }
    
    // Show/hide cards for a category grid based on offset and current columns
    function updateCategoryView(cat) {
      const grid = gridForCategory(cat);
      if (!grid) return;
      
      // Remove any existing .card.more
      const existingMore = grid.querySelector('.card.more');
      if (existingMore) existingMore.remove();
      
      // Gather game-card elements
      const cards = Array.from(grid.querySelectorAll('.game-card'));
      const total = cards.length;
      
      // If game viewer is active OR viewing specific category, show all cards
      if (gameViewActive || currentViewMode === 'category') {
        cards.forEach(c => c.style.display = '');
        return;
      }
      
      const cols = getColumnCount(grid);
      
      // Number of rows currently revealed
      const rowsRevealed = (offsets[cat] || 0) + 1;
      const slots = rowsRevealed * cols;
      
      // Check if we need a "more" card (only on home page)
      const showMore = total > slots && currentViewMode === 'home';
      
      // Number of actual game items to show
      const showCount = showMore ? (slots - 1) : Math.min(total, slots);
      
      // Show/hide cards
      cards.forEach((c, idx) => {
        c.style.display = (idx < showCount) ? '' : 'none';
      });
      
      // If we should show a More card, append it at the end
      if (showMore) {
        const moreCard = createMoreCard(cat);
        grid.appendChild(moreCard);
      }
    }
    
    // Update all categories
    function updateAllCategories() {
      const cats = Array.from(document.querySelectorAll('.category')).map(c => c.getAttribute('data-category'));
      cats.forEach(cat => {
        if (offsets[cat] === undefined) offsets[cat] = 0;
        
        const grid = gridForCategory(cat);
        if (!grid) return;
        
        const cards = Array.from(grid.querySelectorAll('.game-card'));
        const total = cards.length;
        const cols = getColumnCount(grid) || 1;
        const maxRows = Math.ceil(total / cols);
        const maxOffset = Math.max(0, maxRows - 1);
        
        if (offsets[cat] > maxOffset) offsets[cat] = maxOffset;
        
        updateCategoryView(cat);
      });
    }
    
    // Populate Recently Played grid
    function loadRecentlyPlayed() {
      const list = cleanRecentlyPlayed(); // Clean before loading
      
      const recentSection = document.getElementById('recentlyPlayedSection');
      const recentGrid = document.getElementById('recentlyPlayedGrid');
      if (!recentGrid) return;
      
      recentGrid.innerHTML = '';
      
      if (!list.length) {
        if (recentSection) recentSection.style.display = 'none';
        return;
      }
      
      if (recentSection) recentSection.style.display = 'block';
      
      const displayList = list.slice(0, MAX_RECENT);
      
      // Double-check each game exists before displaying
      displayList.forEach((g, i) => {
        // Verify game still exists
        if (!gameExists(g.folder)) {
          console.log('Skipping deleted game:', g.folder);
          return;
        }
        
        const card = document.createElement('div');
        card.className = 'card game-card';
        card.setAttribute('data-index', i);
        card.setAttribute('data-folder', g.folder);
        card.setAttribute('data-name', g.name.toLowerCase());
        
        // Add error handling for broken images
        const thumbUrl = g.thumb || 'assets/logo.png';
        
        card.onclick = () => {
          // Verify game exists before opening
          if (!gameExists(g.folder)) {
            alert('This game is no longer available.');
            cleanRecentlyPlayed();
            loadRecentlyPlayed();
            return;
          }
          prepareGame(encodeURIComponent(g.folder), encodeURIComponent(g.name), thumbUrl);
        };
        
        card.innerHTML = \`<div class="thumb-container" style="--thumb-url: url('\${thumbUrl}')">
          <img class="thumb" src="\${thumbUrl}" alt="\${g.name}" onerror="this.src='assets/logo.png'">
        </div>
        <div class="card-title">\${g.name}</div>\`;
        recentGrid.appendChild(card);
      });
      
      if (offsets['Recently Played'] === undefined) offsets['Recently Played'] = 0;
      updateCategoryView('Recently Played');
      
      // If grid is empty after cleanup, hide section
      if (recentGrid.children.length === 0) {
        recentSection.style.display = 'none';
      }
    }
    
    // Search functionality with dropdown
    function searchGames(query) {
      const searchTerm = query.toLowerCase().trim();
      const searchDropdown = document.getElementById('searchDropdown');
      
      if (!searchTerm) {
        // Hide dropdown when search is empty
        searchDropdown.classList.remove('show');
        searchDropdown.innerHTML = '';
        return;
      }
      
      // Collect all matching games
      const matchingGames = [];
      const seenFolders = new Set();
      
      document.querySelectorAll('.game-card[data-folder]').forEach(card => {
        const gameName = card.getAttribute('data-name') || '';
        const gameFolder = card.getAttribute('data-folder');
        const gameTitle = card.querySelector('.card-title')?.textContent || '';
        const thumbImg = card.querySelector('.thumb');
        const thumbSrc = thumbImg ? thumbImg.src : '';
        
        if (gameName.includes(searchTerm) && !seenFolders.has(gameFolder)) {
          seenFolders.add(gameFolder);
          matchingGames.push({
            folder: gameFolder,
            name: gameTitle,
            thumb: thumbSrc,
            onclick: card.getAttribute('onclick')
          });
        }
      });
      
      // Sort by relevance (exact matches first, then starts with, then contains)
      matchingGames.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Exact match
        if (aName === searchTerm) return -1;
        if (bName === searchTerm) return 1;
        
        // Starts with search term
        if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
        if (!aName.startsWith(searchTerm) && bName.startsWith(searchTerm)) return 1;
        
        // Alphabetical
        return aName.localeCompare(bName);
      });
      
      // Limit to top 8 results
      const topResults = matchingGames.slice(0, 8);
      
      // Display results in dropdown
      if (topResults.length === 0) {
        searchDropdown.innerHTML = '<div class="search-no-results">No games found</div>';
      } else {
        searchDropdown.innerHTML = topResults.map(game => {
          return \`<div class="search-result-item" onclick="\${game.onclick}; hideSearchDropdown();">
            <img class="search-result-thumb" src="\${game.thumb}" alt="\${game.name}">
            <div class="search-result-name">\${game.name}</div>
          </div>\`;
        }).join('');
      }
      
      searchDropdown.classList.add('show');
    }
    
    function hideSearchDropdown() {
      const searchDropdown = document.getElementById('searchDropdown');
      const searchBar = document.getElementById('searchBar');
      searchDropdown.classList.remove('show');
      searchBar.value = '';
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const searchContainer = document.getElementById('searchContainer');
      const searchDropdown = document.getElementById('searchDropdown');
      if (searchContainer && !searchContainer.contains(e.target)) {
        searchDropdown.classList.remove('show');
      }
    });
    
    // Navigate to home page
    function goToHome() {
      window.location.hash = '';
      const searchBar = document.getElementById('searchBar');
      if (searchBar) searchBar.value = '';
      hideSearchDropdown();
      closeGame();
      filterCategory('Home');
    }
    
    // Prepare game (open viewer overlay)
    let currentGameFolder = null;
    const viewer = document.getElementById('viewer');
    const frame = document.getElementById('gameFrame');
    const controls = document.getElementById('controls');
    const gameTitle = document.getElementById('gameTitle');
    const startOverlay = document.getElementById('startOverlay');
    const startThumb = document.getElementById('startThumb');
    const startName = document.getElementById('startName');
    
    function prepareGame(folderEncoded, nameEncoded, thumbSrc) {
      const folder = decodeURIComponent(folderEncoded);
      const name = decodeURIComponent(nameEncoded);
      
      // Verify game exists before opening
      if (!gameExists(folder)) {
        alert('This game is no longer available.');
        cleanRecentlyPlayed();
        loadRecentlyPlayed();
        return;
      }
      
      currentGameFolder = folder;
      frame.src = '';
      viewer.style.display = 'flex';
      controls.classList.add('active');
      gameTitle.textContent = name;
      startThumb.src = thumbSrc || 'assets/logo.png';
      
      // Add error handler for thumbnail
      startThumb.onerror = () => {
        startThumb.src = 'assets/logo.png';
      };
      
      startName.textContent = name;
      startOverlay.style.opacity = '1';
      startOverlay.style.pointerEvents = 'auto';
      window.location.hash = '#/game/' + folderEncoded;
      document.getElementById('content').scrollTop = 0;
      
      // Set game view active
      gameViewActive = true;
      
      // CRITICAL: Force hide Recently Played section immediately
      const recentlyPlayedSection = document.getElementById('recentlyPlayedSection');
      if (recentlyPlayedSection) {
        recentlyPlayedSection.style.display = 'none';
        recentlyPlayedSection.style.visibility = 'hidden';
      }
      
      // Hide all other categories
      document.querySelectorAll('.category').forEach(cat => {
        if (cat.id !== 'curatedGamesSection') {
          cat.style.display = 'none';
        }
      });
      
      showCuratedGames(folder);
      
      saveRecentlyPlayed({ folder, name, thumb: thumbSrc || 'assets/logo.png' });
    }
    
    // Show curated games when game viewer is open
    function showCuratedGames(currentGameFolder) {
      console.log('=== Starting showCuratedGames for:', currentGameFolder);
      
      // Hide search results if visible
      const searchResults = document.getElementById('searchResultsSection');
      if (searchResults) searchResults.style.display = 'none';
      
      // ✅ CRITICAL: Force hide Recently Played with multiple methods
      const recentSection = document.getElementById('recentlyPlayedSection');
      if (recentSection) {
        recentSection.style.display = 'none';
        recentSection.style.visibility = 'hidden';
        recentSection.style.position = 'absolute';
        recentSection.style.top = '-9999px';
      }
      
      // First, find current game's category from the original game categories
      let currentCategory = null;
      const categorySections = document.querySelectorAll('.category');
      
      categorySections.forEach(cat => {
        const catName = cat.getAttribute('data-category');
        if (catName === 'Recently Played' || 
            cat.id === 'recentlyPlayedSection' ||
            cat.id === 'searchResultsSection' ||
            cat.id === 'curatedGamesSection') {
          return;
        }
        
        const gameCards = cat.querySelectorAll('.game-card[data-folder]');
        gameCards.forEach(card => {
          if (card.getAttribute('data-folder') === currentGameFolder) {
            currentCategory = catName;
            console.log('Found current game in category:', catName);
          }
        });
      });
      
      // Collect ALL games from ALL real categories (including hidden ones)
      const allGames = [];
      const sameCategory = [];
      const seenFolders = new Set();
      seenFolders.add(currentGameFolder); // Don't include current game
      
      categorySections.forEach(cat => {
        const catName = cat.getAttribute('data-category');
        
        // Skip special sections
        if (catName === 'Recently Played' || 
            cat.id === 'recentlyPlayedSection' ||
            cat.id === 'searchResultsSection' ||
            cat.id === 'curatedGamesSection') {
          return;
        }
        
        console.log('Processing category:', catName);
        
        // Get ALL game cards regardless of their display state
        const gameCards = cat.querySelectorAll('.game-card[data-folder]');
        console.log('  Found', gameCards.length, 'game cards in', catName);
        
        gameCards.forEach(card => {
          const folder = card.getAttribute('data-folder');
          
          // Skip if already seen
          if (seenFolders.has(folder)) {
            return;
          }
          
          seenFolders.add(folder);
          
          // Clone and ensure the card is visible
          const clonedCard = card.cloneNode(true);
          clonedCard.style.display = ''; // Force show
          clonedCard.style.visibility = 'visible';
          
          const gameData = {
            card: clonedCard,
            folder: folder,
            category: catName
          };
          
          allGames.push(gameData);
          
          if (catName === currentCategory) {
            sameCategory.push(gameData);
          }
        });
      });
      
      console.log('Total unique games collected:', allGames.length);
      console.log('Same category games:', sameCategory.length);
      
      if (allGames.length === 0) {
        console.error('ERROR: No games found! This should not happen.');
        return;
      }
      
      // Shuffle arrays
      const shuffleArray = (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };
      
      const shuffledSameCategory = shuffleArray(sameCategory);
      const shuffledAllGames = shuffleArray(allGames);
      
      // Build curated list - target 15 games
      const curatedGames = [];
      const targetCount = 15;
      
      if (sameCategory.length === 0) {
        // No same category - use all random
        console.log('No same category games, using all random');
        curatedGames.push(...shuffledAllGames.slice(0, Math.min(targetCount, shuffledAllGames.length)));
      } else {
        // Mix: 60% same category, 40% other
        const sameCatTarget = Math.min(Math.ceil(targetCount * 0.6), sameCategory.length);
        console.log('Target same category games:', sameCatTarget);
        
        // Add same category games
        curatedGames.push(...shuffledSameCategory.slice(0, sameCatTarget));
        console.log('Added same category games:', curatedGames.length);
        
        // Add other games
        const usedFolders = new Set(curatedGames.map(g => g.folder));
        const otherGames = shuffledAllGames.filter(g => !usedFolders.has(g.folder));
        const remainingSlots = targetCount - curatedGames.length;
        
        console.log('Other games available:', otherGames.length);
        console.log('Remaining slots to fill:', remainingSlots);
        
        curatedGames.push(...otherGames.slice(0, remainingSlots));
      }
      
      console.log('FINAL curated games count:', curatedGames.length);
      
      // Final shuffle
      const finalCurated = shuffleArray(curatedGames);
      
      // Hide all other categories
      categorySections.forEach(cat => {
        if (cat.id !== 'curatedGamesSection') {
          cat.style.display = 'none';
        }
      });
      
      // Create or update curated section
      let curatedSection = document.getElementById('curatedGamesSection');
      if (!curatedSection) {
        curatedSection = document.createElement('div');
        curatedSection.id = 'curatedGamesSection';
        curatedSection.className = 'category';
        curatedSection.innerHTML = '<h2>You Might Also Like</h2><div class="grid" id="curatedGamesGrid"></div>';
        const viewer = document.querySelector('.viewer');
        if (viewer.nextSibling) {
          viewer.parentNode.insertBefore(curatedSection, viewer.nextSibling);
        } else {
          viewer.parentNode.appendChild(curatedSection);
        }
      }
      
      curatedSection.style.display = 'block';
      const curatedGrid = document.getElementById('curatedGamesGrid');
      curatedGrid.innerHTML = '';
      
      console.log('Appending games to grid...');
      finalCurated.forEach((game, idx) => {
        console.log('  Appending game', idx + 1, ':', game.folder);
        curatedGrid.appendChild(game.card);
      });
      
      console.log('=== Finished showCuratedGames');
    }
    
    function startGame() {
      if (!currentGameFolder) return;
      
      const gameUrl = 'games/' + currentGameFolder + '/index.html';
      frame.src = gameUrl;
      
      // Additional security: Listen for frame navigation attempts
      frame.addEventListener('load', () => {
        try {
          // Prevent frame from navigating away
          if (frame.contentWindow) {
            const originalOpen = frame.contentWindow.open;
            frame.contentWindow.open = function() {
              console.log('Blocked window.open() attempt from game');
              return null;
            };
            
            // Block top navigation
            Object.defineProperty(frame.contentWindow, 'top', {
              get: function() { return frame.contentWindow; }
            });
            
            Object.defineProperty(frame.contentWindow, 'parent', {
              get: function() { return frame.contentWindow; }
            });
          }
        } catch(e) {
          // Cross-origin restrictions prevent this, which is good
          console.log('Frame security applied (cross-origin safe)');
        }
      });
      
      startOverlay.style.opacity = '0';
      startOverlay.style.pointerEvents = 'none';
    }
    
    function closeGame() {
      frame.src = '';
      viewer.style.display = 'none';
      controls.classList.remove('active');
      gameTitle.textContent = '';
      currentGameFolder = null;
      startOverlay.style.opacity = '1';
      startOverlay.style.pointerEvents = 'auto';
      window.location.hash = '';
      
      // Deactivate game view and restore normal category view
      gameViewActive = false;
      
      // Hide curated and search results sections
      const curatedSection = document.getElementById('curatedGamesSection');
      if (curatedSection) curatedSection.style.display = 'none';
      
      const searchResults = document.getElementById('searchResultsSection');
      if (searchResults) searchResults.style.display = 'none';
      
      // Restore Recently Played visibility
      const recentlyPlayedSection = document.getElementById('recentlyPlayedSection');
      if (recentlyPlayedSection) {
        const recentGrid = document.getElementById('recentlyPlayedGrid');
        if (recentGrid && recentGrid.children.length > 0) {
          recentlyPlayedSection.style.display = 'block';
          recentlyPlayedSection.style.visibility = 'visible';
          recentlyPlayedSection.style.position = 'relative';
          recentlyPlayedSection.style.top = 'auto';
        }
      }
      
      // Show all normal categories again
      document.querySelectorAll('.category').forEach(cat => {
        const category = cat.getAttribute('data-category');
        if (category === 'Recently Played') {
          const recentGrid = document.getElementById('recentlyPlayedGrid');
          cat.style.display = (recentGrid && recentGrid.children.length > 0) ? 'block' : 'none';
        } else if (cat.id !== 'curatedGamesSection' && cat.id !== 'searchResultsSection') {
          cat.style.display = 'block';
        }
      });
      
      // Restore "show more" functionality
      updateAllCategories();
    }
    
    function toggleFullscreen() {
      const viewerElement = document.querySelector('.viewer');
      
      if (!document.fullscreenElement && !document.webkitFullscreenElement && 
          !document.mozFullScreenElement && !document.msFullscreenElement) {
        // Enter fullscreen
        if (viewerElement.requestFullscreen) {
          viewerElement.requestFullscreen();
        } else if (viewerElement.webkitRequestFullscreen) {
          viewerElement.webkitRequestFullscreen();
        } else if (viewerElement.mozRequestFullScreen) {
          viewerElement.mozRequestFullScreen();
        } else if (viewerElement.msRequestFullscreen) {
          viewerElement.msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    }
    
    // Listen for fullscreen changes to adjust iframe
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    function handleFullscreenChange() {
      const viewer = document.querySelector('.viewer');
      const iframe = document.getElementById('gameFrame');
      
      if (document.fullscreenElement || document.webkitFullscreenElement || 
          document.mozFullScreenElement || document.msFullscreenElement) {
        // Entering fullscreen
        console.log('Entered fullscreen mode');
      } else {
        // Exiting fullscreen
        console.log('Exited fullscreen mode');
      }
    }
    
    // Recently played storage helpers
    function saveRecentlyPlayed(game) {
      let list = cleanRecentlyPlayed(); // Clean before saving
      
      list = list.filter(g => g.folder !== game.folder);
      list.unshift(game);
      if (list.length > MAX_RECENT) list = list.slice(0, MAX_RECENT);
      localStorage.setItem('recentlyPlayed', JSON.stringify(list));
      loadRecentlyPlayed();
    }
    
    // Category filtering (clicking sidebar)
    function filterCategory(cat) {
      const all = document.querySelectorAll('.category');
      const searchBar = document.getElementById('searchBar');
      
      // Close game window if it's open
      if (gameViewActive) {
        closeGame();
      }
      
      // Clear search when changing categories
      if (searchBar) searchBar.value = '';
      hideSearchDropdown();
      
      // Hide search and curated sections
      const searchResults = document.getElementById('searchResultsSection');
      if (searchResults) searchResults.style.display = 'none';
      
      const curatedSection = document.getElementById('curatedGamesSection');
      if (curatedSection) curatedSection.style.display = 'none';
      
      if (cat === 'Home') {
        currentViewMode = 'home';
        all.forEach(c => {
          const category = c.getAttribute('data-category');
          
          // Skip special sections
          if (c.id === 'searchResultsSection' || c.id === 'curatedGamesSection') return;
          
          // Show recently played and all categories on home
          if (category === 'Recently Played') {
            const recentGrid = document.getElementById('recentlyPlayedGrid');
            c.style.display = (recentGrid && recentGrid.children.length > 0) ? 'block' : 'none';
          } else {
            c.style.display = 'block';
          }
        });
      } else {
        currentViewMode = 'category';
        all.forEach(c => {
          const category = c.getAttribute('data-category');
          
          // Skip special sections
          if (c.id === 'searchResultsSection' || c.id === 'curatedGamesSection') return;
          
          // Show only selected category (show all games at once)
          c.style.display = (category === cat) ? 'block' : 'none';
        });
      }
      
      document.getElementById('content').scrollTop = 0;
      updateAllCategories();
    }
    
    // Routing & deep links
    function handleRouting() {
      const hash = window.location.hash;
      if (hash.startsWith('#/game/')) {
        const folder = decodeURIComponent(hash.replace('#/game/', ''));
        
        // Check if game exists before trying to open
        if (!gameExists(folder)) {
          console.log('Game not found:', folder);
          alert('This game is no longer available.');
          window.location.hash = '';
          return;
        }
        
        const cards = Array.from(document.querySelectorAll('.game-card'));
        const card = cards.find(c => c.getAttribute('onclick')?.includes(encodeURIComponent(folder)));
        if (card) card.click();
      } else {
        closeGame();
        filterCategory('Home');
      }
    }
    
    // On window resize
    let resizeTimeout = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateAllCategories();
      }, 120);
    });
    
    // Initial load
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.category').forEach(c => {
        const cat = c.getAttribute('data-category');
        if (offsets[cat] === undefined) offsets[cat] = 0;
      });
      
      document.querySelectorAll('.thumb-container').forEach(tc => {
        const img = tc.querySelector('img.thumb');
        if (img && (!tc.style.getPropertyValue('--thumb-url') || tc.style.getPropertyValue('--thumb-url') === '')) {
          tc.style.setProperty('--thumb-url', "url('" + img.src + "')");
        }
      });
      
      // Add error handlers to all thumbnails
      document.querySelectorAll('img.thumb').forEach(img => {
        img.onerror = function() {
          this.onerror = null; // Prevent infinite loop
          this.src = 'assets/logo.png';
          const container = this.closest('.thumb-container');
          if (container) {
            container.style.setProperty('--thumb-url', "url('assets/logo.png')");
          }
        };
      });
      
      loadRecentlyPlayed();
      updateAllCategories();
      handleRouting();
      window.addEventListener('hashchange', handleRouting);
    });
  </script>
</body>
</html>`;

// Write output
fs.writeFileSync(outputFile, html);
console.log("✅ Build complete: index.html generated");
