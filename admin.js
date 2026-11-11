import { discoverGallery, loadGalleryNames, saveGalleryName } from './gallery-data.js?v=20261110';
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

const galleryPanel = document.getElementById('galleryPanel');
const galleryList = document.getElementById('adminGallery');
const galleryStatus = document.getElementById('galleryStatus');
const refreshGallery = document.getElementById('refreshGallery');
let galleryLoaded = false;

async function loadAdminGallery() {
  refreshGallery.disabled = true;
  galleryStatus.textContent = 'Carregando fotos e nomes...';
  galleryStatus.className = 'admin-status';
  try {
    const [photos, names] = await Promise.all([discoverGallery(), loadGalleryNames()]);
    if (auth.currentUser?.uid !== ADMIN_UID) return;
    galleryList.replaceChildren();
    for (const photo of photos) {
      const card = document.createElement('form');
      card.className = 'admin-machine';
      const image = document.createElement('img');
      image.src = photo.image;
      image.alt = 'Máquina da foto ' + photo.id;
      image.loading = 'lazy';
      const filename = document.createElement('small');
      filename.textContent = 'cliente-' + photo.id + '.jpg';
      const label = document.createElement('label');
      label.textContent = 'Nome ou apelido do dono';
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 60;
      input.value = names.get(photo.id) || '';
      input.placeholder = 'Ex.: Rafael M.';
      const preview = document.createElement('strong');
      preview.className = 'gallery-owner-preview';
      const updatePreview = () => { preview.textContent = input.value.trim() || 'Trabalho realizado pela GrizaTech.'; };
      input.addEventListener('input', updatePreview);
      updatePreview();
      label.append(input);
      const save = document.createElement('button');
      save.type = 'submit';
      save.textContent = 'Salvar nome';
      const status = document.createElement('p');
      status.className = 'admin-status';
      status.setAttribute('role', 'status');
      card.addEventListener('submit', async event => {
        event.preventDefault();
        save.disabled = true;
        input.disabled = true;
        status.textContent = 'Salvando...';
        status.className = 'admin-status';
        try {
          input.value = await saveGalleryName(photo.id, input.value);
          updatePreview();
          status.textContent = 'Salvo. O nome já está disponível na galeria.';
        } catch (error) {
          console.error(error);
          status.textContent = 'Falha ao salvar. Confira sua conexão e permissão de acesso.';
          status.className = 'admin-status error';
        } finally {
          save.disabled = false;
          input.disabled = false;
        }
      });
      card.append(image, filename, label, preview, save, status);
      galleryList.append(card);
    }
    galleryLoaded = true;
    galleryStatus.textContent = photos.length + ' máquinas encontradas.';
  } catch (error) {
    console.error(error);
    galleryStatus.textContent = 'Não foi possível carregar os nomes. Confira a conexão e as regras do Firestore e tente atualizar.';
    galleryStatus.className = 'admin-status error';
  } finally {
    refreshGallery.disabled = false;
  }
}

document.querySelectorAll('[data-panel]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-panel]').forEach(tab => {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', String(active));
      document.getElementById(tab.dataset.panel).hidden = !active;
    });
    if (button.dataset.panel === 'galleryPanel' && !galleryLoaded) loadAdminGallery();
  });
});
refreshGallery.addEventListener('click', loadAdminGallery);
onAuthStateChanged(auth, user => {
  if (user?.uid !== ADMIN_UID) {
    galleryLoaded = false;
    galleryList.replaceChildren();
    galleryStatus.textContent = '';
  }
});
