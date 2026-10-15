---
slug: transferir-arquivos-do-celular-para-o-pc-sem-cabo
lang: pt
pair: transfer-files-from-phone-to-pc-without-cable
title: Enviar arquivos do celular para o computador | filefinch
description: Como passar fotos, vídeos e outros arquivos de um celular Android ou iPhone para um computador com o filefinch, por uma conexão direta.
h1: Enviar arquivos do celular para o computador
topic: Celular para computador
art: phone-to-pc
alt: Fotos e vídeos voando de um celular direto para um computador de mesa
time: PT3M
howto: Como passar fotos e vídeos do celular para o PC com o filefinch
steps:
  - name: Mostre o código de pareamento no PC
    text: No computador, abra o filefinch no Chrome, Edge, Firefox ou Safari e toque em Mostrar código de pareamento. Aparecem um QR code e 6 palavras.
  - name: Escaneie com o celular
    text: Aponte a câmera do celular para o QR code, ou digite as 6 palavras no filefinch do celular. Não precisa instalar nenhum app.
  - name: Digite as palavras de confirmação no PC
    text: Com os dois conectados, o celular mostra 6 novas palavras de confirmação. Digite essas palavras no PC. No modo sem relays, veja se a impressão digital da conexão, de 12 dígitos, é igual nas duas telas.
  - name: Escolha as fotos e envie
    text: No celular, selecione fotos, vídeos ou documentos e envie. No PC, confira a prévia e salve onde quiser.
  - name: Sem internet, conecte sem relays
    text: Se não houver internet, abra Opções no PC e escolha Conectar sem relays (avançado). Escaneie o QR code do PC com o celular e depois mostre o QR code do celular para a webcam, ou use Copiar código e cole no outro aparelho.
faq:
  - q: Como passar fotos do celular para o PC sem cabo USB?
    a: Abra o filefinch no PC, toque em Mostrar código de pareamento e escaneie o QR code com o celular, ou digite as 6 palavras. Depois é só escolher as fotos no celular e enviar. Tudo acontece pelo navegador.
  - q: Funciona com iPhone e PC com Windows?
    a: Sim. O filefinch funciona em qualquer combinação, incluindo iPhone com Windows, Android com Mac e celular com Linux, desde que os dois tenham um navegador moderno.
  - q: As fotos e vídeos perdem qualidade?
    a: Não. Os arquivos vão byte por byte, sem recompressão. A resolução, a qualidade e os metadados como data e local da foto chegam como estavam no celular.
  - q: Preciso de internet para transferir?
    a: Para o pareamento com 6 palavras, sim, porque ele usa relays públicos na internet. Sem internet, use a opção Conectar sem relays (avançado), em Opções, que não precisa de relay nenhum. Se o celular e o PC estiverem no mesmo Wi-Fi e o filefinch já tiver sido carregado antes nos dois, dá para transferir só pela rede local.
  - q: Por que a transferência parou quando bloqueei o celular?
    a: Navegadores de celular podem pausar abas em segundo plano. Deixe a tela ligada e o filefinch aberto até o envio terminar.
related: [enviar-arquivos-grandes-sem-limite]
---
O cabo sumiu, a entrada do PC não é a mesma do celular ou o computador simplesmente não reconhece o aparelho. Quem nunca passou por isso? Dá para transferir fotos, vídeos e documentos do celular para o PC sem cabo nenhum, só com o navegador, usando o filefinch.

Não precisa instalar app no celular, criar conta ou subir nada para a nuvem. Funciona com Android e iPhone, e do lado do computador com Windows, Mac ou Linux. Abaixo está o passo a passo e algumas dicas para não ter dor de cabeça com vídeos longos.

## O jeito mais rápido: QR code e 6 palavras na tela do PC

O filefinch conecta os dois aparelhos diretamente, de navegador para navegador, usando WebRTC. Para isso, eles pareiam uma única vez, mais ou menos como no Bluetooth. Com o PC e o celular lado a lado, basta a câmera:

1. No PC, abra o [filefinch](app:) e toque em Mostrar código de pareamento. Aparecem na tela um QR code e 6 palavras.
2. No celular, aponte a câmera para o QR code e abra o filefinch. O QR code carrega as mesmas 6 palavras.
3. Se a câmera não ajudar, abra o filefinch no celular e digite as 6 palavras na caixa Tem um código de pareamento. As 4 primeiras letras de cada palavra bastam, e o preenchimento automático sugere as palavras.
4. Conectado! O celular mostra 6 novas palavras de confirmação. Digite essas palavras no PC. Elas provam que o celular é mesmo seu, e nenhum arquivo se move até elas conferirem.
5. No celular, escolha os arquivos e envie.

O código vale para uma conexão só e expira em 10 minutos. Durante o pareamento, o handshake de 6 palavras viaja criptografado por relays públicos que não conseguem lê-lo. Assim que a conexão abre, os dois saem dos relays e seus arquivos vão de aparelho para aparelho.

### Avançado: conectar sem relays

Prefere que nenhum relay participe, ou está sem internet? No PC, abra Opções e escolha Conectar sem relays (avançado). O PC mostra um QR code e um botão Copiar código. O celular escaneia esse QR code e mostra o próprio QR code, com o seu botão Copiar código. Mostre esse QR code para a webcam do PC. Se o computador não tiver webcam, toque em Copiar código no celular, leve o texto até o PC do jeito que preferir, como uma nota para você mesmo, e cole lá. Depois de conectar, confira se a impressão digital da conexão, de 12 dígitos, é igual nas duas telas.

> A leitura pela câmera usa um recurso que nem todo navegador tem. Quando não estiver disponível, digitar as palavras ou colar o código sempre funciona.

## Passando fotos e vídeos sem perder qualidade

Muitos apps de mensagem reduzem fotos e vídeos para economizar dados, o que faz sentido numa conversa, mas não quando você quer guardar o original no computador. No filefinch é diferente: cada arquivo vai byte por byte, igualzinho ao original. A resolução é a mesma, o vídeo não é recomprimido e os metadados (data, câmera e localização, se existirem) vêm junto.

Antes de salvar, dá para ver a prévia das fotos, vídeos, áudios e textos recebidos direto no navegador do PC. Os arquivos ficam numa biblioteca local no próprio computador, e você salva ou apaga quando quiser.

## Onde os arquivos são salvos no PC

Depende do navegador:

| Navegador no PC | Como salva |
|---|---|
| Chrome ou Edge no computador | Pode gravar direto numa pasta que você escolher |
| Firefox e Safari | Salva como download, em fluxo, sem carregar tudo na memória |

Se você vai passar a galeria inteira, escolher uma pasta no Chrome ou no Edge deixa tudo mais organizado. Também dá para mandar uma pasta inteira de uma vez, e a estrutura de subpastas é recriada do outro lado.

## Dicas para vídeos longos e muitos arquivos

Vídeos em 4K e backups de galeria podem ter vários gigabytes. Algumas dicas ajudam bastante:

- **Deixe a tela do celular ligada.** Navegadores de celular podem pausar a aba quando a tela apaga.
- **Use o mesmo Wi-Fi.** Com o celular e o PC na mesma rede, o tráfego fica local e costuma ser bem mais rápido do que pela internet.
- **Fique perto do roteador.** Sinal fraco derruba a velocidade.
- **Não se preocupe com quedas.** Se a conexão cair, reconecte e o envio continua do último ponto confirmado.
- **Confira o resultado.** Cada arquivo é verificado com SHA-256 no final, então você sabe que chegou inteiro.

Para arquivos realmente enormes, o guia sobre [arquivos grandes](guide:enviar-arquivos-grandes-sem-limite) tem mais detalhes.

## E do PC para o celular?

A conexão funciona nos dois sentidos. Com os aparelhos conectados, o PC também pode mandar arquivos para o celular: um PDF para ler no ônibus, músicas, um vídeo para mostrar a alguém. Não precisa refazer a conexão.

No celular, o jeito de salvar varia conforme o sistema e o navegador. Em geral o arquivo recebido entra como download, e de lá você move para a galeria ou para a pasta que preferir. Antes de salvar, a prévia no próprio navegador ajuda a conferir se é o arquivo certo.

## Funciona sem internet?

Funciona, com duas condições. O filefinch é um app web instalável (PWA) que, depois de carregado uma vez, abre mesmo offline. E, sem internet, você usa a opção Conectar sem relays (avançado), escaneando um QR code em cada sentido ou colando os códigos, porque o pareamento por 6 palavras precisa alcançar os relays públicos na internet. Se o celular e o PC estiverem na mesma rede Wi-Fi, eles se encontram pelos endereços locais e transferem sem internet. Então carregue o filefinch nos dois aparelhos enquanto ainda tem conexão e, se quiser, adicione à tela inicial do celular.

## É seguro?

A conexão WebRTC é sempre criptografada com DTLS. No pareamento por palavras, as 6 palavras de confirmação provam que o aparelho que entrou é seu, e não de alguém que viu o código. No modo sem relays, a impressão digital de 12 dígitos igual nas duas telas mostra que ninguém trocou os dados de conexão no meio do caminho. Para arquivos sensíveis, você pode ativar uma senha extra que os dois lados digitam, e cada pedaço do arquivo é lacrado de novo com AES-GCM.

Nenhum servidor nosso entra na história, o filefinch não pede cadastro e não usa rastreamento. No pareamento por palavras, os relays públicos que levam o handshake são de terceiros, mas só veem nomes aleatórios e texto cifrado, nunca seus arquivos. Só lembre que os dados de conexão contêm os endereços de rede do aparelho, então mostre o QR code e as 6 palavras apenas para o seu outro aparelho ou para quem vai receber.

## Quando o filefinch não é a melhor opção

Se você quer que as fotos do celular apareçam sozinhas no PC todos os dias, um backup automático na nuvem atende melhor, porque o filefinch exige os dois aparelhos online e com o app aberto ao mesmo tempo. E se o cabo está ali na gaveta e o PC reconhece o celular sem problema, ele também resolve muito bem.

Para o dia a dia, quando você só quer jogar umas fotos e vídeos no computador sem procurar cabo, o caminho direto pelo navegador é prático. Ou abra agora o [filefinch](app:) no PC e escaneie o QR code.
