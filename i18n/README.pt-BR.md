<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/mascot-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/mascot.svg" width="168" alt="Finn, o mascote do filefinch: um pequeno tentilhão entregador com boné, bolsa de mensageiro e um pacotinho">
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/banner-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/banner.svg" width="820" alt="Banner do filefinch: envie arquivos e pastas inteiras direto entre os seus aparelhos, sem nuvem, sem conta, com criptografia de ponta a ponta">
  </picture>
</p>

<h1 align="center">filefinch: envie arquivos e pastas direto entre os seus aparelhos, grátis e com privacidade</h1>

<p align="center">
  <a href="https://github.com/kwy404/filefinch/actions/workflows/ci.yml"><img src="https://github.com/kwy404/filefinch/actions/workflows/ci.yml/badge.svg" alt="Status do CI do filefinch"></a>
  <a href="https://github.com/kwy404/filefinch/blob/main/LICENSE"><img src="https://img.shields.io/badge/licen%C3%A7a-MIT-2f6fed" alt="Licença MIT"></a>
  <a href="https://kwy404.github.io/filefinch/app/"><img src="https://img.shields.io/badge/abrir-o%20app-ff7a45" alt="Abrir o app filefinch no navegador"></a>
  <img src="https://img.shields.io/badge/servidor-nenhum-22b98a" alt="Sem servidor: ponto a ponto no navegador">
  <img src="https://img.shields.io/badge/conta-nenhuma-22b98a" alt="Sem conta">
</p>

<p align="center">
  <a href="https://kwy404.github.io/filefinch/app/"><strong>Começar a enviar</strong></a> &middot;
  <a href="https://kwy404.github.io/filefinch/">Site</a> &middot;
  <a href="https://kwy404.github.io/filefinch/pt/guias/">Guias em português</a> &middot;
  <a href="https://github.com/kwy404/filefinch/blob/main/SECURITY.md">Segurança</a> &middot;
  <a href="https://github.com/kwy404/filefinch/blob/main/README.md">Read in English</a>
</p>

**O filefinch é um app web gratuito e sem servidor para transferir arquivos ponto a ponto.** Funciona como um drive pessoal entre o seu celular e os seus computadores, só que sem o drive no meio: abra nos dois aparelhos, compartilhe um link de convite ou um QR code e envie arquivos e pastas inteiras de qualquer tamanho direto de um aparelho para o outro. Sem conta, sem upload, sem servidor nosso, e toda conexão é criptografada de ponta a ponta pelo navegador.

## Sumário

- [Por que o filefinch](#por-que-o-filefinch)
- [Começo rápido](#começo-rápido)
- [Recursos](#recursos)
- [Como funciona](#como-funciona)
- [Privacidade e segurança](#privacidade-e-segurança)
- [Limites, com honestidade](#limites-com-honestidade)
- [Perguntas frequentes](#perguntas-frequentes)
- [Rodar localmente](#rodar-localmente)
- [Mais de kwy404](#mais-de-kwy404)
- [Autor](#autor)
- [Licença](#licença)

## Por que o filefinch

- **100% sem servidor.** O site é feito de páginas estáticas no GitHub Pages. Nenhum servidor nosso vê os seus arquivos ou mensagens.
- **Sem conta.** Nada de cadastro, login, analytics ou rastreamento.
- **Sem upload.** Os arquivos vão de aparelho para aparelho via WebRTC, nunca para um serviço de armazenamento.
- **Criptografia de ponta a ponta.** O WebRTC criptografa toda conexão com DTLS. Uma senha opcional adiciona uma segunda camada.
- **Sem limite de tamanho.** O filefinch não impõe limite. Os arquivos vão em pedaços pequenos, então o limite real é o espaço livre no aparelho que recebe.

## Começo rápido

1. Abra [kwy404.github.io/filefinch/app/](https://kwy404.github.io/filefinch/app/) no primeiro aparelho e crie um convite. Aparecem um link e um QR code.
2. Abra o link no segundo aparelho ou escaneie o QR code com a câmera.
3. O segundo aparelho mostra um código de resposta curto. Mande de volta por qualquer mensageiro ou mostre para a câmera do primeiro aparelho.
4. As duas telas mostram a mesma impressão digital curta. Compare, depois solte arquivos ou uma pasta. Eles voam direto.

Se quiser, instale como app pelo menu do navegador. Depois de carregado, ele funciona offline em uma rede local.

## Recursos

| | |
|---|---|
| **Link de convite e QR code** | Um link ou QR code para conectar e uma resposta curta para concluir. Leitura pela câmera onde o navegador permite, colar em todo lugar. |
| **Pastas inteiras** | A árvore de pastas é recriada do outro lado (ou chega como um .zip quando o navegador não tem acesso a pastas). Caminhos recebidos são higienizados. |
| **Retomada** | Se a conexão cair, reconecte e a transferência continua do último pedaço confirmado. |
| **Sincronização de pastas** | Nos dois sentidos, só enviar ou só receber. Você revisa o plano de mudanças antes de qualquer gravação. |
| **Pré-visualização** | Imagens, vídeo, áudio, PDF e texto, exibidos com segurança. |
| **Biblioteca local** | Guarde arquivos recebidos dentro do filefinch, neste navegador, para ver, salvar ou reenviar depois. |
| **Verificação de integridade** | Cada arquivo recebe um hash SHA-256 durante o envio, conferido por quem recebe. |
| **Impressão digital da conexão** | Um código curto dos dois certificados da conexão, nas duas telas, para perceber um convite trocado. |
| **Senha opcional** | PBKDF2 (600.000 rodadas) gera uma chave AES-GCM em cada aparelho e cada pedaço é selado de novo. |
| **Ajuda com redes restritas** | Quando a rota direta falha, o filefinch explica o motivo e permite adicionar o seu próprio TURN nas Configurações. |
| **PWA instalável** | Manifest e service worker. Funciona offline depois de carregado. |

## Como funciona

Não existe servidor de sinalização. O próprio convite leva o que o segundo aparelho precisa:

1. O primeiro aparelho cria uma oferta WebRTC e espera a coleta de ICE terminar (sem trickle). A oferta é reduzida, comprimida com `CompressionStream('deflate-raw')` e gravada em base64url no link (`#i=...`) e em um QR code desenhado pelo próprio codificador do filefinch.
2. O segundo aparelho abre o link, monta a resposta do mesmo jeito e mostra um código de resposta curto (`#r=...`), também como link ou QR code.
3. O primeiro aparelho lê a resposta. Uma ida e volta e os navegadores se conectam direto. Colar à mão sempre funciona.

Para achar uma rota, os navegadores usam os servidores STUN públicos do Google (`stun.l.google.com:19302` e `stun1` a `stun4`). O Google não oferece TURN público, então quando os dois aparelhos estão atrás de NAT restrito é preciso um relay TURN, que você pode adicionar nas Configurações. Ele fica salvo só no seu aparelho.

## Privacidade e segurança

- Nenhum servidor nosso vê os seus arquivos ou mensagens. Não existe servidor do filefinch.
- O WebRTC criptografa toda conexão de ponta a ponta com DTLS. As chaves nascem dentro dos dois navegadores.
- Um relay TURN, quando usado, só repassa pacotes criptografados e não consegue lê-los. Ele vê os dois endereços IP e o volume de dados.
- Sem conta e nada guardado online.
- A camada opcional de senha usa PBKDF2-SHA256 com 600.000 iterações para gerar uma chave AES-GCM de 256 bits em cada aparelho.
- As duas telas mostram uma impressão digital curta. Se forem iguais, ninguém trocou o convite ou a resposta no caminho.

Notas honestas: o servidor STUN vê o seu endereço IP, como qualquer site. O link de convite contém os endereços de rede do aparelho que o criou, então compartilhe só com o seu outro aparelho ou com quem vai receber. Nenhum software pode prometer que é impossível de atacar; veja o [SECURITY.md](https://github.com/kwy404/filefinch/blob/main/SECURITY.md).

## Limites, com honestidade

- **Os dois aparelhos precisam estar online** com o filefinch aberto durante a transferência.
- **NAT restrito dos dois lados** (algumas operadoras móveis e redes corporativas) pode bloquear a rota direta. O filefinch detecta e oferece a configuração de TURN.
- **A velocidade segue o lado mais lento.** Pela internet, geralmente é o upload de quem envia. Na mesma rede Wi-Fi o tráfego fica local.
- **Celulares pausam abas em segundo plano.** Deixe a tela ligada em transferências longas, ou retome depois.

## Perguntas frequentes

**Como enviar arquivos grandes sem limite e de graça?** Abra o filefinch nos dois aparelhos, conecte com o link ou QR code e solte os arquivos. Não há limite de tamanho imposto pelo filefinch.

**Como passar arquivos do celular para o PC sem cabo?** Abra o filefinch no PC, escaneie o QR code com o celular, mande a resposta de volta e escolha as fotos e vídeos. Eles chegam na qualidade original.

**Existe AirDrop para Windows e Android?** O filefinch funciona em qualquer navegador moderno, então envia entre Windows, Android, iPhone, Mac e Linux. É um projeto independente, sem relação com Apple, Google ou Microsoft.

**Funciona sem internet?** Depois de carregado, sim: dois aparelhos na mesma rede local conseguem se conectar.

Guias em português: [arquivos grandes sem limite](https://kwy404.github.io/filefinch/pt/guias/enviar-arquivos-grandes-sem-limite/), [do celular para o PC sem cabo](https://kwy404.github.io/filefinch/pt/guias/transferir-arquivos-do-celular-para-o-pc-sem-cabo/) e [AirDrop para Windows e Android](https://kwy404.github.io/filefinch/pt/guias/airdrop-para-windows-e-android/).

## Rodar localmente

São arquivos estáticos, então qualquer servidor estático serve. Com Node 18 ou mais novo:

```bash
git clone https://github.com/kwy404/filefinch.git
cd filefinch
npm ci
npm run build:app                  # copia src/ para docs/app/lib/ e atualiza o service worker
node scripts/site/build-site.mjs   # gera a página inicial, os guias, o sitemap e as artes
npm run serve                      # serve a pasta docs/ localmente
npm test                           # testes unitários e do site
```

## Mais de kwy404

[Monsoon](https://kwy404.github.io/monsoon/), [Voodoo.js](https://kwy404.github.io/Voodoo.js/), [howlden](https://kwy404.github.io/howlden/), [breakhound](https://kwy404.github.io/breakhound/), [vueleap](https://kwy404.github.io/vueleap/), [graphemely](https://kwy404.github.io/graphemely/), [numberparrot](https://kwy404.github.io/numberparrot/), [edgegoat](https://kwy404.github.io/edgegoat/), [cookieowl](https://kwy404.github.io/cookieowl/), [installkite](https://kwy404.github.io/installkite/), [a11ymedic](https://kwy404.github.io/a11ymedic/), [fontsketch](https://kwy404.github.io/fontsketch/) e [kastor](https://kwy404.github.io/kastor/).

## Autor

Criado por **Alexandre Kohler** ([GitHub](https://github.com/kwy404) e [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)).

## Licença

[MIT](https://github.com/kwy404/filefinch/blob/main/LICENSE). AirDrop é marca registrada da Apple Inc. O filefinch é um projeto independente.
