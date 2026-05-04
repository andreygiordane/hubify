# Hubify - Plataforma de Comunicação Corporativa v4.0.0

![Hubify Logo](https://api.dicebear.com/7.x/initials/svg?seed=Hubify&backgroundColor=2563eb&fontFamily=Outfit&fontWeight=800)

O **Hubify** é uma solução completa de comunicação empresarial, projetada para oferecer uma experiência de colaboração premium, segura e de altíssima performance. Integrando mensageria em tempo real e videoconferência HD, o Hubify v4.0.0 redefine a produtividade remota com uma interface state-of-the-art.

---

## 🚀 Novidades da Versão 4.0.0 (The Stream Update)

Esta é a atualização mais significativa até o momento, focada em produtividade visual e estabilidade de infraestrutura.

### 🎥 Revolução no Vídeo & Compartilhamento
- **Multi-Stream Simultâneo**: Agora você pode compartilhar sua tela e manter sua webcam ativa ao mesmo tempo. O sistema trata cada fluxo como um participante separado na grade.
- **Spotlight Automático**: A interface prioriza automaticamente o conteúdo compartilhado, destacando-o no centro para todos os participantes.
- **Indicadores de Transmissão**: Selos pulsantes "Transmitindo" nas webcams dos apresentadores para identificação imediata.
- **Design de Cápsula**: Interface de controles e tiles de vídeo com estética moderna, bordas arredondadas e transparências (Glassmorphism).

### 📱 Experiência Mobile Inteligente
- **Grid Prioritário**: No mobile, ao haver uma transmissão de tela, ela ocupa o topo com destaque, enquanto os outros participantes são organizados em uma lista horizontal deslizante.
- **Ajuste de Proporção (Fit-to-Screen)**: Transmissões de tela agora usam o modo de ajuste completo, garantindo que nenhum detalhe do conteúdo seja cortado.
- **Otimização de Espaço**: Remoção de janelas flutuantes redundantes para uma interface mais limpa e focada.

### 🛠 Estabilidade e Engenharia de Dados
- **Prevenção de Telas Fantasmas**: Sincronização via Socket que força a limpeza de transmissões encerradas, garantindo que o grid esteja sempre atualizado.
- **Parsing Resiliente**: Novo motor de processamento de dados que recupera automaticamente registros de DMs e contatos, mesmo em casos de corrupção de JSON no banco de dados.
- **Renegociação WebRTC Nativa**: Implementação de lógica de add/remove stream customizada para maior estabilidade em conexões P2P.

---

## 🛠 Arquitetura & Tecnologias

O Hubify utiliza uma stack moderna e distribuída para garantir escalabilidade:

### 🎨 Frontend (React Ecosystem)
- **React 18 + Vite**: Performance de renderização e build extremamente rápidas.
- **Tailwind CSS**: Estilização baseada em tokens de design.
- **Framer Motion**: Animações de interface e transições de grid.
- **Lucide Icons**: Iconografia minimalista e consistente.
- **Socket.io-client**: Comunicação de eventos e chat em tempo real.

### ⚙️ Backend (Enterprise Java)
- **Java 25 + Spring Boot 3**: O que há de mais moderno na JVM para serviços robustos.
- **Spring Security + BCrypt**: Camada de proteção rigorosa para dados de usuários.
- **Spring Data JPA + PostgreSQL**: Persistência relacional otimizada para alto volume de dados.

### 📡 Video & Signaling (Real-time)
- **Node.js**: Servidor de sinalização leve e eficiente.
- **Native WebRTC Wrapper**: Camada personalizada para gestão de conexões Peer-to-Peer sem dependências pesadas.

---

## 📂 Estrutura do Ecossistema

```bash
├── backend/            # Microserviço de Regras de Negócio e API (Java 25)
├── frontend/           # Interface do Usuário (React + Vite)
├── video-server/       # Orquestrador de Sinalização WebRTC (Node.js)
├── docker-compose.yml  # Orquestração em Containers para Produção
└── README.md           # Documentação técnica v4.0.0
```

---

## 📦 Inicialização Rápida

1. Certifique-se de ter o **Docker** e **Docker Compose** instalados.
2. No diretório raiz, execute:
   ```bash
   docker-compose up -d --build
   ```
3. O Hubify estará disponível em `http://localhost:5173`.

---

## 👤 Desenvolvedor
**Andrey Giordane**
Email: [andreycostaa@gmail.com](mailto:andreycostaa@gmail.com)
GitHub: [@andreygiordane](https://github.com/andreygiordane)

---
Hubify v4.0.0 - Elevando o padrão da comunicação corporativa.
