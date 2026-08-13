// GrizaTech V10 — Feedback público via Cloud Firestore
import { db } from './firebase.js';
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const reviewForm = document.getElementById('reviewForm');
const reviewModal = document.getElementById('reviewModal');
const reviewsList = document.getElementById('reviewsApprovedList');
const submitButton = reviewForm?.querySelector('.review-submit');
const reviewStatus = document.getElementById('reviewStatus');

function setStatus(message, type = '') {
  if (!reviewStatus) return;
  reviewStatus.textContent = message;
  reviewStatus.className = 'review-status' + (type ? ` ${type}` : '');
}

function closeReviewModal() {
  if (!reviewModal) return;
  reviewModal.classList.remove('open');
  reviewModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function formatReviewDate(timestamp) {
  if (!timestamp) return 'DATA NÃO DISPONÍVEL';

  try {
    const date = typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : new Date((timestamp.seconds || 0) * 1000);

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    return 'DATA NÃO DISPONÍVEL';
  }
}

function getInitials(name) {
  return String(name || 'Cliente')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'GZ';
}

function createReviewCard(data, position) {
  const card = document.createElement('article');
  card.className = 'approved-review-card';

  const accent = document.createElement('div');
  accent.className = 'approved-review-accent';

  const header = document.createElement('div');
  header.className = 'approved-review-header';

  const avatar = document.createElement('div');
  avatar.className = 'approved-review-avatar';
  avatar.textContent = getInitials(data.name);

  const identity = document.createElement('div');
  identity.className = 'approved-review-identity';

  const name = document.createElement('strong');
  name.textContent = data.name || 'Cliente GrizaTech';

  const meta = document.createElement('div');
  meta.className = 'approved-review-meta';

  const service = document.createElement('span');
  service.className = 'approved-review-service';
  service.textContent = data.service || 'Serviço GrizaTech';

  const date = document.createElement('time');
  date.className = 'approved-review-date';
  date.textContent = formatReviewDate(data.createdAt);

  meta.append(service, date);
  identity.append(name, meta);

  const ratingBox = document.createElement('div');
  ratingBox.className = 'approved-review-rating';

  const stars = document.createElement('div');
  stars.className = 'approved-review-stars';
  const rating = Math.max(1, Math.min(5, Number(data.rating) || 5));
  stars.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const score = document.createElement('small');
  score.textContent = `${rating}/5`;
  ratingBox.append(stars, score);

  header.append(avatar, identity, ratingBox);

  const body = document.createElement('div');
  body.className = 'approved-review-body';

  const quote = document.createElement('span');
  quote.className = 'approved-review-quote';
  quote.setAttribute('aria-hidden', 'true');
  quote.textContent = '“';

  const comment = document.createElement('p');
  comment.textContent = data.comment || '';

  body.append(quote, comment);

  const footer = document.createElement('div');
  footer.className = 'approved-review-footer';

  const verified = document.createElement('span');
  verified.className = 'approved-review-verified';
  verified.innerHTML = '<i></i> AVALIAÇÃO APROVADA';

  const index = document.createElement('span');
  index.className = 'approved-review-index';
  index.textContent = `GZ // ${String(position).padStart(2, '0')}`;

  footer.append(verified, index);
  card.append(accent, header, body, footer);
  return card;
}

async function loadApprovedReviews() {
  if (!reviewsList) return;
  reviewsList.innerHTML = '<div class="review-loading">CARREGANDO AVALIAÇÕES...</div>';

  try {
    // Importante: as regras do Firestore não são filtros.
    // A consulta pública precisa pedir explicitamente somente status=approved.
    const q = query(collection(db, 'reviews'), where('status', '==', 'approved'));
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    reviews.sort((a, b) => {
      const at = a.createdAt?.seconds || 0;
      const bt = b.createdAt?.seconds || 0;
      return bt - at;
    });

    reviewsList.innerHTML = '';

    if (!reviews.length) {
      const empty = document.createElement('div');
      empty.className = 'review-empty-state';
      empty.innerHTML = `
        <div class="review-quote">“</div>
        <strong>ESPAÇO PREPARADO PARA OS PRIMEIROS FEEDBACKS</strong>
        <p>Assim que uma avaliação real for aprovada pela GrizaTech, ela aparecerá automaticamente aqui.</p>
        <span>GRIZATECH // PROVA SOCIAL</span>`;
      reviewsList.appendChild(empty);
      return;
    }

    reviews.forEach((review, index) => reviewsList.appendChild(createReviewCard(review, index + 1)));
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
    reviewsList.innerHTML = '<div class="review-loading error">Não foi possível carregar as avaliações agora.</div>';
  }
}

reviewForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('reviewName')?.value.trim();
  const service = document.getElementById('reviewService')?.value;
  const comment = document.getElementById('reviewComment')?.value.trim();
  const rating = Number(document.querySelector('input[name="rating"]:checked')?.value || 5);

  if (!name || !service || !comment) {
    setStatus('Preencha todos os campos antes de enviar.', 'error');
    return;
  }

  submitButton && (submitButton.disabled = true);
  setStatus('Enviando avaliação para análise...', 'sending');

  try {
    await addDoc(collection(db, 'reviews'), {
      name,
      service,
      rating,
      comment,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    reviewForm.reset();
    const five = document.querySelector('input[name="rating"][value="5"]');
    if (five) five.checked = true;
    setStatus('Avaliação enviada! Ela aparecerá após aprovação da GrizaTech.', 'success');

    setTimeout(() => {
      closeReviewModal();
      setStatus('');
    }, 1700);
  } catch (error) {
    console.error('Erro ao enviar avaliação:', error);
    setStatus('Não foi possível enviar agora. Tente novamente em instantes.', 'error');
  } finally {
    submitButton && (submitButton.disabled = false);
  }
});

loadApprovedReviews();
