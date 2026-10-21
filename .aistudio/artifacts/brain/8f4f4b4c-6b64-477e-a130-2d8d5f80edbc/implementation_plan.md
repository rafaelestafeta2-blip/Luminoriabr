# Luminoria Pro — Rede Social de Filmes, Autenticação com @ID Único, Streams Premium e Sala de Cinema Sincronizada

Este plano estrutura a evolução do aplicativo para uma rede social cinematográfica 100% autêntica, exigindo cadastro/login antes do acesso ao catálogo, identificando cada membro por um `@username` único estilo Instagram, eliminando qualquer resquício de dados fictícios ou vídeos demo curtos e garantindo sincronização fiel de perfil, amigos, favoritos, linha do tempo (mínimo de 20% assistido) e salas de cinema.

### User Review & Critical Decisions

> [!IMPORTANT]
> As decisões abaixo foram confirmadas e orientam toda a arquitetura desta atualização:

- **Decisão Confirmada 1 — Identificador Único (`@username` estilo Instagram)**: Cada usuário escolhe e registra seu `@username` único no momento do cadastro (validado e normalizado no formato `@seu_id`), permitindo busca exata e em tempo real de usuários reais na plataforma.
- **Decisão Confirmada 2 — Fluxo de Amizades com Solicitação (Aceitar / Recusar)**: Adicionar um usuário pelo `@username` envia uma solicitação de amizade pendente. O destinatário visualiza o pedido recebido e pode **Aceitar** ou **Recusar**, sem nenhum contato pré-populado ou fictício.
- **Decisão Confirmada 3 — Player Premium sem Demos Curtos de 1 Minuto**: Remoção completa dos vídeos curtos de demonstração (como animações de 1 minuto). O player prioriza o stream real da lista M3U/Xtream via proxy seguro e, caso um título do catálogo seja apenas de metadados ou esteja sem sinal na fonte externa, carrega automaticamente o **Trailer Oficial HD do TMDB** ou stream HLS real verificado.
- **Decisão Confirmada 4 — Sala de Cinema por Código de 6 Dígitos**: As sessões para assistir juntos funcionam exclusivamente através do compartilhamento e digitação do código de 6 caracteres da sala (ex: `VIP4K1`), sincronizando reprodução, pausa, tempo do vídeo, participantes reais da sessão e chat ao vivo.

---

### 1. Overview & Core Concept

- **O Que Faz**: Uma plataforma de streaming e rede social de cinema onde usuários autenticados possuem identidade única (`@username`), constroem sua rede de amigos reais mediante aprovação de convites, colecionam favoritos legítimos, registram automaticamente na linha do tempo apenas as obras em que assistiram ao menos 20% da duração total e assistem juntos em Salas de Cinema sincronizadas por código de 6 dígitos.
- **Público-Alvo / Persona**: Cinéfilos e grupos de amigos que desejam assistir a filmes, séries e canais ao vivo em alta definição enquanto interagem socialmente com perfis reais, patentes de progresso autênticas e salas compartilhadas.
- **Valor Principal**: Integridade total dos dados do usuário (zero amigos falsos, zero estatísticas infladas, foto de perfil e atributos persistidos com segurança entre sessões e dispositivos) combinada com reprodução de mídia confiável.

---

### 2. User Experience & Visual Design

- **Fluxos Principais do Usuário**:
  1. **Portão de Autenticação Obrigatório**: Ao abrir o aplicativo sem sessão ativa, o usuário é recebido na tela exclusiva de Entrada e Cadastro. No cadastro, escolhe seu `@username` único (com verificação instantânea de disponibilidade), define nome, cidade, país, gêneros favoritos e foto de perfil.
  2. **Persistência Blindada do Perfil e Foto**: Ao salvar ou atualizar a foto de perfil, bio, estado civil, cidade ou tema, os dados são gravados de forma sincronizada na sessão ativa, no cofre local do usuário e no banco em nuvem, impedindo que a assinatura em tempo real sobrescreva ou apague a foto de perfil.
  3. **Rede Social de Amigos (`@username`)**: Na gaveta de amigos, a lista inicia 100% limpa (qualquer cache antigo de contatos de demonstração é purgado automaticamente). O usuário pesquisa pelo `@username` exato ou parcial, envia uma solicitação de amizade e acompanha as abas **Amigos**, **Solicitações Recebidas** (Aceitar/Recusar) e **Enviadas**.
  4. **Linha do Tempo por Progresso Real ($\ge 20\%$ Assistido)**: Favoritar um filme ou apenas abrir o player por alguns segundos não adiciona mais o título à Linha do Tempo. O player monitora `tempoAtual / duracaoTotal` e só registra o filme como assistido na Linha do Tempo (e contabiliza nas estatísticas do perfil) quando o usuário atinge pelo menos **20% de reprodução**.
  5. **Página Meus Favoritos Exclusiva**: Exibe unicamente os filmes, séries e canais marcados com coração pelo próprio usuário autenticado, apresentando um estado vazio claro quando nenhum item foi favoritado ainda.
  6. **Sala de Cinema por Código de 6 Dígitos**: O host cria ou abre uma sala com código de 6 caracteres e compartilha o código com amigos. Qualquer usuário que digitar o mesmo código de 6 dígitos entra na mesma sessão sincronizada, visualizando o player sincronizado, a lista real de participantes presentes e o chat em tempo real (sem botões de simulação artificial).

- **Identidade Visual & Tema**:
  - *Direção Estética*: Atmosfera de sala de projeção escura de alto contraste (*Dark Cinema Studio*), com superfícies estruturais discretas e foco nos pôsteres e no vídeo.
  - *Paleta de Cores (60-30-10)*:
    - **60% Canvas Dominante**: Preto profundo de cinema (`#09090D`) e ardósia escura (`#0F111A`).
    - **30% Superfícies Estruturais**: Painéis em `#141724` com bordas finas translúcidas (`rgba(255,255,255,0.08)`) e texto secundário em `#A0A0B0`.
    - **10% Acento Temático Dinâmico**: Variáveis CSS globais (`--theme-primary`, `--theme-secondary`, `--theme-glow`) reativas à escolha de tema do usuário no perfil (Lotus Pink, Ocean Cyan, Emerald Studio, Royal Gold, Sunset Ember).
  - *Tipografia & Hierarquia*: Títulos expressivos em `Outfit` / `Plus Jakarta Sans`, leitura fluida em corpo de texto e numerais tabulares (`tabular-nums` / `JetBrains Mono`) para contadores de progresso, porcentagens assistidas, códigos de sala e horários.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Regra dos 20% para Linha do Tempo e Contagem de Filmes Vistos**
  - *Abordagem Escolhida*: Rastrear continuamente a razão `currentTime / duration` no reprodutor de vídeo (tanto para streams diretos quanto para trailers/players embarcados) e disparar o registro na Linha do Tempo somente ao cruzar o limiar de `0.20` (20%) pela primeira vez naquela obra.
  - *Por Quê*: Garante que cliques acidentais, testes rápidos de canal ou o simples ato de favoritar um título não poluam o histórico de filmes assistidos do usuário.

- **Decisão 2: Eliminação dos Demos de 1 Minuto e Priorização M3U + Trailer Oficial TMDB**
  - *Abordagem Escolhida*: Remover completamente a lista de vídeos curtos de teste (`Big Buck Bunny`, `Sintel`, `flower.mp4`) do resolvedor de streams. Para filmes e séries, o player tenta reproduzir o stream M3U/Xtream real via proxy; se o item não possuir stream direto ou o servidor externo recusar a conexão, o player busca e reproduz automaticamente o **Trailer Oficial do TMDB** em alta definição. Para canais ao vivo, utiliza o stream HLS/MPEG-TS real da lista com reconexão inteligente no proxy.
  - *Por Quê*: Entrega uma experiência cinematográfica autêntica e evita que o usuário se depare com desenhos animados genéricos de 1 minuto.

- **Decisão 3: Purga Automática de Dados Legados Fictícios + Sistema de Solicitações `@username`**
  - *Abordagem Escolhida*: Implementar uma rotina de higienização na inicialização que remove do armazenamento do navegador quaisquer IDs de amigos ou favoritos de sementes antigas (`fr-1` a `fr-11`, `vod-1` a `vod-3`), substituindo-os por coleções vinculadas ao `userId` autenticado e ao diretório real de `@usernames`.
  - *Por Quê*: Mesmo após limpar o código-fonte, navegadores que já haviam aberto versões anteriores mantinham os 11 amigos salvos no `localStorage`. A migração limpa garante zero dados falsos imediatamente.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

#### Diagrama de Arquitetura e Fluxo de Dados

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        PORTÃO DE AUTENTICAÇÃO (@handle)                      │
│   [Cadastro / Login] ──► Valida @username único ──► Inicializa Perfil Real   │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ Sessão Autenticada (userId + @handle)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     CAMADA DE ESTADO & SINCRONIZAÇÃO REAL                    │
│  ┌─────────────────────────┐  ┌────────────────────────┐  ┌───────────────┐  │
│  │ Perfil & Avatar Vault   │  │ Diretório Social (@id) │  │ Sala Cinema   │  │
│  │ - Foto Base64/URL salva │  │ - Busca por @username  │  │ - Código 6ch  │  │
│  │ - Progresso & Tema CSS  │  │ - Pedidos: Pendente /  │  │ - Sync Player │  │
│  │ - Favoritos por userId  │  │   Aceito / Recusado    │  │ - Chat Real   │  │
│  └───────────┬─────────────┘  └───────────┬────────────┘  └───────┬───────┘  │
└──────────────┼────────────────────────────┼───────────────────────┼──────────┘
               │                            │                       │
               ▼                            ▼                       ▼
┌────────────────────────────┐ ┌─────────────────────────┐ ┌───────────────────┐
│   REPRODUTOR PREMIUM 4K    │ │   GAVETA SOCIAL AMIGOS  │ │  FAVORITOS &      │
│ - Stream M3U/Xtream Proxy  │ │ - Aba Amigos Ativos     │ │  LINHA DO TEMPO   │
│ - Fallback Trailer TMDB HD │ │ - Aba Pedidos Recebidos │ │ - Filtro 100%     │
│ - Medidor >= 20% Duração   │ │ - Aba Busca @username   │ │   Salvos pelo User│
│   ──► Grava Linha do Tempo │ │ - Chat Direto Real      │ │ - Histórico >=20% │
└────────────────────────────┘ └─────────────────────────┘ └───────────────────┘
```

#### Modelo de Dados e Mapeamento de Estado Interativo

1. **Identidade e Perfil Persistente (`UserProfileState`)**:
   - Adição do campo `handle` (ex: `@rafael_cine`) único por conta.
   - Sincronização completa de `avatarUrl`, `handle`, `city`, `bio`, `countryCode`, `maritalStatus`, `favoriteGenres` e `equippedThemeId` tanto no cofre local indexado por `userId` quanto no documento `/users/{userId}`, preservando `avatarUrl` durante atualizações de `onSnapshot`.
2. **Grafo Social e Solicitações de Amizade (`FriendRequest` & `FriendContact`)**:
   - Busca de usuários registrados pelo `@handle` ou nome.
   - Estados de relacionamento: `pending_sent` (enviado por mim), `pending_received` (aguardando minha aprovação com botões **Aceitar** e **Recusar**) e `accepted` (amigo confirmado com acesso ao chat direto).
3. **Motor de Progresso de Reprodução ($\ge 20\%$)**:
   - No `VideoPlayerModal` e no `NativeVideoPlayer`, o callback de progresso recebe `(currentTimeSec, durationSec)`.
   - Quando `durationSec > 0` e `(currentTimeSec / durationSec) >= 0.20`, o sistema marca o título como assistido na sessão, incrementa `watchedCount` e insere o registro real na Linha do Tempo com a porcentagem assistida.
4. **Sala de Cinema Sincronizada por Código de 6 Caracteres**:
   - Estado da sala indexado pelo código de 6 caracteres no banco/storage compartilhado (`cinema_room_{CODE}`), sincronizando `vodId`, `isPlaying`, `currentTimeSec`, lista de participantes autenticados e mensagens do chat em tempo real entre abas e usuários que ingressarem com o mesmo código.
