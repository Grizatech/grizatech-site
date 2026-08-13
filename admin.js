import { auth, db } from './firebase.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const ADMIN_UID = 'G3c1Rt5AtKfBaJKEJ8w9qdKQHLA2';
const loginPanel = document.getElementById('loginPanel');
const dashboardPanel = document.getElementById('dashboardPanel');
const loginForm = document.getElementById('adminLoginForm');
const loginStatus = document.getElementById('loginStatus');
const adminIdentity = document.getElementById('adminIdentity');
const pendingReviews = document.getElementById('pendingReviews');
const approvedReviews = document.getElementById('approvedReviews');
const pendingCount = document.getElementById('pendingCount');
const approvedCount = document.getElementById('approvedCount');
const totalCount = document.getElementById('totalCount');
const refreshButton = document.getElementById('refreshReviews');
const logoutButton = document.getElementById('adminLogout');

function setLoginStatus(message, error = false) {
  loginStatus.textContent = message;
  loginStatus.className = 'admin-status' + (error ? ' error' : '');
}

function formatDate(timestamp) {
  if (!timestamp?.toDate) return 'Data não disponível';
  return timestamp.toDate().toLocaleString('pt-BR');
}

function makeCard(review, approved) {
  const card = document.createElement('article');
  card.className = 'admin-review-card';

  const top = document.createElement('div');
  top.className = 'admin-review-top';
  const person = document.createElement('div');
  person.className = 'admin-review-person';
  const name = document.createElement('strong');
  name.textContent = review.name || 'Cliente';
  const service = document.createElement('span');
  service.textContent = review.service || 'Serviço';
  person.append(name, service);

  const stars = document.createElement('div');
  stars.className = 'admin-review-stars';
  const rating = Math.max(1, Math.min(5, Number(review.rating) || 5));
  stars.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  top.append(person, stars);

  const comment = document.createElement('p');
  comment.textContent = review.comment || '';
  const meta = document.createElement('div');
  meta.className = 'admin-review-meta';
  meta.textContent = `${approved ? 'APROVADA' : 'PENDENTE'} // ${formatDate(review.createdAt)}`;

  const actions = document.createElement('div');
  actions.className = 'review-actions';

  if (!approved) {
    const approve = document.createElement('button');
    approve.className = 'approve';
    approve.textContent = 'APROVAR';
    approve.addEventListener('click', () => moderate(review.id, 'approved', approve));
    actions.appendChild(approve);
  } else {
    const hide = document.createElement('button');
    hide.className = 'hide';
    hide.textContent = 'OCULTAR';
    hide.addEventListener('click', () => moderate(review.id, 'pending', hide));
    actions.appendChild(hide);
  }

  const remove = document.createElement('button');
  remove.className = 'delete';
  remove.textContent = 'EXCLUIR';
  remove.addEventListener('click', () => removeReview(review.id, remove));
  actions.appendChild(remove);

  card.append(top, comment, meta, actions);
  return card;
}

async function loadReviews() {
  pendingReviews.innerHTML = '<div class="admin-empty">Carregando...</div>';
  approvedReviews.innerHTML = '<div class="admin-empty">Carregando...</div>';
  refreshButton.disabled = true;

  try {
    const snapshot = await getDocs(collection(db, 'reviews'));
    const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    all.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    const pending = all.filter(r => r.status === 'pending');
    const approved = all.filter(r => r.status === 'approved');

    pendingCount.textContent = pending.length;
    approvedCount.textContent = approved.length;
    totalCount.textContent = all.length;

    pendingReviews.innerHTML = '';
    approvedReviews.innerHTML = '';

    if (!pending.length) pendingReviews.innerHTML = '<div class="admin-empty">Nenhuma avaliação pendente.</div>';
    else pending.forEach(r => pendingReviews.appendChild(makeCard(r, false)));

    if (!approved.length) approvedReviews.innerHTML = '<div class="admin-empty">Nenhuma avaliação aprovada.</div>';
    else approved.forEach(r => approvedReviews.appendChild(makeCard(r, true)));
  } catch (error) {
    console.error(error);
    pendingReviews.innerHTML = '<div class="admin-empty">Erro ao carregar avaliações.</div>';
    approvedReviews.innerHTML = '<div class="admin-empty">Verifique o login e as regras do Firestore.</div>';
  } finally {
    refreshButton.disabled = false;
  }
}

async function moderate(id, status, button) {
  button.disabled = true;
  try {
    await updateDoc(doc(db, 'reviews', id), { status });
    await loadReviews();
  } catch (error) {
    console.error(error);
    alert('Não foi possível alterar esta avaliação.');
    button.disabled = false;
  }
}

async function removeReview(id, button) {
  if (!confirm('Excluir esta avaliação permanentemente?')) return;
  button.disabled = true;
  try {
    await deleteDoc(doc(db, 'reviews', id));
    await loadReviews();
  } catch (error) {
    console.error(error);
    alert('Não foi possível excluir esta avaliação.');
    button.disabled = false;
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setLoginStatus('Entrando...');
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (credential.user.uid !== ADMIN_UID) {
      await signOut(auth);
      setLoginStatus('Esta conta não possui permissão administrativa.', true);
    }
  } catch (error) {
    console.error(error);
    setLoginStatus('E-mail ou senha inválidos.', true);
  }
});

logoutButton.addEventListener('click', () => signOut(auth));
refreshButton.addEventListener('click', loadReviews);

onAuthStateChanged(auth, async (user) => {
  const authorized = !!user && user.uid === ADMIN_UID;
  loginPanel.hidden = authorized;
  dashboardPanel.hidden = !authorized;

  if (!authorized) {
    if (user) await signOut(auth);
    adminIdentity.textContent = 'Administrador';
    return;
  }

  adminIdentity.textContent = user.email || 'Administrador GrizaTech';
  setLoginStatus('');
  await loadReviews();
});
