/* GRIZATECH V14 — PORTFÓLIO AUTOMÁTICO (cliente-01.jpg até cliente-99.jpg) */
(function renderAutomaticPortfolio(){
  const gallery = document.getElementById('portfolioGallery');
  const counter = document.getElementById('portfolioCount');
  const MAX_CLIENT_NUMBER = 99;
  const CHECK_BATCH_SIZE = 12;
  const FEATURED_CARD_COUNT = 5;
  const TWO_DAYS_IN_MS = 2 * 24 * 60 * 60 * 1000;

  if(!gallery) return;
  gallery.setAttribute('aria-busy', 'true');
  gallery.innerHTML = '<div class="gallery-loading" role="status">CARREGANDO TRABALHOS...</div>';

  const formatClientNumber = number => String(number).padStart(2, '0');

  function imageExists(src){
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = src;
    });
  }

  async function discoverPortfolioItems(){
    const items = [];
    for(let start = 1; start <= MAX_CLIENT_NUMBER; start += CHECK_BATCH_SIZE){
      const numbers = Array.from(
        {length: Math.min(CHECK_BATCH_SIZE, MAX_CLIENT_NUMBER - start + 1)},
        (_, index) => start + index
      );
      const results = await Promise.all(numbers.map(async number => {
        const clientNumber = formatClientNumber(number);
        const image = `assets/portfolio/cliente-${clientNumber}.jpg`;
        return (await imageExists(image)) ? {clientNumber, image} : null;
      }));
      items.push(...results.filter(Boolean));
    }
    return items;
  }

  function seededRandom(seed){
    let state = seed >>> 0;
    return function next(){
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createFairTwoDayOrder(items){
    if(items.length < 2) return items.slice();
    const baseOrder = items.slice();
    const random = seededRandom(0x4752495A ^ items.length);
    for(let index = baseOrder.length - 1; index > 0; index--){
      const swapIndex = Math.floor(random() * (index + 1));
      [baseOrder[index], baseOrder[swapIndex]] = [baseOrder[swapIndex], baseOrder[index]];
    }
    const twoDayPeriod = Math.floor(Date.now() / TWO_DAYS_IN_MS);
    const rotation = (twoDayPeriod * FEATURED_CARD_COUNT) % baseOrder.length;
    return baseOrder.slice(rotation).concat(baseOrder.slice(0, rotation));
  }

  function renderCards(items){
    if(counter) counter.textContent = String(items.length).padStart(2, '0');
    if(!items.length){
      gallery.innerHTML = '<div class="gallery-loading" role="status">NENHUM TRABALHO ENCONTRADO</div>';
      return;
    }
    gallery.innerHTML = createFairTwoDayOrder(items).map((item, index) => {
      const title = 'Trabalho realizado pela GrizaTech.';
      const featuredLabel = index < FEATURED_CARD_COUNT ? 'DESTAQUE' : 'PORTFÓLIO';
      return `
        <button class="gallery-card portfolio-item" type="button"
                data-lightbox="${item.image}"
                data-caption="${title}">
          <div class="gallery-image">
            <img src="${item.image}" alt="${title}" loading="lazy">
            <span class="gallery-zoom">AMPLIAR +</span>
          </div>
          <div class="gallery-copy">
            <div class="portfolio-meta"><small>TRABALHO REAL</small><span>${featuredLabel}</span></div>
            <strong>${title}</strong>
          </div>
        </button>`;
    }).join('');
  }

  discoverPortfolioItems()
    .then(renderCards)
    .catch(() => {
      gallery.innerHTML = '<div class="gallery-loading" role="alert">NÃO FOI POSSÍVEL CARREGAR A GALERIA</div>';
    })
    .finally(() => gallery.setAttribute('aria-busy', 'false'));
})();
