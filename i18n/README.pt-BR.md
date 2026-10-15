<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/kwy404/filefinch/54913341b0dae51546e67d4cc69f8b70f5221e53/assets/banner-dark.svg">
    <img src="https://raw.githubusercontent.com/kwy404/filefinch/54913341b0dae51546e67d4cc69f8b70f5221e53/assets/banner.svg" width="820" alt="Banner do filefinch: o passarinho Finn levando arquivos direto entre dois aparelhos">
  </picture>
</p>

<h1 align="center">filefinch</h1>

<p align="center">
  <a href="https://kwy404.github.io/filefinch/app/"><strong>Abrir o app</strong></a> &middot;
  <a href="https://kwy404.github.io/filefinch/">Site</a> &middot;
  <a href="https://kwy404.github.io/filefinch/pt/guias/">Guias</a> &middot;
  <a href="https://github.com/kwy404/filefinch/blob/main/SECURITY.md">Segurança</a> &middot;
  <a href="https://github.com/kwy404/filefinch/blob/main/README.md">English</a>
</p>

O filefinch envia arquivos, pastas e textos curtos entre os seus aparelhos, direto de um navegador para o outro. Abra nos dois aparelhos, pareie com 6 palavras ou um QR code e solte os arquivos. Sem conta, sem upload e sem nenhum servidor nosso no meio.

## Começo rápido

1. Abra [o app](https://kwy404.github.io/filefinch/app/) no primeiro aparelho e toque em **Mostrar código de pareamento**, ou simplesmente solte os arquivos que quer enviar: o código aparece na hora.
2. No segundo aparelho, digite as 6 palavras (as 4 primeiras letras de cada uma bastam) ou escaneie o QR code.
3. Uma tela mostra 6 palavras de confirmação. Digite-as no outro aparelho. Quando conferirem, os arquivos seguem.

Aparelhos já pareados ficam guardados: da próxima vez você escolhe o aparelho e digita só as palavras de confirmação.

## Recursos

- **Pareamento com 6 palavras ou QR code.** O código vale uma vez e expira em 10 minutos.
- **Palavras de confirmação.** Quem só viu o seu código não consegue acertá-las, então nenhum arquivo vai para um estranho.
- **Aparelhos conhecidos.** Reconecte a um aparelho já pareado sem novas palavras. Esqueça-o quando quiser.
- **Textos e links.** Mande uma anotação ou um link entre os seus aparelhos, como uma área de transferência compartilhada.
- **Qualquer tamanho e pastas inteiras.** Os arquivos vão em pedaços de 64 KiB direto para o disco, as pastas mantêm a estrutura e cada arquivo é conferido com SHA-256.
- **Retomada.** Se a conexão cair, a transferência continua do último pedaço confirmado.
- **Sincronizar pastas.** Nos dois sentidos, só enviar ou só receber, com um plano de mudanças que você aprova antes.
- **Prévias e biblioteca local.** Veja fotos, vídeos, áudio, PDF e texto antes de salvar.
- **Senha opcional.** Uma segunda camada AES-GCM além da criptografia do navegador.
- **Instalável e offline.** Depois de carregado, o link de convite funciona numa rede local sem internet.

## Como funciona

Dois navegadores precisam trocar uma pequena oferta e resposta WebRTC antes de conversar direto.

- **6 palavras (padrão).** Os dois aparelhos transformam as palavras num tópico e numa chave, se encontram em alguns relays MQTT públicos e trocam a oferta e a resposta seladas com essa chave. Os relays só veem nomes aleatórios e texto cifrado, e os aparelhos saem deles assim que se conectam.
- **Link de convite (zero terceiros).** O link ou o QR code leva a oferta inteira, e o outro aparelho responde com um código curto. Nenhum relay é usado.

Depois disso, os arquivos vão de aparelho para aparelho por um canal de dados WebRTC criptografado com DTLS. Para achar um caminho, os navegadores perguntam o próprio endereço público a um servidor STUN público. Se as duas redes bloquearem rotas diretas, dá para adicionar o seu próprio relay TURN nas Configurações; ele só repassa pacotes criptografados.

## Limites

- Os dois aparelhos precisam estar online com o filefinch aberto durante o envio.
- Redes muito restritas podem bloquear a rota direta. O filefinch avisa e oferece a configuração de TURN.
- A velocidade segue a mais lenta das duas conexões.
- Celulares podem pausar abas em segundo plano; deixe a tela ligada em envios longos.

Veja o [SECURITY.md](https://github.com/kwy404/filefinch/blob/main/SECURITY.md) para o modelo de ameaças e como relatar um problema.

## Guias

- [Enviar arquivos do celular para o computador](https://kwy404.github.io/filefinch/pt/guias/transferir-arquivos-do-celular-para-o-pc-sem-cabo/)
- [Enviar arquivos grandes direto entre aparelhos](https://kwy404.github.io/filefinch/pt/guias/enviar-arquivos-grandes-sem-limite/)

## Rodar localmente

O filefinch é feito de arquivos estáticos. Com Node 18 ou mais novo:

```bash
git clone https://github.com/kwy404/filefinch.git
cd filefinch
npm ci
npm run build:app     # copia src/ para docs/app/lib/
npm run build:site    # gera o site em docs/
npm run serve         # serve docs/ localmente
npm test              # testes unitários e do site
```

## Autor e licença

Feito por **Alexandre Kohler** ([GitHub](https://github.com/kwy404) e [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)). Licença [MIT](https://github.com/kwy404/filefinch/blob/main/LICENSE).
