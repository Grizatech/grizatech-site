(() => {
'use strict';
const shop=document.getElementById('serviceShop');
const cart=document.querySelector('.quote-cart');
const totalEl=document.getElementById('quoteTotal');
const countEl=document.getElementById('quoteCount');
const list=document.getElementById('quoteItems');
const panel=document.getElementById('quotePanel');
const expand=document.getElementById('quoteExpand');
const wa=document.getElementById('quoteWhatsApp');
const format=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const selected=new Set();
let config;
let catalogReady = false;
function render(){
 const entries=config.services.filter(x=>selected.has(x.id));
 const total=entries.reduce((sum,s)=>sum+Math.round(s.price*100),0)/100;
 totalEl.textContent=format(total);
 countEl.textContent=entries.length?`${entries.length} ${entries.length===1?'serviço selecionado':'serviços selecionados'}`:'Nenhum serviço selecionado';
 list.replaceChildren();
 for(const s of entries){
  const li=document.createElement('li');const name=document.createElement('span');name.textContent=s.name;const mode=document.createElement('small');mode.className='quote-item-mode';mode.textContent=s.modality;name.append(mode);
  const price=document.createElement('strong');price.textContent=format(s.price);
  const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remover '+s.name);remove.addEventListener('click',()=>{selected.delete(s.id);const input=shop.querySelector(`input[value="${s.id}"]`);input.checked=false;render();});
  li.append(name,price,remove);list.append(li);
 }
 document.querySelector('.quote-empty').hidden=entries.length>0;
 shop.querySelectorAll('.shop-item').forEach(el=>el.classList.toggle('is-selected',selected.has(el.dataset.service)));
 wa.setAttribute('aria-disabled',String(entries.length===0));
 if(entries.length){const message=['Olá, GrizaTech! Montei uma seleção de serviços pelo site.','','*SERVIÇOS DE INTERESSE*',...entries.map((s,i)=>`${i+1}. ${s.name} — ${format(s.price)}\n   Atendimento: ${s.modality}`),'',`*TOTAL ESTIMADO: ${format(total)}*`,'','Atendimento presencial ou remoto, via AnyDesk, conforme a viabilidade. Em serviços físicos, o remoto envolve orientação para execução no local.','',config.pricingNotice,'','Gostaria de confirmar o atendimento e receber uma avaliação do meu equipamento.'];wa.href=`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message.join('\n'))}`;}else wa.removeAttribute('href');
}
wa.addEventListener('click',event=>{if(!catalogReady || !selected.size)event.preventDefault();});
expand.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;expand.setAttribute('aria-expanded',String(open));expand.innerHTML=(open?'Fechar resumo':'Ver resumo')+' <span>'+(open?'⌄':'⌃')+'</span>';});

const groups = {
 principal: shop.querySelector('.popular-list'),
 outros: shop.querySelector('.other-grid')
};
const rowTemplates = Object.fromEntries(Object.entries(groups).map(([key, group]) => [key, group.firstElementChild.cloneNode(true)]));

shop.addEventListener('change', event => {
 const input = event.target;
 if (!catalogReady || !input.matches('.shop-select input[type="checkbox"]')) return;
 if (input.checked) selected.add(input.value);
 else selected.delete(input.value);
 render();
});

function applyCatalog(services) {
 const openIds = new Set([...shop.querySelectorAll('details[open]')].map(detail => detail.closest('[data-service]').dataset.service));
 const active = services.filter(service => service.active);
 const rows = { principal: [], outros: [] };
 config.services = active.map(service => {
  const row = rowTemplates[service.group].cloneNode(true);
  row.dataset.service = service.id;
  const input = row.querySelector('input');
  input.value = service.id;
  input.checked = selected.has(service.id);
  input.setAttribute('aria-label', 'Selecionar ' + service.name);
  row.querySelector('.shop-select').title = 'Selecionar ' + service.name;
  row.querySelector('.item-name').textContent = service.name;
  const price = service.priceCents / 100;
  row.querySelector('.shop-price').textContent = format(price);
  row.querySelector('.description p').textContent = service.summary;
  row.querySelector('.service-condition').textContent = config.pricingNotice;
  if (!service.inPerson) row.querySelector('.in-person').remove();
  if (!service.remote) row.querySelector('.remote').remove();
  row.querySelector('details').open = openIds.has(service.id);
  rows[service.group].push(row);
  const modality = service.inPerson && service.remote ? 'Presencial ou remoto' : service.inPerson ? 'Presencial' : 'Remoto';
  return { id: service.id, name: service.name, price, modality };
 });
 const activeIds = new Set(active.map(service => service.id));
 for (const id of selected) {
  if (!activeIds.has(id)) selected.delete(id);
 }
 for (const [key, group] of Object.entries(groups)) {
  group.replaceChildren(...rows[key]);
  if (!rows[key].length) {
   const empty = document.createElement('p');
   empty.textContent = 'Nenhum serviço disponível nesta lista.';
   group.append(empty);
  }
 }
 render();
}

async function initialize() {
 const inputs = shop.querySelectorAll('.shop-select input');
 for (const input of inputs) input.disabled = true;
 countEl.textContent = 'Carregando catálogo…';
 let timeout;
 const publishedCatalog = import('./catalog-data.js').then(module => module.loadServiceCatalog());
 const availableCatalog = Promise.race([
  publishedCatalog,
  new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Tempo limite do catálogo online.')), 5000); })
 ]).catch(error => {
  console.warn('Catálogo online indisponível. Usando a lista padrão.', error);
  return null;
 }).finally(() => clearTimeout(timeout));
 try {
  const response = await fetch('services-config.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('Configuração indisponível');
  config = await response.json();
  for (const input of shop.querySelectorAll('.shop-select input:checked')) selected.add(input.value);
 } catch (error) {
  countEl.textContent = 'Não foi possível carregar os valores. Atualize a página.';
  shop.querySelectorAll('input').forEach(input => { input.disabled = true; });
  return;
 }
 const catalog = await availableCatalog;
 catalogReady = true;
 for (const input of inputs) input.disabled = false;
 if (catalog?.services) applyCatalog(catalog.services);
 else render();
}

initialize();
})();

