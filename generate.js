const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const gamesDir = path.join(__dirname, "games");
const outputDir = path.join(__dirname, "dist");
const outputFile = path.join(outputDir, "index.html");
const templatesDir = path.join(__dirname, "templates");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Load CSS templates
const mainStyles = fs.readFileSync(path.join(templatesDir, "main-styles.css"), "utf8");
const gamePageStyles = fs.readFileSync(path.join(templatesDir, "game-page-styles.css"), "utf8");

// Load games with validation and error handling
const games = fs.readdirSync(dataDir)
  .filter(f => f.endsWith(".json"))
  .map(f => {
    try {
      const filePath = path.join(dataDir, f);
      const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Support multiple categories (comma-separated string or array)
      let gameCategories = json.category || json.categories || "Uncategorized";
      if (typeof gameCategories === 'string') {
        gameCategories = gameCategories.split(',').map(c => c.trim());
      }
      if (!Array.isArray(gameCategories)) {
        gameCategories = [gameCategories];
      }

      const folder = json.folder || f.replace(".json", "");

      // Validate game folder and index.html exist
      const gamePath = path.join(gamesDir, folder);
      const indexPath = path.join(gamePath, "index.html");

      if (!fs.existsSync(gamePath)) {
        console.log(`⚠️  Skipping game "${json.name || folder}" - folder not found at: ${gamePath}`);
        return null;
      }

      if (!fs.existsSync(indexPath)) {
        console.log(`⚠️  Skipping game "${json.name || folder}" - index.html not found`);
        return null;
      }

      return {
        folder: folder,
        name: json.name || f.replace(".json", ""),
        categories: gameCategories, // Array of categories
        thumbs: json.thumbs && json.thumbs.length ? json.thumbs : ["thumbnail.png", "thumbnail.jpg"],
        dateAdded: json.dateAdded || null // Support for "Newly Added" sorting
      };
    } catch (error) {
      console.error(`❌ Error processing ${f}: ${error.message}`);
      return null;
    }
  })
  .filter(game => game !== null); // Remove invalid games

if (games.length === 0) {
  console.error("❌ No valid games found! Build aborted.");
  process.exit(1);
}

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
  return `<div class="card game-card" data-index="${idx}" data-folder="${game.folder}" data-name="${game.name.toLowerCase()}" onclick="window.location.href='${game.folder}.html'">
    <div class="thumb-container" style="--thumb-url: url('games/${game.folder}/${thumb}')">
      <img class="thumb" src="games/${game.folder}/${thumb}" alt="${game.name}">
    </div>
    <div class="card-title">${game.name}</div>
  </div>`;
}

// Sidebar categories - exclude "Newly Added" and "Recently Played"
const sidebarCategories = Object.keys(categories)
  .filter(cat => cat !== "Recently Played" && cat !== "Newly Added")
  .map(cat => `<li role="menuitem" tabindex="0" onclick="filterCategory('${cat}')" onkeypress="if(event.key==='Enter')filterCategory('${cat}')">${cat}</li>`)
  .join("");

// Add "Newly Added" at the top if it exists
const newlyAddedItem = categories['Newly Added'] ?
  `<li role="menuitem" tabindex="0" onclick="filterCategory('Newly Added')" onkeypress="if(event.key==='Enter')filterCategory('Newly Added')" style="border-bottom: 1px solid rgba(255,102,255,0.3); padding-bottom: 0.8rem; margin-bottom: 0.8rem;">✨ Newly Added</li>` : '';

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
  <link rel="icon" type="image/png" sizes="48x48" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="96x96" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="144x144" href="assets/logo.png">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/logo.png">
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
  </script>
  
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
    :root {
      --base-font: clamp(11px, 1vw, 16px);
      --thumb-height: clamp(100px, 12vw, 200px);
      --sidebar-width: clamp(40px, 4vw, 70px);
      --accent: #ff66ff;
      --accent-dark: #cc33ff;
      --accent-light: #ff99ff;
      --background-dark: #1c0033;
      --card-bg: #4d0066;
      --card-hover: #660099;
      --font-main: 'Orbitron', sans-serif;
      --content-max-width: min(1400px, 95vw);
      --grid-gap: clamp(0.6rem, 1.2vw, 1rem);
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
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.3);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(102, 0, 153, 0.8);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(128, 0, 192, 0.9);
    }
    
    /* Firefox scrollbar */
    * {
      scrollbar-width: thin;
      scrollbar-color: rgba(102, 0, 153, 0.8) rgba(0, 0, 0, 0.3);
    }

    /* Accessibility: Skip link */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--accent);
      color: white;
      padding: 8px 16px;
      text-decoration: none;
      font-weight: bold;
      z-index: 10000;
      border-radius: 0 0 4px 0;
    }
    .skip-link:focus {
      top: 0;
    }

    /* Screen reader only text */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
    
    /* Sidebar */
    #sidebar {
      width: var(--sidebar-width);
      background: linear-gradient(180deg, #330066 0%, #1a0033 100%);
      padding:0;
      height:100vh;
      overflow-y:auto;
      overflow-x:hidden;
      position:fixed;
      left:0; top:0;
      z-index:1000;
      transition: width .3s ease;
      border-right: 2px solid rgba(255, 102, 255, 0.2);
      box-shadow: 5px 0 20px rgba(255, 102, 255, 0.1);
      display: flex;
      flex-direction: column;
      scrollbar-width: none; /* Firefox - hidden by default */
    }
    
    /* Hide scrollbar when sidebar is minimized */
    #sidebar::-webkit-scrollbar {
      width: 0;
      display: none;
    }
    
    #sidebar::-webkit-scrollbar-track {
      background-color: transparent;
    }
    
    #sidebar::-webkit-scrollbar-thumb {
      background-color: transparent;
      border-radius: 4px;
    }
    
    /* Show scrollbar only when sidebar is hovered/expanded */
    #sidebar:hover {
      width:250px;
      box-shadow: 5px 0 30px rgba(255, 102, 255, 0.3);
      scrollbar-width: thin; /* Firefox - show on hover */
    }
    
    #sidebar:hover::-webkit-scrollbar {
      width: 8px;
      display: block;
    }
    
    #sidebar:hover::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.3);
    }
    
    #sidebar:hover::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, var(--accent), var(--accent-dark));
    }
    
    /* Sidebar expand indicator */
    #sidebarIndicator {
      position: fixed;
      left: calc(var(--sidebar-width) - 15px);
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.5;
      transition: all .3s ease;
      pointer-events: none;
      font-size: 1.8rem;
      color: rgba(255, 255, 255, 0.7);
      z-index: 999;
      text-shadow: 0 0 10px rgba(255, 102, 255, 0.5);
    }
    #sidebar:hover ~ #sidebarIndicator {
      opacity: 0;
      left: 240px;
    }
    #sidebarIndicator::before {
      content: '›';
      font-weight: 300;
      transition: transform .3s ease;
      display: block;
    }
    #sidebar:hover ~ #sidebarIndicator::before {
      transform: rotate(180deg);
    }
    
    #sidebar header {
      display:flex;
      justify-content:center;
      padding: 1rem 0;
      cursor: pointer;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      background: transparent;
      z-index: 10;
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
      padding:1rem 0;
      margin:0;
      overflow-y: auto;
      overflow-x: hidden;
      flex: 1;
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
      padding: clamp(0.8rem, 1.5vw, 1.5rem) clamp(0.8rem, 2vw, 2rem);
      border-bottom: 2px solid rgba(255, 102, 255, 0.3);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: clamp(0.8rem, 1.5vw, 2rem);
      flex-wrap: wrap;
    }
    
    #topHeader h1 {
      margin: 0;
      font-size: clamp(1rem, 1.8vw, 2rem);
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
    }
    
    #topHeader h1:hover {
      transform: scale(1.05);
    }
    
    @media (max-width: 768px) {
      #topHeader {
        flex-direction: column;
        gap: 0.8rem;
        padding: 0.8rem 1rem;
      }
      #topHeader h1 {
        font-size: clamp(1rem, 4vw, 1.5rem);
        width: 100%;
        text-align: center;
      }
    }
    
    #searchContainer {
      flex: 1;
      max-width: 500px;
      min-width: 200px;
      position: relative;
    }
    
    @media (max-width: 768px) {
      #searchContainer {
        max-width: 100%;
        width: 100%;
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
      padding: 0.5rem 1.5rem 1.5rem 1.5rem;
    }
    
    /* Controls (buttons) */
    #controls {
      display:none;
      justify-content:space-between;
      align-items:center;
      max-width:1400px;
      margin:0 auto 1.2rem auto;
      padding:1rem 1.5rem;
      font-size:1.1em;
      gap: 1.5rem;
      background: linear-gradient(135deg, rgba(51, 0, 102, 0.4), rgba(26, 0, 51, 0.4));
      border-radius: 15px;
      border: 2px solid rgba(255, 102, 255, 0.25);
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    #controls.active {
      display: flex;
      animation: slideDown 0.4s ease;
    }
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
      min-width: 140px;
      white-space: nowrap;
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
    #gameTitle {
      flex: 1;
      text-align: center;
      font-weight: 700;
      font-size: clamp(1rem, 2vw, 1.3rem);
    }
    
    @media (max-width: 768px) {
      #controls {
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      button {
        font-size: 0.9em;
        padding: 0.6rem 1rem;
        min-width: 100px;
      }
      #gameTitle {
        width: 100%;
        order: -1;
        margin-bottom: 0.5rem;
      }
    }
    
    /* Banner Ad Containers */
    .ad-banner-container {
      display: none;
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      width: 160px;
      height: 600px;
      z-index: 50;
      background: rgba(26, 0, 51, 0.3);
      border: 1px solid rgba(255, 102, 255, 0.2);
      border-radius: 10px;
      backdrop-filter: blur(10px);
      overflow: hidden;
    }
    
    .ad-banner-left {
      left: 10px;
    }
    
    .ad-banner-right {
      right: 10px;
    }
    
    /* Show banners only on large screens and when game is active */
    @media (min-width: 1800px) {
      #controls.active ~ .viewer-wrapper .ad-banner-container {
        display: block;
      }
    }
    
    .ad-banner-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: rgba(255, 255, 255, 0.3);
      font-family: var(--font-main);
      font-size: 0.9rem;
      text-align: center;
      padding: 1rem;
    }
    
    /* Viewer wrapper for banner positioning */
    .viewer-wrapper {
      position: relative;
      width: 100%;
      margin-bottom: 1rem;
    }
    .viewer {
      position:relative;
      display:none;
      justify-content:center;
      align-items:center;
      width:100%;
      max-width: min(1400px, 90vw);
      aspect-ratio:16 / 9;
      background:transparent;
      border-radius:15px;
      overflow:hidden;
      margin:0 auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      transition: all 0.3s ease;
    }
    
    @media (max-width: 1600px) {
      .viewer {
        max-width: 85vw;
      }
    }
    
    @media (max-width: 1200px) {
      .viewer {
        max-width: 90vw;
      }
    }
    
    @media (max-width: 768px) {
      .viewer {
        max-width: 95vw;
      }
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
      overflow:hidden;
    }
    
    /* Fullscreen iframe scaling */
    .viewer:fullscreen iframe,
    .viewer:-webkit-full-screen iframe,
    .viewer:-moz-full-screen iframe,
    .viewer:-ms-fullscreen iframe {
      width: 100vw;
      height: 100vh;
      object-fit: contain;
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
      margin-top:2rem;
      max-width: var(--content-max-width);
      margin-left: auto;
      margin-right: auto;
      padding: 0 clamp(0.5rem, 1.5vw, 1rem);
    }
    .category:first-of-type {
      margin-top: 0.5rem;
    }
    .category h2 {
      color:#ffccff;
      margin-bottom:1rem;
      cursor:pointer;
      font-family:var(--font-main);
      font-weight: 900;
      font-size: clamp(1.2rem, 1.8vw, 1.8rem);
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
      aspect-ratio: 1 / 1;
      background: linear-gradient(135deg, var(--card-bg), #5a0077);
      border-radius:15px;
      overflow:hidden;
      cursor:pointer;
      transition: all .3s ease;
      text-align:center;
      display:flex;
      flex-direction:column;
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
      height:100%;
      position:relative;
      overflow:hidden;
      border-radius:15px;
      background:#220033;
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
      position:absolute;
      top: 0;
      left: 0;
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
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 0.6rem 0.4rem;
      font-family:var(--font-main);
      font-weight: 600;
      font-size: clamp(0.7rem, 0.85vw, 0.85rem);
      color: rgba(255, 255, 255, 0.9);
      background: rgba(0, 0, 0, 0);
      width: 100%;
      line-height: 1.2;
      z-index: 2;
      transition: all .3s ease;
      opacity: 0;
      transform: translateY(10px);
      text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
    }
    
    .card:hover .card-title {
      opacity: 1;
      transform: translateY(0);
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
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
      aspect-ratio: 1 / 1;
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
      padding: 2rem 1rem;
      font-size: 0.7rem;
      text-decoration: none;
      transition: .3s;
      font-family: var(--font-main);
      font-weight: 300;
      margin-top: 4rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    #dmcaLink:hover {
      color: rgba(255, 255, 255, 0.6);
    }
  </style>
</head>
<body>
  
  <!-- Skip to main content link for accessibility -->
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <!-- Sidebar -->
  <nav id="sidebar" role="navigation" aria-label="Game categories">
    <header onclick="goToHome()" role="button" tabindex="0" onkeypress="if(event.key==='Enter')goToHome()" aria-label="Go to home page">
      <img src="assets/logo.png" alt="Chromebook Unlocked Games Logo">
    </header>
    <ul id="categoryList" role="menu">
      <li role="menuitem" tabindex="0" onclick="filterCategory('Home')" onkeypress="if(event.key==='Enter')filterCategory('Home')">Home</li>
      <li role="menuitem" tabindex="0" onclick="filterCategory('All Games')" onkeypress="if(event.key==='Enter')filterCategory('All Games')">All Games</li>
      ${finalSidebarCategories}
    </ul>
  </nav>
  <div id="sidebarIndicator" aria-hidden="true"></div>

  <!-- Content -->
  <div id="content" role="main">
    <!-- Top Header with Search -->
    <header id="topHeader">
      <h1 onclick="goToHome()" role="button" tabindex="0" onkeypress="if(event.key==='Enter')goToHome()" style="cursor: pointer;">Chromebook Unlocked Games</h1>
      <div id="searchContainer" role="search">
        <label for="searchBar" class="sr-only">Search games</label>
        <span id="searchIcon" aria-hidden="true">🔍</span>
        <input type="text" id="searchBar" placeholder="Search games..." oninput="searchGames(this.value)" aria-label="Search for games" autocomplete="off">
        <div id="searchDropdown" role="listbox" aria-label="Search results"></div>
      </div>
    </header>

    <div class="content-wrapper" id="main-content">
      <div id="controls">
        <button id="backBtn" onclick="closeGame()" aria-label="Go back to game list">← Back</button>
        <span id="gameTitle" role="heading" aria-level="2"></span>
        <button id="fullscreenBtn" onclick="toggleFullscreen()" aria-label="Toggle fullscreen mode">⛶ Fullscreen</button>
      </div>
      
      <div class="viewer-wrapper">
        <!-- Left Banner Ad -->
        <div class="ad-banner-container ad-banner-left">
          <div class="ad-banner-placeholder">
            Advertisement
          </div>
        </div>
        
        <!-- Game Viewer -->
        <div class="viewer" id="viewer">
          <div id="startOverlay">
            <img id="startThumb" src="" alt="Game Thumbnail">
            <h1 id="startName"></h1>
            <button id="startButton" onclick="startGame()">▶ Play</button>
          </div>
          <iframe id="gameFrame" src="" scrolling="no"></iframe>
        </div>
        
        <!-- Right Banner Ad -->
        <div class="ad-banner-container ad-banner-right">
          <div class="ad-banner-placeholder">
            Advertisement
          </div>
        </div>
      </div>

      <!-- All Games section (all games without categories) -->
      <div class="category" data-category="All Games" style="display:none;">
        <h2>All Games</h2>
        <div class="grid">
          ${games.map((g, i) => generateGameCard(g, i)).join('')}
        </div>
      </div>

      <!-- Recently Played -->
      <div class="category" data-category="Recently Played" id="recentlyPlayedSection" style="display:none;">
        <h2>Recently Played</h2>
        <div class="grid" id="recentlyPlayedGrid"></div>
      </div>

      <!-- All category sections (including games for home view) -->
      ${Object.keys(categories)
        .sort((a, b) => {
          // Keep "Newly Added" at top, sort rest by game count
          if (a === "Newly Added") return -1;
          if (b === "Newly Added") return 1;
          return categories[b].length - categories[a].length;
        })
        .map(cat => {
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
          window.location.href = g.folder + '.html';
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
            thumb: thumbSrc
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
          return \`<div class="search-result-item" onclick="window.location.href='\${game.folder}.html'">
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
        if (cat.id !== 'curatedGamesSection' && cat.getAttribute('data-category') !== 'All Games') {
          cat.style.display = 'none';
        }
      });
      
      showCuratedGames(folder);
      
      saveRecentlyPlayed({ folder, name, thumb: thumbSrc || 'assets/logo.png' });
    }
    
    // Show curated games when game viewer is open - ALWAYS 7 ROWS
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
        
        const gameCards = cat.querySelectorAll('.game-card[data-folder]');
        
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
        console.error('ERROR: No games found!');
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
      
      // ✅ ALWAYS fill exactly 7 rows - calculate columns dynamically
      const grid = document.getElementById('curatedGamesGrid') || document.createElement('div');
      const cols = getColumnCount(grid) || 5; // Get actual column count or default to 5
      const rows = 7; // Always 7 rows
      const targetCount = cols * rows; // Dynamic total based on screen size
      
      console.log('Grid columns:', cols, 'Target games:', targetCount);
      
      const curatedGames = [];
      
      if (sameCategory.length === 0) {
        // No same category - use all random
        curatedGames.push(...shuffledAllGames.slice(0, Math.min(targetCount, shuffledAllGames.length)));
      } else {
        // Mix: 60% same category, 40% other
        const sameCatTarget = Math.min(Math.ceil(targetCount * 0.6), sameCategory.length);
        
        // Add same category games
        curatedGames.push(...shuffledSameCategory.slice(0, sameCatTarget));
        
        // Add other games
        const usedFolders = new Set(curatedGames.map(g => g.folder));
        const otherGames = shuffledAllGames.filter(g => !usedFolders.has(g.folder));
        const remainingSlots = targetCount - curatedGames.length;
        
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
      
      // Display curated games
      finalCurated.forEach((game, idx) => {
        curatedGrid.appendChild(game.card);
      });
      
      console.log('=== Finished showCuratedGames');
    }
    
    function startGame() {
      if (!currentGameFolder) return;
      frame.src = 'games/' + currentGameFolder + '/index.html';
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
      
      // Hide All Games section
      const allGamesSection = document.querySelector('[data-category="All Games"]');
      if (allGamesSection) allGamesSection.style.display = 'none';
      
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
      
      // Show all normal categories again (exclude All Games)
      document.querySelectorAll('.category').forEach(cat => {
        const category = cat.getAttribute('data-category');
        if (category === 'Recently Played') {
          const recentGrid = document.getElementById('recentlyPlayedGrid');
          cat.style.display = (recentGrid && recentGrid.children.length > 0) ? 'block' : 'none';
        } else if (cat.id !== 'curatedGamesSection' && cat.id !== 'searchResultsSection' && category !== 'All Games') {
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
    function filterCategory(cat, updateURL = true) {
      const all = document.querySelectorAll('.category');
      const searchBar = document.getElementById('searchBar');

      // Close game window if it's open
      if (gameViewActive) {
        closeGame();
      }

      // Update URL if requested
      if (updateURL) {
        if (cat === 'Home') {
          window.history.pushState(null, '', '#/');
        } else {
          window.history.pushState(null, '', '#/category/' + encodeURIComponent(cat));
        }
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
          if (c.id === 'searchResultsSection' || c.id === 'curatedGamesSection' || category === 'All Games') return;

          // Show recently played and all categories on home
          if (category === 'Recently Played') {
            const recentGrid = document.getElementById('recentlyPlayedGrid');
            c.style.display = (recentGrid && recentGrid.children.length > 0) ? 'block' : 'none';
          } else {
            c.style.display = 'block';
          }
        });
      } else if (cat === 'All Games') {
        currentViewMode = 'category';
        all.forEach(c => {
          const category = c.getAttribute('data-category');

          // Show only the All Games section
          if (category === 'All Games') {
            c.style.display = 'block';
          } else {
            c.style.display = 'none';
          }
        });
      } else {
        currentViewMode = 'category';
        all.forEach(c => {
          const category = c.getAttribute('data-category');

          // Skip special sections
          if (c.id === 'searchResultsSection' || c.id === 'curatedGamesSection' || category === 'All Games') return;

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
        const card = cards.find(c => c.getAttribute('data-folder') === folder);
        if (card) {
          const gameName = card.getAttribute('data-name');
          const thumbImg = card.querySelector('.thumb');
          const thumbSrc = thumbImg ? thumbImg.src : 'assets/logo.png';
          prepareGame(encodeURIComponent(folder), encodeURIComponent(gameName), thumbSrc);
        }
      } else if (hash.startsWith('#/category/')) {
        const category = decodeURIComponent(hash.replace('#/category/', ''));
        closeGame();
        filterCategory(category, false); // Don't update URL since we're already routing
      } else {
        closeGame();
        filterCategory('Home', false); // Don't update URL since we're already routing
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
try {
  fs.writeFileSync(outputFile, html);
  console.log("✅ Build complete: index.html generated");
} catch (error) {
  console.error(`❌ Error writing index.html: ${error.message}`);
  process.exit(1);
}

// Generate individual game pages
console.log("\n🎮 Generating individual game pages...");

let successCount = 0;
let errorCount = 0;

games.forEach(game => {
  try {
    const gamePageHtml = generateGamePage(game);
    const gamePageFile = path.join(outputDir, `${game.folder}.html`);
    fs.writeFileSync(gamePageFile, gamePageHtml);
    console.log(`   ✓ Created ${game.folder}.html`);
    successCount++;
  } catch (error) {
    console.error(`   ❌ Error creating ${game.folder}.html: ${error.message}`);
    errorCount++;
  }
});

console.log(`\n✅ Generated ${successCount} game pages successfully!`);
if (errorCount > 0) {
  console.log(`⚠️  ${errorCount} game pages failed to generate`);
}

// Generate sitemap.xml
console.log("\n🗺️  Generating sitemap.xml...");
try {
  generateSitemap(games);
} catch (error) {
  console.error(`❌ Error generating sitemap: ${error.message}`);
  process.exit(1);
}

// Function to generate individual game page
function generateGamePage(game) {
  const thumb = chooseThumb(game);
  const gameUrl = `games/${game.folder}/index.html`;
  const categoryList = game.categories.join(', ');

  // Get similar games for "You Might Also Like" section
  const sameCategory = games.filter(g =>
    g.folder !== game.folder &&
    g.categories.some(cat => game.categories.includes(cat))
  );
  const otherGames = games.filter(g => g.folder !== game.folder);

  // Shuffle and mix
  const shuffled = [...sameCategory.slice(0, 14), ...otherGames.slice(0, 21)]
    .sort(() => Math.random() - 0.5)
    .slice(0, 35); // 7 rows x 5 columns = 35 games

  const recommendedGamesHTML = shuffled.map(g => {
    const gThumb = chooseThumb(g);
    return `<a href="${g.folder}.html" class="game-card">
      <div class="thumb-container">
        <img class="thumb" src="games/${g.folder}/${gThumb}" alt="${g.name}" loading="lazy">
      </div>
      <div class="card-title">${g.name}</div>
    </a>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Primary Meta Tags -->
  <title>Play ${game.name} Unblocked - Chromebook Unlocked Games</title>
  <meta name="title" content="Play ${game.name} Unblocked - Chromebook Unlocked Games">
  <meta name="description" content="Play ${game.name} unblocked at school on your Chromebook. Free online ${categoryList} game that works on school computers. No downloads required - play instantly in your browser!">
  <meta name="keywords" content="${game.name}, ${game.name} unblocked, play ${game.name}, chromebook unlocked games, unblocked games, free online games, school games, chromebook games, ${categoryList} games">
  <meta name="robots" content="index, follow">
  <meta name="language" content="English">
  <meta name="author" content="Chromebook Unlocked Games">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://chromebookunlocked.github.io/${game.folder}.html">
  <meta property="og:title" content="Play ${game.name} Unblocked - Chromebook Unlocked Games">
  <meta property="og:description" content="Play ${game.name} unblocked at school on your Chromebook. Free ${categoryList} game - no downloads required!">
  <meta property="og:image" content="https://chromebookunlocked.github.io/games/${game.folder}/${thumb}">
  <meta property="og:site_name" content="Chromebook Unlocked Games">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://chromebookunlocked.github.io/${game.folder}.html">
  <meta property="twitter:title" content="Play ${game.name} Unblocked">
  <meta property="twitter:description" content="Play ${game.name} unblocked at school. Free ${categoryList} game - no downloads required!">
  <meta property="twitter:image" content="https://chromebookunlocked.github.io/games/${game.folder}/${thumb}">

  <!-- Favicon -->
  <link rel="icon" type="image/png" sizes="48x48" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="96x96" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="144x144" href="assets/logo.png">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/logo.png">
  <link rel="shortcut icon" type="image/png" href="assets/logo.png">

  <!-- Additional SEO -->
  <meta name="theme-color" content="#ff66ff">
  <link rel="canonical" href="https://chromebookunlocked.github.io/${game.folder}.html">

  <!-- Structured Data for Game -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "${game.name}",
    "url": "https://chromebookunlocked.github.io/${game.folder}.html",
    "image": "https://chromebookunlocked.github.io/games/${game.folder}/${thumb}",
    "description": "Play ${game.name} unblocked at school. Free online ${categoryList} game.",
    "genre": "${game.categories[0]}",
    "gamePlatform": "Web Browser",
    "publisher": {
      "@type": "Organization",
      "name": "Chromebook Unlocked Games"
    }
  }
  </script>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&display=swap" rel="stylesheet">

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Orbitron', sans-serif;
      background: linear-gradient(135deg, #0d001a 0%, #1c0033 50%, #2d0052 100%);
      background-attachment: fixed;
      color: #fff;
      min-height: 100vh;
    }

    /* Top Header with Logo */
    header {
      background: linear-gradient(135deg, #330066 0%, #1a0033 100%);
      backdrop-filter: blur(10px);
      padding: 1rem 2rem;
      border-bottom: 2px solid rgba(255, 102, 255, 0.3);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      position: sticky;
      top: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .logo {
      height: 50px;
      width: auto;
      filter: drop-shadow(0 0 10px #ff66ff);
      cursor: pointer;
      transition: transform 0.3s ease;
    }

    .logo:hover {
      transform: scale(1.1);
    }

    h1 {
      font-size: clamp(1.2rem, 2.5vw, 1.8rem);
      font-weight: 900;
      background: linear-gradient(135deg, #ff66ff, #ff99ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      cursor: pointer;
      transition: transform 0.3s ease;
    }

    h1:hover {
      transform: scale(1.05);
    }

    /* Controls Bar */
    .controls {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      right: 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      pointer-events: none;
    }

    .icon-btn {
      width: 44px;
      height: 44px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(13, 0, 26, 0.9);
      border: 1px solid rgba(255, 102, 255, 0.3);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      color: #fff;
      pointer-events: auto;
    }

    .icon-btn:hover {
      background: rgba(51, 0, 102, 0.95);
      border-color: #ff66ff;
      box-shadow: 0 4px 15px rgba(255, 102, 255, 0.5);
      transform: scale(1.05);
    }

    .icon-btn:active {
      transform: scale(0.95);
    }

    .icon-btn svg {
      width: 20px;
      height: 20px;
    }

    /* Category Tags */
    .category-tags {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 1rem;
      justify-content: center;
    }

    .category-tag {
      background: rgba(255, 102, 255, 0.15);
      border: 1px solid rgba(255, 102, 255, 0.4);
      padding: 0.5rem 1.2rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #ff99ff;
      text-decoration: none;
      transition: all 0.3s ease;
      display: inline-block;
    }

    .category-tag:hover {
      background: rgba(255, 102, 255, 0.3);
      border-color: #ff66ff;
      box-shadow: 0 4px 15px rgba(255, 102, 255, 0.3);
      transform: translateY(-2px);
      color: #fff;
    }

    button {
      padding: 0.8rem 1.6rem;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-size: 1em;
      background: linear-gradient(135deg, #ff66ff, #cc00ff);
      color: #fff;
      font-weight: 700;
      transition: all 0.3s ease;
      font-family: 'Orbitron', sans-serif;
      box-shadow: 0 4px 15px rgba(255, 102, 255, 0.3);
      border: 2px solid transparent;
      position: relative;
      overflow: hidden;
    }

    button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      transition: left 0.5s;
    }

    button:hover::before {
      left: 100%;
    }

    button:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 8px 25px rgba(255, 102, 255, 0.6);
      border-color: rgba(255, 102, 255, 0.5);
    }

    button:active {
      transform: translateY(-1px) scale(0.98);
    }

    /* Game Viewer */
    .game-container {
      max-width: 1400px;
      margin: 1.5rem auto 2rem auto;
      padding: 0 1.5rem;
    }

    .game-frame-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(255, 102, 255, 0.3);
      background: #000;
    }

    iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      display: none;
      object-fit: contain;
    }

    iframe.active {
      display: block;
    }

    /* Play Overlay */
    .play-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #330066 0%, #1c0033 50%, #0d001a 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
      z-index: 10;
      transition: opacity 0.5s ease;
    }

    .play-overlay.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .play-overlay img {
      width: clamp(200px, 40vw, 350px);
      max-width: 80%;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(255, 102, 255, 0.4);
      border: 2px solid rgba(255, 102, 255, 0.3);
    }

    .play-overlay h2 {
      margin: 0;
      font-size: clamp(1.5rem, 2.5vw, 3rem);
      color: #fff;
      text-shadow: 0 0 20px #ff66ff;
      font-weight: 900;
    }

    .play-btn {
      padding: 1.2rem 3rem;
      font-size: clamp(1.2rem, 2vw, 1.6rem);
      font-weight: 900;
      letter-spacing: 1px;
      box-shadow: 0 10px 30px rgba(255, 102, 255, 0.5);
    }

    .play-btn:hover {
      box-shadow: 0 12px 40px rgba(255, 102, 255, 0.7);
    }

    /* Recommendations Section */
    .recommendations {
      max-width: 1400px;
      margin: 3rem auto 2rem auto;
      padding: 0 1.5rem;
    }

    .recommendations h2 {
      font-size: clamp(1.5rem, 2.5vw, 2rem);
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, #ff66ff, #ff99ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 900;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(clamp(140px, 15vw, 220px), 1fr));
      gap: clamp(0.8rem, 1.5vw, 1.2rem);
    }

    .game-card {
      background: linear-gradient(135deg, rgba(77, 0, 102, 0.3), rgba(51, 0, 102, 0.3));
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;
      border: 2px solid rgba(255, 102, 255, 0.2);
      text-decoration: none;
      color: inherit;
      display: block;
    }

    .game-card:hover {
      transform: translateY(-8px) scale(1.03);
      box-shadow: 0 12px 35px rgba(255, 102, 255, 0.5);
      border-color: rgba(255, 102, 255, 0.6);
      background: linear-gradient(135deg, rgba(102, 0, 153, 0.5), rgba(77, 0, 102, 0.5));
    }

    .thumb-container {
      width: 100%;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      position: relative;
      background: linear-gradient(135deg, #1a0033, #0d001a);
    }

    .thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .game-card:hover .thumb {
      transform: scale(1.1);
    }

    .card-title {
      padding: 0.8rem;
      font-size: clamp(0.85rem, 1.2vw, 1rem);
      font-weight: 600;
      text-align: center;
      background: linear-gradient(180deg, rgba(26, 0, 51, 0.8), rgba(13, 0, 26, 0.8));
    }

    footer {
      background: rgba(13, 0, 26, 0.8);
      backdrop-filter: blur(10px);
      padding: 1.5rem 2rem;
      border-top: 2px solid rgba(255, 102, 255, 0.3);
      text-align: center;
      margin-top: 3rem;
    }

    footer p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    footer a {
      color: #ff66ff;
      text-decoration: none;
      font-weight: 500;
    }

    footer a:hover {
      text-decoration: underline;
    }

    /* Fullscreen styles */
    .game-frame-wrapper:-webkit-full-screen {
      max-width: 100vw !important;
      width: 100vw !important;
      height: 100vh !important;
      aspect-ratio: auto !important;
      border-radius: 0 !important;
      border: none !important;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .game-frame-wrapper:-webkit-full-screen iframe {
      width: 100vw !important;
      height: 100vh !important;
      object-fit: contain;
    }

    .game-frame-wrapper:-moz-full-screen {
      max-width: 100vw !important;
      width: 100vw !important;
      height: 100vh !important;
      aspect-ratio: auto !important;
      border-radius: 0 !important;
      border: none !important;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .game-frame-wrapper:-moz-full-screen iframe {
      width: 100vw !important;
      height: 100vh !important;
      object-fit: contain;
    }

    .game-frame-wrapper:fullscreen {
      max-width: 100vw !important;
      width: 100vw !important;
      height: 100vh !important;
      aspect-ratio: auto !important;
      border-radius: 0 !important;
      border: none !important;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .game-frame-wrapper:fullscreen iframe {
      width: 100vw !important;
      height: 100vh !important;
      object-fit: contain;
    }

    /* Responsive */
    @media (max-width: 768px) {
      header {
        padding: 1rem;
      }

      .icon-btn {
        width: 40px;
        height: 40px;
      }

      .game-frame-wrapper {
        aspect-ratio: 4 / 3;
      }

      .category-tags {
        gap: 0.5rem;
      }

      .category-tag {
        font-size: 0.85rem;
        padding: 0.4rem 1rem;
      }
    }
  </style>
</head>
<body>
  <!-- Header with Logo -->
  <header>
    <div class="header-left">
      <img src="assets/logo.png" alt="Chromebook Unlocked Games Logo" class="logo" onclick="window.location.href='index.html'">
      <h1 onclick="window.location.href='index.html'">Chromebook Unlocked Games</h1>
    </div>
  </header>

  <!-- Game Viewer -->
  <div class="game-container">
    <div class="game-frame-wrapper" id="gameWrapper">
      <!-- Controls Bar (sticky to top of game) -->
      <div class="controls">
        <button class="icon-btn" onclick="window.location.href='index.html'" title="Back to Games" aria-label="Back to Games">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <button class="icon-btn" onclick="toggleFullscreen()" title="Fullscreen" aria-label="Toggle Fullscreen">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
        </button>
      </div>

      <div class="play-overlay" id="playOverlay">
        <img src="games/${game.folder}/${thumb}" alt="${game.name}">
        <h2>${game.name}</h2>
        <button class="play-btn" onclick="startGame()">▶ Play</button>
      </div>
      <iframe
        id="gameFrame"
        src=""
        title="Play ${game.name} Unblocked"
        allow="fullscreen; autoplay; encrypted-media"
        allowfullscreen>
      </iframe>
    </div>

    <!-- Category Tags -->
    <div class="category-tags">
      ${game.categories.map(cat => `<a href="index.html#/category/${encodeURIComponent(cat)}" class="category-tag">${cat}</a>`).join('')}
    </div>
  </div>

  <!-- You Might Also Like Section -->
  <div class="recommendations">
    <h2>You Might Also Like</h2>
    <div class="grid">
      ${recommendedGamesHTML}
    </div>
  </div>

  <footer>
    <p>
      <strong>${game.name}</strong> - Free to play on <a href="index.html">Chromebook Unlocked Games</a>
      <br>
      Categories: ${categoryList} | <a href="dmca.html">DMCA</a>
    </p>
  </footer>

  <script>
    function startGame() {
      const overlay = document.getElementById('playOverlay');
      const frame = document.getElementById('gameFrame');

      frame.src = '${gameUrl}';
      frame.classList.add('active');
      overlay.classList.add('hidden');
    }

    function toggleFullscreen() {
      const wrapper = document.getElementById('gameWrapper');

      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
        // Enter fullscreen
        if (wrapper.requestFullscreen) {
          wrapper.requestFullscreen();
        } else if (wrapper.webkitRequestFullscreen) {
          wrapper.webkitRequestFullscreen();
        } else if (wrapper.mozRequestFullScreen) {
          wrapper.mozRequestFullScreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        }
      }
    }

  </script>
</body>
</html>`;
}
function generateSitemap(games) {
  const today = new Date().toISOString().split('T')[0];
  const baseUrl = 'https://chromebookunlocked.github.io';

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- DMCA Page -->
  <url>
    <loc>${baseUrl}/dmca.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

`;

  // Add all game pages
  games.forEach(game => {
    sitemap += `  <!-- ${game.name} -->
  <url>
    <loc>${baseUrl}/${encodeURIComponent(game.folder)}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

`;
  });

  sitemap += `</urlset>`;

  // Write sitemap to dist folder
  const sitemapPath = path.join(outputDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  console.log(`✅ Sitemap generated with ${games.length + 2} URLs`);
}
