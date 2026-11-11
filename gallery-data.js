import { db } from './firebase.js';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

export async function discoverGallery() {
  const photos = [];
  for (let start = 1; start <= 99; start += 12) {
    const batch = Array.from({ length: Math.min(12, 100 - start) }, (_, offset) => {
      const id = String(start + offset).padStart(2, '0');
      const image = 'assets/portfolio/cliente-' + id + '.jpg';
      return new Promise(resolve => {
        const probe = new Image();
        probe.onload = () => resolve({ id, image });
        probe.onerror = () => resolve(null);
        probe.src = image;
      });
    });
    photos.push(...(await Promise.all(batch)).filter(Boolean));
  }
  return photos;
}

export async function loadGalleryNames() {
  const snapshot = await getDocs(collection(db, 'galleryNames'));
  return new Map(snapshot.docs.map(item => [item.id, String(item.data().name || '')]));
}

export async function saveGalleryName(id, name) {
  if (!/^(0[1-9]|[1-9][0-9])$/.test(id)) throw new Error('Número de foto inválido.');
  const cleaned = name.trim();
  if (cleaned.length > 60) throw new Error('Use até 60 caracteres.');
  await setDoc(doc(db, 'galleryNames', id), { name: cleaned, updatedAt: serverTimestamp() });
  return cleaned;
}
