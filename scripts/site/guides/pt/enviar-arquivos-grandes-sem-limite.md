---
slug: enviar-arquivos-grandes-sem-limite
lang: pt
title: Enviar arquivos grandes | filefinch
description: Como o filefinch envia arquivos grandes direto entre dois aparelhos, gravando no disco aos poucos, com conferência e retomada se a conexão cair.
h1: Enviar arquivos grandes direto entre aparelhos
topic: Arquivos grandes
art: big-file
alt: Um bando de tentilhões carregando juntos um rolo de filme enorme
time: PT5M
howto: Como enviar um arquivo grande com o filefinch
steps:
  - name: Abra o filefinch nos dois aparelhos
    text: Quem envia e quem recebe abrem o filefinch no navegador. Não precisa instalar nada nem criar conta.
  - name: Mostre o código de pareamento
    text: No primeiro aparelho, toque em Mostrar código de pareamento. Aparecem um QR code e 6 palavras lado a lado.
  - name: Digite as 6 palavras no outro aparelho
    text: Quem recebe digita as palavras na caixa Tem um código de pareamento ou escaneia o QR code. Se a rede bloquear os relays públicos, abra Opções e escolha Conectar sem relays (avançado), em que cada lado escaneia um QR code ou cola o código do outro.
  - name: Escolha o arquivo e envie
    text: Selecione o arquivo grande ou uma pasta inteira. Ele vai em pedaços direto de um navegador para o outro.
  - name: Mantenha os dois online até o fim
    text: Deixe a tela ligada e o filefinch aberto nos dois lados. No final, quem recebe confere o hash de cada arquivo.
faq:
  - q: Qual o tamanho máximo de arquivo que posso enviar?
    a: O filefinch não impõe limite de tamanho. Na prática, o que limita é o espaço livre no disco de quem recebe, os dois aparelhos ficarem online e a forma como o navegador salva o arquivo.
  - q: Preciso fazer upload do arquivo para algum servidor?
    a: Não. O arquivo vai direto de um navegador para o outro por uma conexão WebRTC criptografada e não fica guardado em servidor nenhum. Só o handshake de 6 palavras viaja criptografado por relays públicos que não conseguem lê-lo, e seus arquivos vão de aparelho para aparelho.
  - q: E se a internet cair no meio do envio?
    a: Basta reconectar. A transferência continua a partir do último ponto confirmado em vez de começar do zero, o que faz muita diferença em arquivos de vários gigabytes.
  - q: O envio é muito lento, o que pode ser?
    a: A velocidade depende da conexão mais lenta das duas, geralmente o upload de quem envia. Se os dois estiverem na mesma rede Wi-Fi, o tráfego fica local e costuma ser bem mais rápido.
  - q: O filefinch é gratuito mesmo?
    a: Sim. É um projeto de código aberto com licença MIT, sem planos pagos, sem cadastro e sem anúncios ou rastreamento.
related: [transferir-arquivos-do-celular-para-o-pc-sem-cabo]
---
Precisa mandar um vídeo de 20 GB, o backup do celular ou a pasta inteira de um projeto e esbarrou no limite do anexo de e-mail ou do plano gratuito de algum serviço? O filefinch resolve isso de outro jeito: em vez de subir o arquivo para a nuvem e baixar depois, ele manda direto de um navegador para o outro, sem limite de tamanho definido pelo app.

É grátis, de código aberto e funciona sem cadastro em Windows, Mac, Linux, Android e iPhone. Neste guia você vê como funciona, o passo a passo e os cuidados para arquivos realmente grandes chegarem inteiros.

## Por que os limites existem nos outros caminhos

Quase todo jeito comum de enviar arquivo passa por um servidor no meio. O anexo de e-mail tem teto de poucos megabytes. Links de nuvem e serviços de transferência guardam uma cópia do arquivo por um tempo, e guardar arquivos custa dinheiro, por isso os planos gratuitos costumam ter limite de tamanho, de prazo ou de quantidade.

No filefinch não existe esse armazenamento no meio. Os dois aparelhos se conectam diretamente, e o arquivo vai em pedaços de 64 KiB de um lado para o outro. Como ninguém precisa guardar nada, não há motivo para impor teto. O que sobra são limites práticos, que explicamos mais abaixo.

## Passo a passo para enviar um arquivo grande

O jeito padrão de conectar é parear com 6 palavras, mais ou menos como no Bluetooth:

1. Abra o [filefinch](app:) no navegador dos dois aparelhos, o que envia e o que recebe.
2. No aparelho que vai enviar, toque em Mostrar código de pareamento. Aparecem um QR code e 6 palavras lado a lado.
3. Se a pessoa estiver do seu lado, ela só escaneia o QR code. Se estiver longe, mande as 6 palavras por mensagem ou leia numa ligação.
4. Do outro lado, a pessoa digita as palavras na caixa Tem um código de pareamento. As 4 primeiras letras de cada palavra bastam, e dá para colar a frase inteira.
5. Conectou? O aparelho de quem recebe mostra 6 novas palavras de confirmação. Digite essas palavras no aparelho que envia. Se a pessoa estiver longe, ela pode ler as palavras para você numa ligação. Nenhum arquivo se move até elas conferirem.
6. Escolha o arquivo ou a pasta e envie.

O código vale para uma conexão só e expira em 10 minutos. Para o pareamento acontecer, o handshake de 6 palavras viaja criptografado por relays públicos que não conseguem lê-lo. Depois disso, seus arquivos vão de aparelho para aparelho e nunca passam por esses relays.

### Avançado: conectar sem relays

Se a rede bloquear os relays públicos, ou se você prefere que nenhum relay participe da conexão, abra Opções e escolha Conectar sem relays (avançado). O primeiro aparelho mostra um QR code e um botão Copiar código. Quem recebe escaneia esse QR code ou cola o código, e o aparelho dele mostra o próprio QR code e código, que voltam para você do mesmo jeito: pela câmera ou copiando e colando. É uma única ida e volta, feita à mão. Depois de conectar, confira se a impressão digital da conexão, um código de 12 dígitos, é igual nas duas telas.

> Dica: se a câmera não conseguir ler o código, copiar e colar sempre funciona.

## Até onde dá para ir: os limites reais

O filefinch não define limite, mas o mundo real define alguns:

| Limite prático | O que fazer |
|---|---|
| Espaço livre no disco de quem recebe | Confira antes de enviar um arquivo de dezenas de gigabytes |
| Os dois aparelhos precisam ficar online | Não feche a aba e não deixe o computador dormir |
| Celular pode pausar abas em segundo plano | Deixe a tela ligada durante envios longos |
| Forma como o navegador salva | No computador, Chrome e Edge gravam direto numa pasta escolhida |

Sobre esse último ponto: navegadores baseados em Chromium no computador conseguem gravar o arquivo direto numa pasta que você escolhe. Nos outros navegadores, o arquivo é salvo como um download em fluxo, controlado por um service worker. Nos dois casos, quem envia nunca carrega o arquivo inteiro na memória.

## Velocidade e quedas de conexão

### O que esperar da velocidade

A velocidade é sempre a da conexão mais lenta entre as duas, e quase sempre isso significa a velocidade de upload de quem envia. Muita internet residencial no Brasil tem upload bem menor que o download, então vale saber disso antes de mandar um arquivo enorme pela internet.

Quando os dois aparelhos estão na mesma rede, a história muda. O tráfego fica dentro do roteador e não depende do seu plano de internet, por isso costuma ser bem mais rápido. Depois que o filefinch carregou uma vez, dá até para transferir sem internet nenhuma, só com a rede local, usando Conectar sem relays (avançado), que não precisa de relay nenhum. O pareamento por 6 palavras precisa de internet para alcançar os relays.

### Se a conexão cair, nada se perde

Em envios de muitos gigabytes, uma queda de Wi-Fi ou uma troca de rede no celular acontece. O filefinch guarda o último ponto confirmado: é só reconectar que a transferência continua dali, arredondada para o início do pedaço, em vez de recomeçar do zero.

E para ter certeza de que nada veio corrompido, cada arquivo é verificado com SHA-256 enquanto é enviado. Quem recebe confere o hash no final. Se bateu, o arquivo é idêntico ao original, byte por byte.

## Segurança e privacidade

Nenhum servidor nosso participa da transferência. No pareamento por palavras, os dois aparelhos transformam as 6 palavras em um nome de tópico e uma chave, e se encontram em alguns brokers MQTT públicos, mantidos por terceiros e não pelo filefinch. Esses relays só veem nomes que parecem aleatórios e texto cifrado, e os dois lados saem deles assim que a conexão abre.

A conexão WebRTC é sempre criptografada com DTLS, com chaves criadas nos dois navegadores a cada conexão. Para arquivos sensíveis, dá para ativar uma senha extra: os dois digitam a mesma frase, que vira uma chave AES-GCM de 256 bits em cada aparelho, e cada pedaço é lacrado de novo. A senha em si nunca trafega pela rede.

Um cuidado importante: os dados de conexão contêm os endereços de rede do aparelho. Mostre o QR code e as 6 palavras só para o seu outro aparelho ou para a pessoa que vai receber, e use um código novo a cada conexão. Mais detalhes na seção de [privacidade](home:#privacy).

## Vídeos e fotos na qualidade original

Um motivo comum para procurar como enviar arquivos grandes é não querer que o vídeo chegue comprimido. No filefinch, fotos e vídeos vão byte por byte: mesma resolução, mesma qualidade e metadados intactos. Antes de salvar, quem recebe ainda pode ver uma prévia de imagens, vídeos, áudios e textos no próprio navegador.

Se o arquivo estiver no celular, veja também o guia [do celular para o computador](guide:transferir-arquivos-do-celular-para-o-pc-sem-cabo).

## Quando o filefinch não é a melhor opção

Seja honesto com a sua situação. Se quem vai receber não pode ficar online ao mesmo tempo que você, um link de nuvem é a ferramenta certa, porque ele guarda o arquivo até a pessoa baixar. O filefinch não tem caixa postal no meio.

Também pode acontecer de os dois aparelhos estarem atrás de redes muito restritas, como algumas operadoras móveis ou firewalls de empresa. Nesse caso a conexão direta pode falhar, e o filefinch avisa e explica o motivo. Você pode adicionar seu próprio servidor TURN nas configurações para retransmitir os dados, que continuam criptografados. E se a rede bloquear os relays do pareamento por palavras, a opção Conectar sem relays (avançado), em Opções, resolve. Fora isso, para quem pode ficar online junto, enviar direto costuma ser o caminho mais simples.

## Resumindo

- Sem limite de tamanho definido pelo app
- Sem upload para nuvem e sem cadastro
- Pareamento com QR code e 6 palavras, ou sem relays nenhum na opção avançada
- Retomada de onde parou ao reconectar
- Verificação de integridade com SHA-256
- Funciona entre qualquer par: Android, iPhone, Windows, Mac e Linux

Abra o [filefinch](app:) nos dois aparelhos e mande aquele arquivo que não cabia em lugar nenhum.
