# Hubify - Documentacao Tecnica Completa e Extensa v4.5.0

Hubify e uma plataforma enterprise-grade de comunicacao unificada, projetada para oferecer uma experiencia de usuario premium aliada a uma infraestrutura tecnica robusta. Este documento serve como o guia definitivo sobre a arquitetura, implementacao e funcionamento interno de todos os componentes do ecossistema Hubify.

---

## 1. Visao Geral e Proposito

O Hubify nasceu da necessidade de uma ferramenta de comunicacao que nao apenas conectasse pessoas, mas que fizesse isso de forma fluida, estetica e tecnicamente eficiente. A plataforma integra mensagens instantaneas, chamadas de video P2P, gestao de eventos em calendario e administracao de grupos, tudo sob uma arquitetura de microservicos containerizada.

---

## 2. Stack de Tecnologias (Analise Profunda)

### 2.1 Frontend: A Camada de Apresentacao
O frontend e construido utilizando **React.js** com a ferramenta de build **Vite**, garantindo tempos de recarregamento (HMR) ultra-rapidos e um bundle final otimizado.

- **Gerenciamento de Estado**: Utiliza a **Context API** do React para evitar o prop-drilling e manter estados globais como mensagens, informacoes de usuario e sessoes de video sincronizadas.
- **Estilizacao**: **Tailwind CSS** e a base para o design system. A escolha pelo Tailwind permite uma iteracao rapida na UI mantendo um baixo tamanho de CSS final.
- **Animacoes**: **Framer Motion** e utilizado para criar transicoes de pagina "app-like" e feedbacks de micro-interacao (hover, tap, modals).
- **Comunicacao**: O frontend utiliza uma abordagem hibrida entre **Axios** para requisicoes REST e **Socket.io-client** para eventos de tempo real que nao exigem persistencia imediata (ex: digitacao).
- **WebRTC**: Utiliza a biblioteca **Simple-Peer** para abstrair a complexidade nativa do WebRTC, facilitando a troca de sdp e candidatos ICE entre os pares.

### 2.2 Backend: O Motor de Processamento
O core do sistema e uma aplicacao **Spring Boot** escrita em **Java 17**, seguindo as melhores praticas de desenvolvimento corporativo.

- **Seguranca**: Implementacao customizada do **Spring Security** para gerenciar a autenticacao e autorizacao.
- **Persistencia**: O sistema utiliza um padrão de **Document Repository** flexivel, onde documentos JSON sao armazenados e consultados de forma dinamica, permitindo que a estrutura do chat evolua sem migracoes de banco de dados pesadas.
- **Integracao**: Expoe uma API RESTful consumida pelo frontend, protegida por CORS e politicas de seguranca rigorosas.
- **Migrations**: O `DatabaseMigrationRunner` garante que o esquema do banco (seja MySQL ou PostgreSQL) esteja sempre alinhado com o codigo no momento do startup.

### 2.3 Video Server: O Sinalizador
Um servico leve em **Node.js** que atua como o "matchmaker" das conexoes de video.

- **Socket.io**: Gerencia salas de sinalizacao onde os usuarios trocam suas credenciais WebRTC.
- **Event Lifecycle**: Escuta eventos de `join`, `call`, `answer` e `candidate`, roteando-os para o destinatario correto sem nunca tocar no fluxo de midia (preservando a privacidade P2P).

---

## 3. Arquitetura do Frontend (Detalhamento de Pastas e Componentes)

### 3.1 Componentes de Chat (`/src/components/chat`)
- **`ChatList.jsx`**: Gerencia a renderizacao da lista lateral de conversas. Inclui logica de filtragem por busca, contagem de mensagens nao lidas e o banner de convites para grupos.
- **`ChatMessages.jsx`**: Responsavel pela area de visualizacao de mensagens. Implementa o scroll automatico, renderizacao de diferentes tipos de midia (imagens, arquivos) e a nova camada de wallpapers SVG.
- **`ChatRoomItem.jsx`**: Representacao individual de uma conversa na lista, lidando com estados de presenca e previews de ultima mensagem.

### 3.2 Componentes de Video (`/src/components/video`)
- **`useCallLogic.js`**: Hook customizado que isola toda a logica de sinalizacao e gerenciamento de stream. Mantem o estado da chamada (calling, ringing, connected) e gerencia os timeouts de conexao.
- **`WebVideoCallInterface.jsx`**: Interface otimizada para desktops, com layouts side-by-side e controles flutuantes.
- **`MobileVideoCallInterface.jsx`**: Interface verticalizada, focada em gestos e aproveitamento total da tela de dispositivos moveis.

### 3.3 Gestao de Estado (`/src/context`)
- **`ChatContext.jsx`**: O componente mais complexo do sistema. Ele gerencia:
    - O polling de mensagens (atualizacao em tempo real).
    - A logica de exclusao otimista (remocao imediata da UI enquanto o backend processa).
    - A persistencia de timestamps de leitura para evitar que conversas antigas "pulem" na lista.
    - A engine de wallpapers customizados.

---

## 4. Arquitetura do Backend (Camadas e Fluxos)

### 4.1 Entidades de Dominio
- **`User`**: Armazena credenciais, perfil e metadados de status.
- **`Document`**: Entidade generica para armazenamento de mensagens, grupos e configuracoes.

### 4.2 Controladores (`/interfaces/rest`)
- **`DocumentController`**: Ponto central para operacoes CRUD de dados do app. Suporta operacoes de PATCH para atualizacoes parciais (ex: mudar apenas o wallpaper de uma sala).
- **`AuthController`**: Gerencia o ciclo de vida da sessao do usuario.

### 4.3 Servicos (`/application/service`)
- **`AuthService`**: Contem a logica de validacao de credenciais e integracao com a camada de persistencia.

---

## 5. Logicas de Negocio e Algoritmos Especializados

### 5.1 Otimizacao de Exclusao Real-Time
Para evitar o problema comum em sistemas de polling onde um item deletado reaparece momentaneamente (flicker), o Hubify utiliza um sistema de **"Processing Deletions"**. 
1. O frontend registra o ID da sala em um `Set` local.
2. O filtro de renderizacao ignora qualquer dado vindo do servidor que corresponda a um ID nesse `Set`.
3. Somente apos a confirmacao do backend de que o registro foi removido fisicamente, o ID e retirado do `Set`.

### 5.2 Engine de Wallpapers Dinamicos
Em vez de carregar imagens pesadas, o Hubify utiliza **padrões SVG injetados via Data URI**. Isso permite:
- Zero latencia no carregamento do fundo do chat.
- Customizacao total de cores e opacidades via codigo.
- Baixissimo consumo de memoria RAM no navegador.

### 5.3 Handshake WebRTC Mobile
Devido as restricoes de economia de bateria em dispositivos moveis, o fluxo de sinalizacao inclui buffers de tempo e tentativas de reconexao silenciosas para garantir que a chamada nao caia ao trocar de rede (ex: Wi-Fi para 4G).

---

## 6. Deployment e Infraestrutura

### 6.1 Containerizacao (Docker)
O projeto e totalmente distribuido via `docker-compose`. 
- **`Dockerfile` Frontend**: Utiliza build multi-stage. Primeiro compila o React e depois serve os estaticos via **Nginx** otimizado.
- **`Dockerfile` Backend**: Utiliza Maven para compilar o `.jar` e uma imagem leve de JRE para execucao.

### 6.2 Estrategia de Deploy (GCP)
O Hubify e desenhado para o **Google Cloud Platform**:
- **Cloud Run**: Hospedagem serverless dos containers de frontend, backend e video.
- **Cloud SQL**: Banco de dados MySQL gerenciado.
- **Cloud Storage**: Para armazenamento de midias grandes enviadas pelos usuarios.

---

## 7. Guia de Manutencao

### Adicionando Novos Wallpapers
Basta adicionar um novo objeto ao array `wallpapers` no arquivo `Chat.jsx`, definindo o nome e o padrão SVG desejado.

### Alterando a Frequencia de Sincronizacao
No arquivo `api-client.js`, a variavel de intervalo do `listenToCollection` pode ser ajustada. O padrao de 350ms e o equilibrio ideal entre "tempo real" e carga no servidor.

---

## 8. Consideracoes Finais

O Hubify v4.5.0 representa o apice do desenvolvimento desta plataforma, unindo estabilidade tecnica com uma interface que encanta o usuario. A modularidade do codigo permite que novas funcionalidades sejam adicionadas com impacto minimo nas estruturas existentes.

---

**Desenvolvido por Andrey Giordane**  
*Engenharia de Software de Alta Performance.*  
GitHub: [andreygiordane](https://github.com/andreygiordane)  
Email: andreycostaa@gmail.com

---
*Este documento possui carater tecnico e extensivo, servindo como base para onboarding de novos desenvolvedores e auditoria de sistemas.*
