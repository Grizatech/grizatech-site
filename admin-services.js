import { defaultServices, loadDefaultCatalog, loadServiceCatalog, maxServices, saveServiceCatalog, validServices } from './catalog-data.js';

export function initializeServiceEditor(isAdmin) {
  const form = document.getElementById('serviceEditor');
  const fields = form.querySelector('fieldset');
  const list = document.getElementById('serviceEditorList');
  const template = document.getElementById('serviceEditorRow');
  const status = document.getElementById('servicesStatus');
  const reload = document.getElementById('reloadServices');
  const add = document.getElementById('addService');
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  let revision = null;
  let busy = false;
  let dirty = false;
  let session = 0;

  function message(text, error = false) {
    status.textContent = text;
    status.classList.toggle('error', error);
  }

  function setBusy(value) {
    busy = value;
    reload.disabled = value;
    fields.disabled = value;
    add.disabled = list.children.length >= maxServices;
  }

  function appendRow(service, position, draft = false) {
    const row = template.content.firstElementChild.cloneNode(true);
    row.dataset.service = service.id;
    const field = name => row.querySelector(`[name="${name}"]`);
    field('name').value = service.name;
    field('summary').value = service.summary;
    field('group').value = service.group;
    field('price').value = draft ? '' : (service.priceCents / 100).toFixed(2);
    field('position').value = position;
    for (const key of ['inPerson', 'remote', 'active']) field(key).checked = service[key];
    function updateTitle() {
      const category = field('group').selectedOptions[0].textContent;
      const price = field('price').value ? money.format(field('price').valueAsNumber) : 'Preço pendente';
      const visibility = field('active').checked ? '' : ' · Oculto';
      row.querySelector('summary').textContent = `${category} · ${field('position').value} · ${field('name').value.trim() || 'Novo serviço'} · ${price}${visibility}`;
    }
    row.addEventListener('input', updateTitle);
    updateTitle();
    const discard = field('discard');
    discard.hidden = !draft;
    discard.addEventListener('click', () => {
      row.remove();
      add.disabled = false;
      add.focus();
    });
    list.append(row);
    if (draft) {
      row.open = true;
      field('name').focus();
    }
  }

  function showServices(services) {
    list.replaceChildren();
    const positions = { principal: 0, outros: 0 };
    for (const service of services) appendRow(service, ++positions[service.group]);
    form.hidden = false;
    dirty = false;
  }

  async function open(force = false) {
    if (!isAdmin() || busy || (!force && revision !== null)) return;
    const generation = session;
    setBusy(true);
    message('Carregando catálogo…');
    try {
      const current = await loadServiceCatalog();
      const services = current.services ?? defaultServices(await loadDefaultCatalog());
      if (generation !== session || !isAdmin()) return;
      if (!validServices(services)) throw new Error('Catálogo inicial inválido.');
      revision = current.revision;
      showServices(services);
      message(`${services.length} serviços no catálogo.`);
    } catch (error) {
      if (generation !== session || !isAdmin()) return;
      console.error(error);
      message('Não foi possível carregar o catálogo. Confira a conexão e as regras do Firestore.', true);
    } finally {
      if (generation === session) setBusy(false);
    }
  }

  reload.addEventListener('click', () => {
    if (!dirty || window.confirm('Descartar as mudanças que ainda não foram salvas?')) open(true);
  });
  form.addEventListener('input', () => { dirty = true; });
  form.addEventListener('invalid', event => {
    event.target.closest('details').open = true;
  }, true);
  add.addEventListener('click', () => {
    if (list.children.length >= maxServices) return;
    const positions = [...list.children].filter(row => row.querySelector('[name="group"]').value === 'outros')
      .map(row => row.querySelector('[name="position"]').valueAsNumber || 0);
    const position = Math.min(maxServices, Math.max(0, ...positions) + 1);
    appendRow({ id: crypto.randomUUID(), group: 'outros', active: true, inPerson: true, remote: true, name: '', summary: '' }, position, true);
    add.disabled = list.children.length >= maxServices;
    dirty = true;
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!isAdmin() || busy || revision === null) return;
    const rows = [...list.children];
    const entries = rows.map(row => {
      const field = name => row.querySelector(`[name="${name}"]`);
      return {
        position: field('position').valueAsNumber,
        service: {
          id: row.dataset.service,
          name: field('name').value.trim(),
          summary: field('summary').value.trim(),
          group: field('group').value,
          priceCents: Math.round(field('price').valueAsNumber * 100),
          active: field('active').checked,
          inPerson: field('inPerson').checked,
          remote: field('remote').checked
        }
      };
    });
    for (const [index, { service }] of entries.entries()) {
      if (validServices([service])) continue;
      rows[index].open = true;
      rows[index].querySelector('summary').focus();
      message('Informe nome, resumo, preço e pelo menos uma modalidade em cada serviço.', true);
      return;
    }
    entries.sort((a, b) => b.service.group.localeCompare(a.service.group) || a.position - b.position);
    const services = entries.map(entry => entry.service);
    const generation = session;
    setBusy(true);
    message('Salvando catálogo…');
    try {
      const savedRevision = await saveServiceCatalog(services, revision);
      if (generation !== session || !isAdmin()) return;
      revision = savedRevision;
      showServices(services);
      message('Catálogo salvo. Abra ou atualize o site para conferir.');
    } catch (error) {
      if (generation !== session || !isAdmin()) return;
      console.error(error);
      message(error.code ? 'Não foi possível salvar. Confira a conexão e as regras do Firestore.' : error.message, true);
    } finally {
      if (generation === session) setBusy(false);
    }
  });

  return {
    open,
    reset() {
      session += 1;
      revision = null;
      dirty = false;
      form.hidden = true;
      list.replaceChildren();
      message('');
      setBusy(false);
    }
  };
}
