
const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.navlinks');

menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('.navlinks a').forEach(a => {
  a.addEventListener('click', () => nav.classList.remove('open'));
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

document.querySelectorAll('[data-lightbox]').forEach(card => {
  card.addEventListener('click', () => {
    lightboxImage.src = card.dataset.lightbox;
    lightboxCaption.textContent = card.dataset.caption || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });
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

reviewForm?.addEventListener('submit', e => {
  e.preventDefault();

  const name = document.getElementById('reviewName').value.trim();
  const service = document.getElementById('reviewService').value;
  const comment = document.getElementById('reviewComment').value.trim();
  const rating = document.querySelector('input[name="rating"]:checked')?.value || '5';

  const stars = '★'.repeat(Number(rating)) + '☆'.repeat(5 - Number(rating));

  const message =
`Olá GrizaTech! Quero enviar uma avaliação do meu atendimento.

Nome: ${name}
Serviço: ${service}
Nota: ${stars} (${rating}/5)

Comentário:
${comment}

Autorizo o envio desta avaliação para análise da GrizaTech. A publicação no site fica sujeita à aprovação.`;

  const url = 'https://api.whatsapp.com/send/?phone=5522997439359&text=' + encodeURIComponent(message);
  window.open(url, '_blank', 'noopener');
});

document.addEventListener('keydown', e => {
  if(e.key !== 'Escape') return;
  if(lightbox?.classList.contains('open')) closeLightbox();
  if(reviewModal?.classList.contains('open')) closeReviewModal();
});
