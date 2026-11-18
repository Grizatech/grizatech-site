# Ativar Serviços e preços

O catálogo usa o Firebase atual e o login do proprietário que já existe no painel. A lista atual de 15 serviços é usada como ponto de partida. O primeiro salvamento cria o catálogo editável no Firestore.

1. No Firebase Console do site, abra **Firestore Database → Regras**. Compare com `FIRESTORE-RULES.txt` e acrescente o bloco `match /siteSettings/serviceCatalog` dentro de `match /databases/{database}/documents`. Preserve as demais regras ativas. Publique as regras.
2. Na raiz da branch `main` do repositório do site, envie em um único commit `admin.html`, `admin.css`, `admin.js`, `admin-services.js`, `catalog-data.js`, `index.html` e `shop.js`. O ZIP de atualização contém esses arquivos, a referência das regras e este guia. O arquivo de regras serve para o passo anterior no Firebase.
3. Aguarde o GitHub Pages concluir a publicação. Entre em `admin.html` com o login atual, abra **Serviços e preços** e confira as duas listas.
4. Ao salvar uma edição, abra ou atualize a página pública e marque o serviço. Confira o cartão, o total e a mensagem preparada pelo WhatsApp.

Se o catálogo remoto estiver indisponível, o site público exibe os serviços e preços definidos na versão estática. Se o painel apontar erro de permissão, confira o bloco do catálogo nas regras e a conta usada no login.
