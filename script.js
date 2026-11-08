
const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.navlinks');

menuBtn.addEventListener('click', () => { const open = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); });
document.querySelectorAll('.navlinks a').forEach(a => {
  a.addEventListener('click', () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); menuBtn.setAttribute('aria-label','Abrir menu'); });
});

const reveal = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
},{threshold:.08});

document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));

const sections = [...document.querySelectorAll('main section[id]')];
const links = [...document.querySelectorAll('.navlinks a')];

const spy = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
  });
},{rootMargin:'-35% 0px -55% 0px',threshold:0});

sections.forEach(section => spy.observe(section));


// ===========================
// V9 — GALERIA / LIGHTBOX
// ===========================
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.querySelector('.lightbox-close');

document.addEventListener('click', e => {
  const card = e.target.closest('[data-lightbox]');
  if(!card) return;
  lightboxImage.src = card.dataset.lightbox;
  lightboxCaption.textContent = card.dataset.caption || '';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
});

function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImage.src = '';
  document.body.style.overflow = '';
}

lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', e => {
  if(e.target === lightbox) closeLightbox();
});

// ===========================
// V9 — AVALIAÇÃO MODERADA
// Envia para o WhatsApp do Fernando.
// Não publica automaticamente.
// ===========================
const reviewModal = document.getElementById('reviewModal');
const openReview = document.getElementById('openReview');
const reviewClose = document.querySelector('.review-close');
const reviewForm = document.getElementById('reviewForm');

function openReviewModal(){
  reviewModal.classList.add('open');
  reviewModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeReviewModal(){
  reviewModal.classList.remove('open');
  reviewModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

openReview?.addEventListener('click', openReviewModal);
reviewClose?.addEventListener('click', closeReviewModal);
reviewModal?.addEventListener('click', e => {
  if(e.target === reviewModal) closeReviewModal();
});

// V10: o envio do formulário é tratado por firebase-feedback.js (Cloud Firestore).

document.addEventListener('keydown', e => {
  if(e.key !== 'Escape') return;
  if(lightbox?.classList.contains('open')) closeLightbox();
  if(reviewModal?.classList.contains('open')) closeReviewModal();
});


// ===========================
// V13 — VIDEO GRIZATECH / SOM OPCIONAL
// Autoplay começa mudo por compatibilidade com navegadores.
// O áudio só é ativado após ação do visitante.
// ===========================
const showcaseVideo = document.getElementById('grizatechShowcaseVideo');
const videoSoundToggle = document.getElementById('videoSoundToggle');

if (showcaseVideo && videoSoundToggle) {
  const soundIcon = videoSoundToggle.querySelector('.video-sound-icon');
  const soundLabel = videoSoundToggle.querySelector('.video-sound-label');

  showcaseVideo.muted = true;
  showcaseVideo.play().catch(() => {});

  videoSoundToggle.addEventListener('click', async () => {
    showcaseVideo.muted = !showcaseVideo.muted;
    if (!showcaseVideo.muted) {
      try { await showcaseVideo.play(); } catch (_) {}
    }
    const soundOn = !showcaseVideo.muted;
    videoSoundToggle.classList.toggle('sound-on', soundOn);
    videoSoundToggle.setAttribute('aria-pressed', String(soundOn));
    videoSoundToggle.setAttribute('aria-label', soundOn ? 'Desativar som do vídeo' : 'Ativar som do vídeo');
    soundIcon.textContent = soundOn ? '🔊' : '🔇';
    soundLabel.textContent = soundOn ? 'DESATIVAR SOM' : 'ATIVAR SOM';
  });
}

// Dimensiona a janela da galeria por duas fileiras completas, sem cortar a próxima.
(() => {
  const viewport = document.querySelector('.portfolio-scroll-shell');
  const grid = document.getElementById('portfolioGallery');
  if (!viewport || !grid) return;
  let frame;
  const measure = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const cards = [...grid.querySelectorAll('.gallery-card')];
      if (!cards.length) return;
      const gridStyle = getComputedStyle(grid);
      const columns = gridStyle.gridTemplateColumns.split(' ').length;
      if (columns < 2) { viewport.style.removeProperty('--gallery-two-rows'); return; }
      const first = cards[0];
      const secondRow = cards[columns];
      const last = cards[Math.min(columns * 2, cards.length) - 1];
      const style = getComputedStyle(viewport);
      const contentHeight = secondRow
        ? Math.max(...cards.slice(columns, columns * 2).map(card => card.offsetTop + card.offsetHeight)) - first.offsetTop
        : last.offsetTop + last.offsetHeight - first.offsetTop;
      const height = Math.ceil(contentHeight + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth));
      viewport.style.setProperty('--gallery-two-rows', height + 'px');
    });
  };
  new MutationObserver(measure).observe(grid, { childList: true });
  new ResizeObserver(measure).observe(grid);
  window.addEventListener('resize', measure);
  grid.addEventListener('load', measure, true);
  document.fonts?.ready.then(measure);
  measure();
})();
