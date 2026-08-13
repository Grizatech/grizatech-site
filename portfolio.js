/* ==========================================================
   GRIZATECH V12 — PORTFÓLIO MANUAL
   PARA ADICIONAR UM TRABALHO NOVO:
   1) Coloque a foto JPG em assets/portfolio/
   2) Copie um bloco abaixo
   3) Troque image, category, title, description e date
   4) Salve e envie ao GitHub
   ========================================================== */

const portfolioItems = [
  { image: "assets/portfolio/cliente-01.jpg", category: "PC GAMER", title: "MONTAGEM CLIENTE 01", description: "Exemplo — substitua pelos dados da montagem real.", date: "13/08/2026" },
  { image: "assets/portfolio/cliente-02.jpg", category: "MONTAGEM", title: "MONTAGEM CLIENTE 02", description: "Exemplo — hardware, montagem e acabamento.", date: "12/08/2026" },
  { image: "assets/portfolio/cliente-03.jpg", category: "UPGRADE", title: "MONTAGEM CLIENTE 03", description: "Exemplo — substitua pela descrição do serviço.", date: "11/08/2026" },
  { image: "assets/portfolio/cliente-04.jpg", category: "PERFORMANCE", title: "MONTAGEM CLIENTE 04", description: "Exemplo — foto real do equipamento do cliente.", date: "10/08/2026" },
  { image: "assets/portfolio/cliente-05.jpg", category: "GRIZATECH", title: "MONTAGEM CLIENTE 05", description: "Exemplo — quinto item inicial da galeria.", date: "09/08/2026" }
];

(function renderPortfolio(){
  const gallery = document.getElementById('portfolioGallery');
  const counter = document.getElementById('portfolioCount');
  if(!gallery) return;
  if(counter) counter.textContent = String(portfolioItems.length).padStart(2,'0');

  gallery.innerHTML = portfolioItems.map((item, index) => `
    <button class="gallery-card portfolio-item"
            type="button"
            data-lightbox="${item.image}"
            data-caption="${item.title} // ${item.date}">
      <div class="gallery-image">
        <img src="${item.image}" alt="${item.title}" loading="lazy">
        <span class="gallery-zoom">AMPLIAR +</span>
      </div>
      <div class="gallery-copy">
        <div class="portfolio-meta"><small>${item.category}</small><time>${item.date}</time></div>
        <strong>${item.title}</strong>
        <span>${item.description}</span>
      </div>
    </button>
  `).join('');
})();
