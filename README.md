<img width="1536" height="1024" alt="Hubify" src="https://github.com/user-attachments/assets/0de53a81-747b-44de-acc9-ba69011ac2bd" />

<h1 align="center">
  <img src="https://img.shields.io/badge/Hubify-Real--Time%20Messaging-6C63FF?style=for-the-badge&logo=rocketchat&logoColor=white" alt="Hubify"/>
</h1>

<p align="center">
  <strong>Plataforma de comunicação em tempo real com organização por Streams e Tópicos</strong><br/>
  Organizada por <em>Streams</em> e <em>Tópicos</em>, com mensagens via WebSocket.
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

- 🔐 **Autenticação segura** com JWT (registro e login de usuários)
- 💬 **Mensagens em tempo real** via WebSocket (protocolo STOMP sobre SockJS)
- 📂 **Streams e Tópicos** para organização de conversas
- 👤 **Gerenciamento de sessão** com contexto de autenticação no frontend
- 🛡️ **Spring Security** configurado para proteção das rotas da API
- 🗄️ **Persistência** de mensagens, usuários, streams e tópicos no PostgreSQL

---

## 🏗️ Arquitetura

```
hubify/
├── backend/          # API REST + WebSocket (Java Spring Boot)
│   └── src/main/java/com/hubify/backend/
│       ├── config/         # Configurações de segurança e WebSocket
│       ├── controllers/    # AuthController, MessageController, StreamController, TopicController
│       ├── models/         # Entidades JPA: User, Message, Stream, Topic
│       ├── payload/        # DTOs de request/response
│       ├── repositories/   # Interfaces Spring Data JPA
│       ├── security/       # JWT filter, UserDetailsService
│       └── services/       # Lógica de negócio
├── frontend/         # SPA React com Vite
│   └── src/
│       ├── pages/          # Login, Register, ChatInterface
│       ├── features/chat/  # Sidebar, MessageList, MessageInput
│       ├── contexts/       # AuthContext (gerenciamento de sessão)
│       └── services/       # Cliente HTTP Axios configurado
└── docker-compose.yml  # Banco de dados PostgreSQL em container
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
| `POST` | `/api/auth/register` | Cadastrar novo usuário | ❌ |
| `POST` | `/api/auth/login` | Autenticar e obter JWT | ❌ |
| `GET` | `/api/streams` | Listar todos os streams | ✅ |
| `GET` | `/api/topics?streamId={id}` | Listar tópicos de um stream | ✅ |
| `GET` | `/api/messages?streamId={id}&topicId={id}` | Listar mensagens | ✅ |
| `POST` | `/api/messages` | Enviar nova mensagem | ✅ |
| `WS` | `/ws` | Endpoint WebSocket (STOMP) | ✅ |

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
