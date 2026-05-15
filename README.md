<div align="center">

<img src="frontend/public/image/logo.png" alt="Hubify Logo" width="180"/>

# Hubify Workspace
### Plataforma Corporativa de Comunicação em Tempo Real

[![Version](https://img.shields.io/badge/version-5.0.0-6366f1?style=for-the-badge&logo=github)](https://github.com/andreygiordane/hubify)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Java](https://img.shields.io/badge/Java-Spring%20Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socketdotio)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P-333333?style=for-the-badge&logo=webrtc)](https://webrtc.org/)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](LICENSE)

---

**Chat · Videoconferência HD · Compartilhamento de Tela · Chamadas de Áudio · Reuniões Agendadas**

*Plataforma full-stack empresarial com suporte a execução 100% local via Docker Compose*

</div>

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Novidades da v5.0](#-novidades-da-v50)
- [Arquitetura](#arquitetura)
- [Stack Tecnológica](#stack-tecnológica)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Execução Local (Docker Compose)](#instalação-e-execução-local-docker-compose)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API Reference](#api-reference)
- [Eventos Socket.IO](#eventos-socketio)
- [Funcionalidades Detalhadas](#funcionalidades-detalhadas)
- [Deploy em Cloud (GCP)](#deploy-em-cloud-gcp)
- [Histórico de Versões](#histórico-de-versões)
- [Contribuição](#contribuição)

---

## Visão Geral

O **Hubify Workspace** é uma plataforma de comunicação corporativa completa e auto-hospedável, projetada para equipes que precisam de chat em tempo real, videoconferências HD, e gerenciamento de reuniões em um único ambiente.

A partir da **v5.0**, o projeto é **100% executável localmente** via Docker Compose — sem dependência de nenhum serviço externo pago. Toda a infraestrutura (banco de dados, backend, servidor de sinalização e frontend) sobe com um único comando.

### ✨ Principais Recursos

| Recurso | Descrição |
|---|---|
| 💬 **Chat em Tempo Real** | Mensagens instantâneas via Socket.IO com suporte a DMs e grupos |
| 📹 **Videoconferência HD** | WebRTC P2P com câmera, microfone e compartilhamento de tela |
| 📞 **Chamadas de Áudio** | Interface dedicada para chamadas de voz only |
| 🖥️ **Screen Share** | Compartilhamento de tela com layout responsivo Desktop e Mobile |
| 📅 **Calendário de Reuniões** | Agendamento, notificações de lembrete (10min, 5min, horário) |
| 👥 **Grupos** | Criação e gerenciamento de canais de grupo com avatar |
| 📁 **Compartilhamento de Arquivos** | Upload e preview de arquivos em conversas |
| 😀 **Emoji Picker** | Seleção de emojis com múltipla inserção sem fechar o seletor |
| 🔔 **Notificações** | Som e badge de notificação para novas mensagens e chamadas |
| 🌐 **Responsivo** | Interfaces separadas e otimizadas para Desktop e Mobile |
| 🔒 **Autenticação Segura** | Login/registro com validação de senha forte e troca obrigatória |
| 👤 **Perfis de Usuário** | Avatar gerado automaticamente, status de presença, bio |

---

## 🚀 Novidades da v5.0

A versão 5.0 representa uma **reestruturação completa** focada em estabilidade, qualidade de chamada e portabilidade de infraestrutura.

### 🔄 Infraestrutura — 100% Local com Docker Compose

> **Antes (v4.x):** O projeto dependia de serviços externos (Cloud Run GCP, banco de dados remoto) para funcionar. Impossível rodar offline.

> **Agora (v5.0):** Tudo sobe localmente com `docker compose up --build`. Zero dependências externas.

**Mudanças técnicas:**
- `docker-compose.yml` — Backend agora usa `db:5432` (service name interno) em vez de IP externo
- `frontend/Dockerfile` — Defaults de build apontam para `localhost` em vez de URLs Cloud Run
- `frontend/.env.production` — Variáveis de ambiente corrigidas para ambiente local
- Todos os fallbacks hardcoded no código-fonte (`api-client.js`, `Auth.jsx`, `AuthContext.jsx`, `ChatContext.jsx`) atualizados para `localhost`
- Senha do banco de dados padronizada para `postgres` (sem credential externa exposta)

### 📹 Estabilização da Videoconferência

- **Fix: Flickering no compartilhamento de tela (lado do emissor)** — Referências de stream isoladas em componentes `DesktopVideoTile` e `MobileVideoTile` customizados, eliminando re-renders desnecessários que causavam piscadas
- **Fix: Tela preta no mobile ao compartilhar tela** — Corrigido uso inválido de React Hooks dentro de callbacks condicionais em `MobileVideoCallInterface`
- **Fix: TypeError null no muted** — Adicionada verificação de existência do elemento DOM antes de setar a propriedade `muted` em `WebVideoCallInterface`
- **Melhoria: Pinch-to-zoom no mobile** — Habilitado gesto de zoom nativo no viewer de tela compartilhada mobile, removendo controles manuais de zoom da UI

### 🎨 UI/UX

- **Sidebar rebrandeada** — Logotipo em imagem (`logo.png`) substituiu o texto literal anterior
- **EmojiPicker corrigido** — `stopPropagation` adicionado para permitir múltiplas seleções sem fechar o picker
- **Interface mobile de vídeo** — Layout fullscreen para tela compartilhada com miniaturas flutuantes dos participantes
- **Tela de login** — Suporte a login via e-mail ou nome de usuário; validação de força de senha em tempo real

### 🔧 Backend

- `application.properties` — Datasource URL agora lida via variável de ambiente `${SPRING_DATASOURCE_URL}`
- `DocumentController`, `DocumentRepository`, `AuthService` — Refinamentos de persistência e tratamento de erros
- Suporte a colunas `TEXT` no PostgreSQL para payloads JSON grandes

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                         │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │   Frontend   │    │   Backend    │                   │
│  │  React + Vite│    │ Spring Boot  │                   │
│  │  Nginx:8080  │    │   :8081      │                   │
│  │  →host:5173  │    │  →host:8082  │                   │
│  └──────┬───────┘    └──────┬───────┘                   │
│         │ HTTP/WS           │ JDBC                      │
│         │            ┌──────▼───────┐                   │
│  ┌──────▼───────┐    │  PostgreSQL  │                   │
│  │ Video Server │    │  db:5432     │                   │
│  │  Node+SIO    │    │ →host:5435   │                   │
│  │  :8080       │    └──────────────┘                   │
│  │ →host:8080   │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘

WebRTC P2P (entre browsers, sem passar pelo servidor)
Browser A ◄────────────────────────────────► Browser B
         (ICE/STUN negotiation via video-server)
```

### Fluxo de Comunicação

```
Browser
  │
  ├── HTTP REST → backend:8082/api     (auth, CRUD dados)
  ├── Socket.IO → video-server:8080    (chat, presença, sinalização WebRTC)
  └── WebRTC P2P ──────────────────── (streams de áudio/vídeo/tela)
```

---

## Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18 | Framework UI |
| Vite | 5 | Build tool |
| Socket.IO Client | 4.x | Comunicação em tempo real |
| simple-peer | latest | WebRTC abstraction |
| Lucide React | latest | Ícones |
| Tailwind CSS | 3 | Estilização |
| Nginx | stable-alpine | Serving em produção |

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Java | 21+ | Linguagem |
| Spring Boot | 3.x | Framework REST |
| Spring Data JPA | 3.x | ORM |
| PostgreSQL Driver | latest | Conexão com banco |
| Maven | 3.9 | Build |

### Servidor de Vídeo / Sinalização
| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 18 | Runtime |
| Socket.IO Server | 4.x | WebSocket / signaling |
| Express | 4.x | HTTP server base |

### Infraestrutura
| Tecnologia | Uso |
|---|---|
| Docker | Containerização |
| Docker Compose | Orquestração local |
| PostgreSQL 15 Alpine | Banco de dados |
| Google Cloud Run | Deploy cloud (opcional) |

---

## Pré-requisitos

- **Docker Desktop** ≥ 4.x (Windows/Mac/Linux)
- **Git**
- Porta `5173`, `8080`, `8082`, `5435` livres no host

> **Não é necessário** ter Java, Node.js, Maven ou PostgreSQL instalados localmente. O Docker cuida de tudo.

---

## Instalação e Execução Local (Docker Compose)

### 1. Clone o repositório

```bash
git clone git@github.com:andreygiordane/hubify.git
cd hubify
```

### 2. Suba todos os serviços

```bash
docker compose up --build
```

> Na primeira execução, o Docker irá baixar as imagens base e compilar todos os serviços. Isso pode levar alguns minutos.

### 3. Acesse a aplicação

| Serviço | URL |
|---|---|
| **Frontend (App)** | http://localhost:5173 |
| **Backend API** | http://localhost:8082/api |
| **Video / Socket Server** | http://localhost:8080 |
| **PostgreSQL** | `localhost:5435` (user: `postgres`, pass: `postgres`, db: `hubify`) |

### 4. Parar os serviços

```bash
docker compose down
```

Para apagar também o volume do banco de dados:

```bash
docker compose down -v
```

### Execução em background

```bash
docker compose up --build -d
```

Para ver os logs:
```bash
docker compose logs -f
```

---

## Variáveis de Ambiente

### Frontend (Build Args)

| Variável | Padrão (local) | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8082/api` | URL base do backend REST |
| `VITE_SOCKET_URL` | `http://localhost:8080` | URL do servidor de sinalização Socket.IO |

> Configuradas via `args` no `docker-compose.yml`. Para sobrescrever, edite o `docker-compose.yml` ou use um arquivo `.env` na raiz.

### Backend

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `8081` | Porta interna do servidor Spring Boot |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db:5432/hubify` | JDBC URL do banco de dados |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | `postgres` | Senha do banco |

---

## Estrutura do Projeto

```
hubify/
├── docker-compose.yml              # Orquestração de todos os serviços
├── README.md
│
├── backend/                        # API REST — Spring Boot
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/hubify/
│       ├── application/service/    # Regras de negócio (AuthService, etc.)
│       ├── domain/model/           # Entidades JPA
│       ├── infrastructure/
│       │   └── persistence/        # Repositórios JPA
│       ├── interfaces/rest/        # Controllers REST
│       └── resources/
│           └── application.properties
│
├── video-server/                   # Servidor WebRTC / Socket.IO
│   ├── Dockerfile
│   ├── package.json
│   └── server.js                   # Signaling, chat, presença
│
└── frontend/                       # SPA React
    ├── Dockerfile
    ├── nginx.conf
    ├── .env.local                  # Dev local (npm run dev)
    ├── .env.production             # Produção (Docker build)
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── Auth.jsx                # Tela de login/registro
        ├── api-client.js           # Camada de comunicação REST
        ├── context/
        │   ├── AuthContext.jsx     # Estado de autenticação global
        │   └── ChatContext.jsx     # Estado de chat, socket, chamadas
        ├── components/
        │   ├── layout/
        │   │   └── Sidebar.jsx     # Navegação lateral
        │   ├── modals/
        │   │   └── Modals.jsx      # Todos os modais da aplicação
        │   └── video/
        │       ├── MeetingInterface.jsx        # Orquestrador de chamadas
        │       ├── logic/useCallLogic.js       # Hook de lógica WebRTC
        │       ├── shared/CallComponents.jsx   # Componentes compartilhados
        │       ├── audio/AudioCallInterface.jsx
        │       └── video/
        │           ├── WebVideoCallInterface.jsx   # UI vídeo Desktop
        │           └── MobileVideoCallInterface.jsx # UI vídeo Mobile
        └── pages/
            ├── Chat.jsx
            ├── Calendar.jsx
            ├── Contacts.jsx
            └── SettingsProfile.jsx
```

---

## API Reference

Base URL: `http://localhost:8082/api`

### Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/auth/register` | Cadastro de novo usuário |
| `POST` | `/auth/login` | Login (email ou username + senha) |
| `GET` | `/auth/users` | Lista todos os usuários |
| `PUT` | `/auth/users/{id}` | Atualiza dados de um usuário |

### Dados (Coleções genéricas)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/data/{collection}` | Lista documentos de uma coleção |
| `POST` | `/data/{collection}` | Cria ou atualiza um documento |
| `DELETE` | `/data/{collection}/{id}` | Remove um documento |

**Coleções disponíveis:** `messages`, `groups`, `meetings`, `calls`, `invites`

### Exemplos

```bash
# Login
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Senha@123"}'

# Listar mensagens
curl http://localhost:8082/api/data/messages

# Enviar mensagem
curl -X POST http://localhost:8082/api/data/messages \
  -H "Content-Type: application/json" \
  -d '{"id":"msg_123","roomId":"dm_abc_def","senderId":"abc","text":"Olá!"}'
```

---

## Eventos Socket.IO

Servidor: `http://localhost:8080`

### Emitir (Client → Server)

| Evento | Payload | Descrição |
|---|---|---|
| `join-room` | `{roomId, uid, name, avatarUrl}` | Entrar em uma sala de chat/chamada |
| `message-created` | `MessageObject` | Propagar nova mensagem |
| `message-deleted` | `{messageId, roomId}` | Propagar deleção |
| `conversation-deleted` | `{roomId}` | Propagar deleção de conversa |
| `user-typing` | `{userId, userName, roomId}` | Indicador de digitação |
| `user-stop-typing` | `{userId, roomId}` | Parar indicador de digitação |
| `messages-read` | `{roomId, userId, timestamp}` | Marcar mensagens como lidas |
| `profile-update` | `{userId, data}` | Atualizar perfil em tempo real |
| `calling-user` | `{userToCall, signalData, from, name}` | Iniciar chamada WebRTC |
| `answer-call` | `{signal, to}` | Responder chamada WebRTC |
| `ice-candidate` | `{candidate, to}` | Trocar candidatos ICE |

### Receber (Server → Client)

| Evento | Payload | Descrição |
|---|---|---|
| `all-users` | `[{id, name}]` | Lista de usuários na sala |
| `user-joined` | `{userId, name}` | Novo usuário entrou |
| `user-left` | `{userId}` | Usuário saiu |
| `call-made` | `{signal, from, name}` | Chamada recebida |
| `call-accepted` | `{signal, from}` | Chamada aceita |
| `ice-candidate` | `{candidate, from}` | Candidato ICE recebido |
| `message-created` | `MessageObject` | Nova mensagem broadcast |
| `user-read-messages` | `{userId, roomId, timestamp}` | Confirmação de leitura |
| `user-typing` | `{userId, userName}` | Outro usuário digitando |

---

## Funcionalidades Detalhadas

### Chat

- **Mensagens em tempo real** via Socket.IO + polling de backup (2s interval)
- **Atualização otimista** — mensagem aparece imediatamente na UI antes da confirmação do servidor
- **Mensagens deletadas** exibem marcador `🚫 Mensagem apagada`
- **Responder mensagem** (reply thread) com referência visual
- **Encaminhar mensagem** para múltiplas conversas
- **Indicador de digitação** com nome do usuário
- **Indicador de leitura** com timestamp sincronizado via socket
- **Badge de não lido** em conversas com mensagens novas
- **Mute de conversa** — silencia notificações sonoras por sala

### Videoconferência (WebRTC)

- **Peer-to-peer** direto entre browsers (STUN servers públicos)
- **Câmera + microfone** com controle de mute/câmera no toolbar
- **Compartilhamento de tela** — layout dedicado com miniatura da câmera sobreposta
- **Desktop:** grid de participantes + layout fullscreen para screen share
- **Mobile:** viewer fullscreen com pinch-to-zoom para tela compartilhada
- **Chamada de áudio only** com interface separada
- **Chamada em grupo** — convite automático a todos os membros

### Presença e Status

| Status | Cor | Descrição |
|---|---|---|
| 🟢 Online | Verde | Ativo na plataforma |
| 🟡 Ausente | Amarelo | Away |
| 🔵 Em Reunião | Azul | Em chamada ativa |
| 🔴 Ocupado | Vermelho | Não perturbe |
| ⚫ Offline | Cinza | Desconectado |

Status é atualizado automaticamente ao entrar/sair de chamadas e ao fechar o navegador.

### Reuniões Agendadas

- Criação com título, data/hora e lista de participantes
- Notificações automáticas: **10 minutos antes**, **5 minutos antes**, **no horário**
- Notificação quando **o anfitrião entrar na sala**
- Integração com Calendário visual mensal

---

## Deploy em Cloud (GCP Cloud Run)

Para fazer deploy na nuvem, use o script `hubify-deploy.ps1` ou configure manualmente as variáveis de ambiente no Cloud Run:

```bash
# Frontend — substituir URLs no build
VITE_API_URL=https://seu-backend.run.app/api
VITE_SOCKET_URL=https://seu-video-server.run.app

# Backend — configurar datasource
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<db>
SPRING_DATASOURCE_USERNAME=<user>
SPRING_DATASOURCE_PASSWORD=<password>
```

> Consulte [`DEPLOY_GCP.md`](DEPLOY_GCP.md) para o guia completo de deploy no Google Cloud Platform.

---

## Histórico de Versões

| Versão | Data | Destaques |
|---|---|---|
| **5.0.0** | Mai/2026 | Docker Compose 100% local, fix flickering screen share, fix mobile black screen, pinch-to-zoom mobile, sidebar rebrandeada, EmojiPicker múltipla seleção |
| 4.5.0 | Mai/2026 | Documentação técnica completa, API docs, Socket.IO events guide |
| 4.0.0 | Mai/2026 | Sincronização lógica moderna + sistema de vídeo monolítico estável, colunas TEXT no PostgreSQL |
| 3.x | Abr/2026 | Deploy GCP Cloud Run, CI/CD, otimização de startup |
| 2.x | Mar/2026 | WebRTC P2P, Screen Share, Audio Calls |
| 1.x | Fev/2026 | Chat em tempo real, grupos, calendário |

---

## Contribuição

1. **Fork** o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona minha feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um **Pull Request**

### Padrão de commits

```
feat: nova funcionalidade
fix: correção de bug
docs: alterações na documentação
refactor: refatoração sem mudança de comportamento
chore: tarefas de manutenção (deps, config, etc.)
```

---

## Autor

**Andrey Giordane**
- GitHub: [@andreygiordane](https://github.com/andreygiordane)
- Email: andreycostaa@gmail.com

---

<div align="center">

**Hubify Workspace v5.0** — Feito com ❤️ para comunicação corporativa de alta performance

*Self-hosted · Open Source · Docker Ready*

</div>
