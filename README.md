# Hubify - Plataforma Unificada de Comunicacao Corporativa v4.5.0

Hubify e uma solucao robusta e moderna para comunicacao empresarial em tempo real. A plataforma integra chats de alta performance, videoconferencias com baixa latencia e ferramentas de colaboracao em uma interface premium e responsiva. Este documento detalha a arquitetura, tecnologias e funcionalidades que compoem o ecossistema Hubify.

---

## 🛠️ Tecnologias Utilizadas

O Hubify utiliza uma stack de tecnologia de ponta para garantir escalabilidade e performance:

### Frontend
- **React.js (Vite)**: Biblioteca principal para construcao da interface.
- **Tailwind CSS**: Framework utilitario para design responsivo e customizacao visual.
- **Framer Motion**: Engine de animacoes para transicoes fluidas e feedback visual.
- **Lucide React**: Biblioteca de icones consistentes e modernos.
- **Socket.io-client**: Protocolo para comunicacao bidirecional em tempo real.
- **Simple-Peer**: Abstracao para implementacao simplificada de WebRTC (Peer-to-Peer).
- **Emoji Picker React**: Integracao de selecao de emojis para interacoes no chat.

### Backend
- **Java 17 / Spring Boot**: Core do sistema, gerenciando autenticacao, persistencia e logica de negocios.
- **Spring Security**: Camada de protecao para rotas e dados sensiveis.
- **Maven**: Gerenciamento de dependencias e automacao de build.
- **MySQL / PostgreSQL**: Bancos de dados relacionais para armazenamento de usuarios e documentos.

### Infraestrutura e Servidores
- **Node.js (Video Server)**: Servidor de sinalizacao dedicado para gerenciar handshakes WebRTC.
- **Docker & Docker Compose**: Containerizacao de todos os servicos para deploy consistente.
- **Google Cloud Platform (GCP)**: Infraestrutura de hospedagem (Cloud Run, Cloud SQL).

---

## 📂 Estrutura do Projeto

### 1. Backend (`/backend`)
O backend segue o padrao de arquitetura em camadas:
- **`com.hubify.interfaces.rest`**: Controladores que expoem os endpoints da API (ex: `DocumentController`, `AuthController`).
- **`com.hubify.application.service`**: Camada de servico contendo a logica de processamento (ex: `AuthService`).
- **`com.hubify.domain.model`**: Entidades e modelos de dados (ex: `User`, `Document`).
- **`com.hubify.infrastructure.persistence`**: Repositorios para interacao com o banco de dados.
- **`DatabaseMigrationRunner`**: Componente responsivo por garantir que a estrutura do banco esteja atualizada no startup.

### 2. Frontend (`/frontend`)
O frontend e organizado por responsabilidades claras:
- **`/src/components`**:
    - `chat/`: `ChatList`, `ChatMessages` e itens de interface de conversa.
    - `video/`: Componentes de chamada (`WebVideoCallInterface`, `MobileVideoCallInterface`).
    - `layout/`: `Sidebar`, `MainLayout` e navegacao.
    - `modals/`: Central de modais para criacao de grupos, DMs e configuracoes.
- **`/src/context`**:
    - `ChatContext.jsx`: O "cerebro" do frontend. Gerencia o estado global das mensagens, salas, wallpapers e exclusoes.
    - `AuthContext.jsx`: Gerencia a sessao do usuario e dados de perfil.
- **`/src/pages`**: Paginas principais (`Chat`, `Contacts`, `Meetings`, `Calendar`).

### 3. Video Server (`/video-server`)
Um servidor leve em Node.js focado em sinalizacao:
- **`server.js`**: Utiliza `Socket.io` para escutar eventos de `call-user`, `make-answer` e `ice-candidate`, servindo como a ponte inicial entre dois dispositivos antes da conexao P2P ser estabelecida.

---

## 🚀 Principais Funcoes e Logicas

### Sistema de Chat e Sincronizacao
- **Real-Time Hibrido**: O sistema combina `Socket.io` para eventos criticos (digitacao, notificacoes lidas) com um sistema de `Polling` otimizado em 350ms para garantir que as mensagens e salas estejam sempre sincronizadas com o banco de dados.
- **Exclusao Otimista**: Ao deletar uma sala ou mensagem, a interface remove o item instantaneamente. Internamente, o `ChatContext` utiliza um estado de `processingDeletions` para ignorar dados antigos que ainda possam estar no cache do servidor durante o processo de delecao.
- **Wallpapers Personalizados**: Sistema exclusivo que permite injetar padrões SVG sutis (Pontos, Linhas, Circuitos) no fundo dos chats, salvando a preferencia individual por sala no `LocalStorage`.

### Videoconferencia e WebRTC
- **Detecao de Dispositivo**: O sistema identifica automaticamente se o usuario esta em Web ou Mobile para carregar a interface mais adequada (`WebVideoCallInterface` vs `MobileVideoCallInterface`).
- **Handshake Robusto**: Gerenciamento de candidatos ICE e descricoes de sessao (SDP) para atravessar roteadores e firewalls complexos.
- **Persistence Layer**: A chamada permanece ativa mesmo que o usuario mude de aba ou visualize outros chats dentro da plataforma.

### Gestão de Grupos
- **Banner de Convites Clássico**: Implementacao de um sistema de notificacao na barra lateral que alerta o usuario sobre novos convites de grupo pendentes.
- **Privacidade de Membros**: Os grupos so aparecem na lista de conversas de um usuario apos a aceitacao formal do convite ou se ele for o criador.

---

## ⚙️ Como Executar

### Desenvolvimento Local
1. Certifique-se de ter o Docker instalado.
2. Execute o script de inicializacao:
```powershell
./hubify-local.ps1
```
Este script configurara o banco de dados, buildara as imagens e subira os containers para `localhost:5173`.

### Deploy
Para subir o ambiente para a nuvem (GCP), utilize:
```powershell
./hubify-deploy.ps1
```

---

## 📝 Historico Recente (v4.5.0)
- ✅ Adicao de backgrounds geometricos SVG.
- ✅ Otimizacao de exclusao de chats sem necessidade de refresh.
- ✅ Restauracao da interface de convites legada.
- ✅ Melhoria na estabilidade de conexao WebRTC para redes 4G/5G.

---
**Desenvolvido por Andrey Giordane**
*Hubify - Comunicacao Sem Fronteiras.*
