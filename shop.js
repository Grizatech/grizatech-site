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
function render(){
 const entries=config.services.filter(x=>selected.has(x.id));
 const total=entries.reduce((sum,s)=>sum+s.price,0);
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
 if(entries.length){const message=['Olá, GrizaTech! Montei uma seleção de serviços pelo site.','','*SERVIÇOS DE INTERESSE*',...entries.map((s,i)=>`${i+1}. ${s.name} — ${format(s.price)}\n   Atendimento: ${s.modality}`),'',`*TOTAL ESTIMADO: ${format(total)}*`,'','Atendimento presencial ou remoto, via N10, conforme a viabilidade. Em serviços físicos, o remoto envolve orientação para execução no local.','',config.pricingNotice,'','Gostaria de confirmar o atendimento e receber uma avaliação do meu equipamento.'];wa.href=`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message.join('\n'))}`;}else wa.removeAttribute('href');
}
wa.addEventListener('click',event=>{if(!selected.size)event.preventDefault();});
expand.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;expand.setAttribute('aria-expanded',String(open));expand.innerHTML=(open?'Fechar resumo':'Ver resumo')+' <span>'+(open?'⌄':'⌃')+'</span>';});
shop.querySelectorAll('details').forEach(detail=>detail.addEventListener('toggle',()=>{if(!detail.open)return;shop.querySelectorAll(`details[name="${detail.name}"]`).forEach(other=>{if(other!==detail)other.open=false;});}));
fetch('services-config.json').then(r=>{if(!r.ok)throw new Error('Configuração indisponível');return r.json();}).then(data=>{config=data;config.services.forEach(s=>{const row=shop.querySelector(`[data-service="${s.id}"]`);if(row)row.querySelector('.shop-price').textContent=format(s.price);});shop.querySelectorAll('input[type=checkbox]').forEach(input=>{input.addEventListener('click',event=>event.stopPropagation());input.addEventListener('change',()=>{if(input.checked)selected.add(input.value);else selected.delete(input.value);render();});});render();}).catch(()=>{countEl.textContent='Não foi possível carregar os valores. Atualize a página.';shop.querySelectorAll('input').forEach(x=>x.disabled=true);});
})();

