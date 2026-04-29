<img width="1536" height="1024" alt="Hubify" src="https://github.com/user-attachments/assets/0de53a81-747b-44de-acc9-ba69011ac2bd" />

<h1 align="center">
  <img src="https://img.shields.io/badge/Hubify-Real--Time%20Messaging-6C63FF?style=for-the-badge&logo=rocketchat&logoColor=white" alt="Hubify"/>
</h1>

<p align="center">
  <strong>Plataforma de colaboração e comunicação em tempo real de alta fidelidade</strong><br/>
  Com chamadas de voz/vídeo, compartilhamento de arquivos, presença dinâmica e organização por Streams.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white"/>
  <img src="https://img.shields.io/badge/Spring%20Boot-4.0-6DB33F?style=flat-square&logo=spring&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/WebSocket-STOMP-FF6B35?style=flat-square"/>
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white"/>
</p>

---

## 📖 Sobre o Projeto

**Hubify** é uma aplicação de mensagens em tempo real com arquitetura full-stack moderna. A comunicação é estruturada em **Streams** (canais temáticos) e **Tópicos** (threads dentro de cada stream), permitindo conversas organizadas e contextualizadas de forma clara e eficiente.

### ✨ Funcionalidades

- 🔐 **Autenticação de Alta Fidelidade:** Telas de Login e Registro com design moderno e seguro (JWT).
- 💬 **Mensagens em Tempo Real:** Chat fluido via WebSocket com suporte a emojis e anexos.
- 📞 **Chamadas de Voz e Vídeo:** Sistema integrado de conferência em tempo real.
- 👥 **Streams e Grupos:** Organização por canais temáticos e conversas privadas.
- 📂 **Gestão de Documentos:** Envio de arquivos com miniatura e pré-visualização instantânea (PDFs, Imagens).
- 🟢 **Presença Dinâmica:** Status em tempo real (Online, Ocupado, Ausente, Offline) com cores dinâmicas.
- ✏️ **Edição e Exclusão:** Controle total sobre suas mensagens com histórico de edição.
- 🛡️ **Gerenciamento de Grupo:** Convites, remoção de membros e controle de proprietário.
- 🏢 **Interface Glassmorphism:** Design premium, moderno e responsivo com temas escuros.

---

## 🏗️ Arquitetura

```
hubify/
├── backend/          # API REST + WebSocket (Java Spring Boot)
│   └── src/main/java/com/hubify/backend/
│       ├── config/         # Segurança, WebSocket e Storage
│       ├── controllers/    # Auth, Message, Stream, Call, Upload, User
│       ├── models/         # Entidades: User, Message, Stream, Conversation, Invite
│       ├── payload/        # DTOs de request/response
│       ├── repositories/   # Spring Data JPA (PostgreSQL)
│       └── security/       # JWT e Proteção de Rotas
├── frontend/         # SPA React com Vite
│   └── src/
│       ├── pages/          # Login, Register, ChatInterface
│       ├── features/chat/  # Sidebar, MessageList, CallMenu, MeetingRoom, FilePreview
│       ├── contexts/       # AuthContext (sessão e estado global)
│       └── services/       # Integração com API (Axios)
└── docker-compose.yml  # PostgreSQL e ambiente de dados
```

---

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| **Java** | 21 | Linguagem principal |
| **Spring Boot** | 4.0 | Framework base da aplicação |
| **Spring Web MVC** | — | API RESTful |
| **Spring WebSocket** | — | Comunicação em tempo real (STOMP) |
| **Spring Security** | — | Autenticação e autorização |
| **Spring Data JPA** | — | Persistência de dados (ORM) |
| **Spring Validation** | — | Validação de dados de entrada |
| **PostgreSQL Driver** | — | Conexão com o banco de dados |
| **JJWT** | 0.11.5 | Geração e validação de tokens JWT |
| **Lombok** | — | Redução de boilerplate (getters, setters, etc.) |
| **Maven** | — | Gerenciamento de dependências e build |

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| **React** | 18 | Biblioteca de UI |
| **Vite** | 5 | Bundler e servidor de desenvolvimento |
| **React Router DOM** | 7 | Roteamento client-side |
| **Axios** | 1.x | Requisições HTTP para a API |
| **@stomp/stompjs** | 7 | Cliente WebSocket com protocolo STOMP |
| **SockJS Client** | 1.6 | Fallback para WebSocket em ambientes restritos |

### Infraestrutura
| Tecnologia | Versão | Uso |
|---|---|---|
| **Docker** | — | Containerização |
| **Docker Compose** | — | Orquestração do banco de dados |
| **PostgreSQL** | 15 | Banco de dados relacional |

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- [Java 21+](https://adoptium.net/)
- [Maven](https://maven.apache.org/) (ou use o `./mvnw` incluso)
- [Node.js 18+](https://nodejs.org/) e npm
- [Docker](https://www.docker.com/) e Docker Compose

### 1. Clone o repositório

```bash
git clone https://github.com/andreygiordane/hubify.git
cd hubify
```

### 2. Suba o banco de dados

```bash
docker compose up -d
```

> O PostgreSQL estará disponível em `localhost:5433`
> - **Database:** `hubify`
> - **Usuário:** `hubifyuser`
> - **Senha:** `hubifypassword`

### 3. Execute o Backend

```bash
cd backend
./mvnw spring-boot:run
```

> A API estará disponível em `http://localhost:8080`

### 4. Execute o Frontend

```bash
cd frontend
npm install
npm run dev
```

> O frontend estará disponível em `http://localhost:5173` (ou `5174`)

---

## 🔌 Endpoints da API

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | Login e geração de Token | ❌ |
| `POST` | `/api/auth/register` | Cadastro de novo usuário | ❌ |
| `GET` | `/api/users/profile` | Dados do perfil logado | ✅ |
| `GET` | `/api/streams` | Listar canais do usuário | ✅ |
| `POST` | `/api/messages` | Enviar mensagem / arquivo | ✅ |
| `GET` | `/api/conversations` | Listar chats privados | ✅ |
| `POST` | `/api/upload` | Upload de arquivos temporários | ✅ |
| `PUT` | `/api/users/status` | Atualizar status de presença | ✅ |
| `WS` | `/ws` | Conexão WebSocket (STOMP) | ✅ |

---

## 🗂️ Fluxo da Aplicação

```
Usuário → Login/Register
           ↓
        JWT Token
           ↓
    Sidebar: lista Streams
           ↓
    Seleciona Stream → lista Tópicos
           ↓
    Seleciona Tópico → carrega Mensagens (REST)
           ↓
    WebSocket conectado → recebe mensagens em tempo real
           ↓
    Envia mensagem → API REST → broadcast via WebSocket
```

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Desenvolvido com ❤️ usando Java Spring Boot + React
</p>
