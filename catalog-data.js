import { db } from './firebase.js';
import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const catalog = doc(db, 'siteSettings', 'serviceCatalog');
export const maxServices = 60;

export async function loadDefaultCatalog() {
  const response = await fetch('services-config.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('Configuração indisponível.');
  return response.json();
}

export function validServices(services) {
  if (!Array.isArray(services) || services.length > maxServices) return false;
  const ids = new Set();
  return services.every(service => {
    if (!service || typeof service.id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(service.id) || ids.has(service.id)) return false;
    ids.add(service.id);
    return typeof service.name === 'string' && service.name.trim().length > 0 && service.name.length <= 100
      && typeof service.summary === 'string' && service.summary.trim().length > 0 && service.summary.length <= 1600
      && Number.isInteger(service.priceCents) && service.priceCents >= 0 && service.priceCents <= 9999999
      && ['principal', 'outros'].includes(service.group)
      && typeof service.active === 'boolean'
      && typeof service.inPerson === 'boolean' && typeof service.remote === 'boolean'
      && (service.inPerson || service.remote);
  });
}

export function defaultServices(config) {
  return config.services.map(service => ({
    id: service.id,
    name: service.name,
    summary: service.summary,
    priceCents: Math.round(service.price * 100),
    group: service.group === 'principal' ? 'principal' : 'outros',
    active: true,
    inPerson: service.modalities.includes('Presencial'),
    remote: service.modalities.includes('Remoto')
  }));
}

export async function loadServiceCatalog() {
  const snapshot = await getDocFromServer(catalog);
  if (!snapshot.exists()) return { revision: 0, services: null };
  const { revision, services } = snapshot.data();
  if (!Number.isSafeInteger(revision) || revision < 1 || !validServices(services)) {
    throw new Error('Catálogo publicado inválido.');
  }
  return { revision, services };
}

export async function saveServiceCatalog(services, revision) {
  if (!validServices(services)) throw new Error('Confira os campos dos serviços.');
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(catalog);
    const currentRevision = snapshot.exists() ? snapshot.data().revision : 0;
    if (currentRevision !== revision) {
      throw new Error('O catálogo mudou em outra sessão. Recarregue antes de salvar novamente.');
    }
    const nextRevision = revision + 1;
    transaction.set(catalog, { services, revision: nextRevision, updatedAt: serverTimestamp() });
    return nextRevision;
  });
}
