// js/gameLoader.js
fetch('games-list.json')
  .then(r => r.json())
  .then(list => renderTiles(list));

function renderTiles(list){
  const grid = document.getElementById('gameGrid');
  grid.innerHTML = '';          // clear placeholder
  list.forEach(g => {
    const tile = document.createElement('div');
    tile.className = 'game-tile';
    tile.onclick = () => launchGame(g.id);
    tile.innerHTML = `
      <img src="games/${g.id}/thumbnail.jpg" alt="${g.name}">
      <span class="title">${g.name}</span>
      <span class="desc">${g.desc}</span>`;
    grid.appendChild(tile);
  });
}

function launchGame(id){
  // your pre-roll ad logic here
  console.warn('Ad #1 – 5 sec');
  setTimeout(()=>{
    console.warn('Ad #2 – 5 sec');
    setTimeout(()=>{
      location.href = `games/${id}/`;
    },5000);
  },5000);
}
