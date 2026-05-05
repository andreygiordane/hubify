# Hubify - Documentacao Tecnica de Engenharia v4.5.0

Hubify e uma plataforma enterprise-grade de comunicacao unificada, projetada para oferecer uma experiencia de usuario premium aliada a uma infraestrutura tecnica robusta. Este documento serve como o guia definitivo sobre a arquitetura, implementacao e funcionamento interno de todos os componentes do ecossistema Hubify.

---

## 1. Visao Geral e Proposito

O Hubify nasceu da necessidade de uma ferramenta de comunicacao que nao apenas conectasse pessoas, mas que fizesse isso de forma fluida, estetica e tecnicamente eficiente. A plataforma integra mensagens instantaneas, chamadas de video P2P, gestao de eventos em calendario e administracao de grupos, tudo sob uma arquitetura de microservicos containerizada.

### 1.1 Missao do Projeto
Fornecer comunicacao corporativa com latencia zero, interface intuitiva e seguranca de dados, eliminando a friccao entre equipes remotas.

---

## 2. Stack de Tecnologias (Analise Profunda)

### 2.1 Frontend: Camada de Apresentacao e Estado
O frontend e construido utilizando **React.js** com a ferramenta de build **Vite**, garantindo performance superior tanto em desenvolvimento quanto em producao.

- **Gerenciamento de Estado Global**: Utiliza a **Context API** do React. Optamos por nao usar Redux para evitar complexidade desnecessaria, ja que o Contexto nativo com `useReducer` e `useState` atende perfeitamente a demanda de sessoes de chat e video.
- **Design System**: Baseado em **Tailwind CSS**, permitindo uma interface "Pixel Perfect" com zero arquivos CSS gigantescos.
- **Micro-interacoes**: **Framer Motion** gerencia o ciclo de vida dos componentes na arvore DOM (animacoes de entrada e saida).
- **Protocolos de Rede**:
    - **HTTP/REST**: Para operacoes de dados estaticos e configuracoes.
    - **WebSockets (Socket.io)**: Para eventos que exigem "Push" do servidor (notificacoes, digitacao).
    - **WebRTC**: Para transmissao de pacotes UDP de audio e video diretamente entre usuarios.
- **Gerenciamento de Midia**: Utiliza a biblioteca **Simple-Peer** como wrapper do WebRTC nativo para facilitar o gerenciamento de sessoes e candidatos ICE.

### 2.2 Backend: O Coracao da Logica e Persistencia
Baseado em **Java 17** com **Spring Boot**, o backend e responsavel por orquestrar a seguranca e a integridade dos dados.

- **Seguranca**: Camada de **Spring Security** com configuracao Stateless.
- **Persistencia Dinamica**: Implementacao de um sistema de documentos JSON sobre banco de dados relacional, permitindo que a aplicacao se comporte como um NoSQL em termos de flexibilidade de esquema.
- **Build Engine**: **Maven** para gestao de dependencias e lifecycle de compilacao.

### 2.3 Video Signaling Server
Servico especializado em **Node.js** responsavel por unir os pares WebRTC.

- **Sinalizacao**: Utiliza `Socket.io` para troca de `SDP (Session Description Protocol)` e `ICE Candidates`.
- **Rooms**: Gerenciamento de sessoes temporarias para chamadas de video, garantindo que os sinais nao vazem entre conversas diferentes.

---

## 3. Arquitetura de Pastas e Componentes (Frontend)

### 3.1 Diretorio `/src/components`
A organizacao segue principios de design atomico e responsabilidade unica:

#### 3.1.1 `chat/`
- **`ChatList.jsx`**: 
    - Funcao: Renderizar a lista de conversas ativas e grupos.
    - Detalhe Tecnico: Implementa `useMemo` para filtrar conversas e otimizar a renderizacao em listas grandes ( > 1000 chats).
- **`ChatMessages.jsx`**: 
    - Funcao: Container principal de mensagens.
    - Logica: Gerencia o scroll inteligente que detecta se o usuario esta no final da pagina antes de forcar o scroll em novas mensagens.
- **`ChatRoomItem.jsx`**: 
    - Funcao: Item individual da lista.
    - UI: Exibe previews de mensagens, contagem de nao lidas e status de presenca online/offline.

#### 3.1.2 `video/`
- **`useCallLogic.js`**: 
    - Core: Hook que encapsula toda a maquina de estados de uma chamada (IDLE -> CALLING -> RINGING -> CONNECTED -> DISCONNECTED).
- **`WebVideoCallInterface.jsx`**: 
    - Design: Layout horizontal otimizado para monitores ultrawide, com suporte a Picture-in-Picture.
- **`MobileVideoCallInterface.jsx`**: 
    - Design: Foco em ergonomia mobile, botoes grandes e suporte a orientacao portrait/landscape.

### 3.2 Diretorio `/src/context`
- **`ChatContext.jsx`**: 
    - Logica de Polling: Mantem um `setInterval` que sincroniza documentos a cada 350ms.
    - Optimistic Deletion: Utiliza a referencia `processingDeletions` para garantir que salas excluidas nao reaparecam na UI antes do banco de dados confirmar a delecao.
    - Wallpapers: Gerencia o dicionario de IDs de papel de parede e persiste no `LocalStorage`.

---

## 4. Arquitetura do Backend (Deep Dive)

### 4.1 Camada de APIs (`com.hubify.interfaces.rest`)
- **`DocumentController.java`**: 
    - Metodo `saveDocument`: Recebe um objeto generico e persiste no caminho especificado.
    - Metodo `patchDocument`: Permite atualizacao parcial de campos (ex: marcar mensagem como lida ou trocar wallpaper).
- **`AuthController.java`**: 
    - Gerencia o login e registro, retornando o perfil completo do usuario para o frontend.

### 4.2 Camada de Dominio e Persistencia
- **`Document.java`**: Entidade central que representa qualquer dado no sistema (mensagem, grupo, configuracao).
- **`User.java`**: Representacao do usuario, incluindo status de presenca e read-timestamps.
- **`DocumentRepository.java`**: Abstracao do banco de dados, realizando buscas otimizadas por caminho e dono do documento.

---

## 5. Fluxos de Trabalho Tecnicos

### 5.1 O Ciclo de Vida de uma Chamada de Video
1. **Inicio**: O usuario A envia um evento `call-user` via Socket ao servidor de sinalizacao.
2. **Notificacao**: O servidor roteia o evento para o usuario B.
3. **Aceite**: O usuario B gera um `Answer` (SDP) e envia de volta ao usuario A.
4. **ICE Candidates**: Ambos os pares trocam informações de rede para encontrar a melhor rota (STUN/TURN).
5. **Conexao**: A stream de midia e estabelecida diretamente entre os navegadores (P2P).

### 5.2 Sincronizacao Real-Time Otimizada
O Hubify nao depende exclusivamente de WebSockets para o estado persistente do chat. Utilizamos uma abordagem de **Polling Inteligente**:
- O frontend compara o `hash` do conteudo recebido do servidor com o `hash` local.
- Somente se houver mudanca, o estado do React e atualizado, disparando a re-renderizacao.
- Isso reduz drasticamente o uso de CPU e bateria em dispositivos moveis.

### 5.3 Engine de Wallpapers SVG
O sistema de papeis de parede nao utiliza imagens rasterizadas (JPEG/PNG). 
- Cada wallpaper e um **padrão SVG** gerado via codigo.
- Vantagem: Escalabilidade infinita sem perda de qualidade e peso de apenas alguns bytes por pattern.

---

## 6. Seguranca e Privacidade

- **Isolamento de Dados**: O backend valida se o usuario que solicita um documento tem permissao (é membro do grupo ou destinatario da DM).
- **Criptografia em Trânsito**: Todas as comunicacoes sao protegidas por TLS/SSL via Nginx.
- **WebRTC Privacy**: O trafego de video e criptografado de ponta a ponta (E2EE) por natureza do protocolo WebRTC.

---

## 7. Infraestrutura e DevOps

### 7.1 Docker Orchestration
O `docker-compose.yml` unifica o ecossistema:
- `hubify-db`: MySQL 8.0 gerenciado.
- `hubify-backend`: Container Java 17.
- `hubify-video-server`: Container Node.js.
- `hubify-frontend`: Servidor Nginx servindo o build de producao do Vite.

### 7.2 Scripts de Automacao
- **`hubify-local.ps1`**: Faz o setup do ambiente local, configurando variaveis de ambiente e subindo os containers.
- **`hubify-deploy.ps1`**: Automatiza o push das imagens para o Google Artifact Registry e o deploy no Google Cloud Run.

---

## 8. Troubleshooting e Manutencao

### 8.1 Problemas de Video (Camera/Audio)
- Verifique se o `Socket.io` esta conectado (veja o log do console).
- Garanta que ambos os usuarios estejam em contextos seguros (HTTPS ou localhost).
- Verifique se os permissoes de camera/microfone foram concedidas no navegador.

### 8.2 Lentidao na Sincronizacao
- Verifique a latencia de rede para o backend.
- O intervalo de polling em `api-client.js` pode ser reduzido, mas aumentara a carga no servidor.

---

## 9. Conclusao

O Hubify v4.5.0 e uma solucao madura que equilibra complexidade tecnica com facilidade de uso. Sua arquitetura modular garante que o projeto seja facil de manter e expandir para novas funcionalidades (como bots, integracoes com IA, etc).

---

## 10. Referencias e Tecnologias

| Tecnologia | Versao | Uso |
|------------|--------|-----|
| React | 18+ | Frontend UI |
| Spring Boot | 3+ | Backend API |
| Node.js | 18+ | Video Signaling |
| Socket.io | 4+ | Real-time Events |
| WebRTC | Native | P2P Video/Audio |
| Docker | 20+ | Containerization |

---

**Desenvolvido por Andrey Giordane**  
*Senior Software Engineer & Architect.*  
GitHub: [andreygiordane](https://github.com/andreygiordane)  
Email: andreycostaa@gmail.com

---

### Apendice A: Tabela de Endpoints API

| Verbo | Rota | Descricao |
|-------|------|-----------|
| POST | `/api/auth/login` | Autenticacao de usuario |
| GET | `/api/data/collections/{path}` | Busca colecao de documentos |
| POST | `/api/data/documents/{path}` | Cria ou substitui documento |
| PATCH | `/api/data/documents/{path}` | Atualizacao parcial |
| DELETE | `/api/data/documents/{path}` | Remove documento do sistema |

### Apendice B: Eventos Socket.io (Video Server)

| Evento | Direcao | Payload | Descricao |
|--------|---------|---------|-----------|
| `call-user` | Outbound | `{ offer, to }` | Inicia chamada |
| `make-answer` | Inbound | `{ answer, to }` | Responde chamada |
| `ice-candidate` | Bidirecional | `{ candidate, to }` | Troca de rota de rede |
| `messages-read` | Bidirecional | `{ roomId, userId }` | Notificacao de leitura |

---
*Fim da Documentacao.*
