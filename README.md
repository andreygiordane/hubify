# Hubify - Plataforma Unificada de Comunicacao Corporativa

Hubify e uma solucao integrada de comunicacao em tempo real, desenvolvida para fornecer um ambiente de colaboracao seguro e escalavel. A arquitetura da plataforma e dividida em servicos especializados, garantindo alta disponibilidade para troca de mensagens e videoconferencias.

## Arquitetura do Sistema

A plataforma e composta por tres modulos principais:

1. **Backend (Java/Spring Boot)**: Gerenciamento de persistencia de dados, autenticacao e logica de negocios. Utiliza uma camada de repositorio de documentos flexivel para armazenamento de metadados e configuracoes.
2. **Video Server (Node.js/Socket.io)**: Servidor de sinalizacao WebRTC dedicado. Gerencia o handshake entre pares e o roteamento de eventos de sinalizacao para chamadas de audio e video.
3. **Frontend (React)**: Interface de usuario baseada em componentes reativos, focada em performance e experiencia do usuario.

## Funcionalidades Tecnicas

### Engine de Mensageria
- Implementacao de sistema de sincronizacao via polling otimizado com cache local.
- Gerenciamento de estado otimista (Optimistic Updates) para operacoes de exclusao e envio de mensagens, reduzindo a latencia percebida pelo usuario.
- Filtragem de autorizacao de documentos via backend para garantir a privacidade de grupos e conversas diretas.

### Infraestrutura de Video e WebRTC
- Handshake peer-to-peer utilizando Simple-Peer para estabelecimento de conexoes.
- Gerenciamento dinâmico de tracks de midia (audio/video) com suporte a reconexao automatica em caso de instabilidade de rede.
- Interface adaptativa para dispositivos moveis com controle de viewport e gestos.

### Customizacao e Estetica
- Sistema de patterns SVG injetados dinamicamente para personalizacao de backgrounds de chat sem impacto na performance de renderizacao.
- Persistencia de preferencias de interface via LocalStorage e sincronizacao opcional com o perfil do usuario no backend.

## Requisitos de Ambiente

- Docker Desktop (com Docker Compose)
- Java 17+ (para desenvolvimento local do backend)
- Node.js 18+ (para desenvolvimento local do frontend/video-server)

## Execucao e Deploy

### Ambiente de Desenvolvimento
Para iniciar todos os servicos em containers Docker locais:
```powershell
./hubify-local.ps1
```

### Deploy em Producao
O deploy e automatizado para o Google Cloud Platform (GCP), utilizando Google Cloud Run para os servicos e Google Cloud SQL para a persistencia:
```powershell
./hubify-deploy.ps1
```

## Notas de Versao v4.5.0

- Implementacao de wallpapers geometricos baseados em SVG.
- Otimizacao do fluxo de exclusao de salas com reducao de flickering via processamento de delecao local.
- Restauracao do banner de convites de grupo na barra lateral para melhor visibilidade.
- Correcao de bug de reinicializacao de camera em chamadas via dispositivos moveis.

## Desenvolvedor
Andrey Giordane
GitHub: https://github.com/andreygiordane
Email: andreycostaa@gmail.com
