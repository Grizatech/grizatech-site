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

function createReviewCard(data) {
  const card = document.createElement('article');
  card.className = 'approved-review-card';

  const top = document.createElement('div');
  top.className = 'approved-review-top';

  const identity = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = data.name || 'Cliente GrizaTech';
  const service = document.createElement('span');
  service.textContent = data.service || 'Serviço GrizaTech';
  identity.append(name, service);

  const stars = document.createElement('div');
  stars.className = 'approved-review-stars';
  const rating = Math.max(1, Math.min(5, Number(data.rating) || 5));
  stars.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const comment = document.createElement('p');
  comment.textContent = data.comment || '';

  top.append(identity, stars);
  card.append(top, comment);
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

    reviews.forEach(review => reviewsList.appendChild(createReviewCard(review)));
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
