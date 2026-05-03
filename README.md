# Hubify - Plataforma de Colaboração Corporativa v3.2.0

![Hubify Logo](https://api.dicebear.com/7.x/initials/svg?seed=Hubify&backgroundColor=4f46e5&fontFamily=Open%20Sans&fontWeight=700)

Hubify é um ecossistema de comunicação profissional de alta performance, projetado para unificar mensagens em tempo real, videoconferências em HD e gestão de equipes em uma interface premium e intuitiva.

---

## 🚀 Novidades da Versão 3.2.0

Esta versão foca em segurança avançada, flexibilidade de acesso e uma experiência mobile totalmente revitalizada.

### 🔐 Segurança e Autenticação Evoluída
- **Login Híbrido**: Autenticação flexível permitindo o uso de **E-mail** ou **Nome de Usuário** (@usuario).
- **Migração de Senhas Legadas**: Sistema inteligente que detecta senhas antigas/fracas no login e exige a atualização imediata para o novo padrão de segurança.
- **Padrão de Senha Forte**: Implementação de requisitos rigorosos (8+ caracteres, números, símbolos e letras maiúsculas) com validação visual em tempo real.
- **Criptografia BCrypt**: Todas as senhas são processadas com hashing de última geração antes da persistência.

### 📱 Experiência Mobile Premium
- **Interface Redesenhada**: Tela de login mobile com estética sincronizada à versão web (glassmorphism, gradientes neon e texturas profundas).
- **Identidade Visual**: Integração do logotipo oficial da Hubify e mensagens de saudação dinâmicas baseadas no contexto do usuário.
- **Responsividade Total**: Layout adaptativo garantindo usabilidade perfeita em qualquer tamanho de tela.

### 💬 Mensageria e Colaboração (Recursos Core)
- **Ciclo de Vida de Mensagens**: Editar, Responder, Encaminhar e Apagar mensagens com sincronização instantânea via Socket.io.
- **Gestão de Grupos**: Sistema de hierarquia para administradores e convites de membros em tempo real.
- **Status Online**: Indicadores de presença em toda a plataforma.

---

## 🛠 Tecnologias Utilizadas

### Frontend
- **React 18**: Biblioteca base para UI reativa.
- **Vite**: Build tool ultrarrápido para desenvolvimento moderno.
- **Tailwind CSS**: Estilização baseada em utilitários para design consistente.
- **Lucide Icons**: Conjunto de ícones premium e leves.
- **Framer Motion**: Animações suaves e micro-interações.
- **Socket.io-client**: Comunicação bidirecional em tempo real.

### Backend
- **Java 25**: Linguagem robusta com as últimas funcionalidades de performance.
- **Spring Boot 3**: Framework para APIs REST seguras e escaláveis.
- **Spring Data JPA**: Abstração de persistência eficiente.
- **PostgreSQL**: Banco de dados relacional robusto para dados críticos.
- **Lombok**: Redução de boilerplate code para maior manutenibilidade.

### Infraestrutura & Vídeo
- **WebRTC**: Tecnologia para transmissão de vídeo e áudio P2P.
- **Node.js**: Servidor de sinalização (Signaling) para conexões WebRTC.
- **Docker & Docker Compose**: Conteinerização de todos os serviços para deploy simplificado em qualquer ambiente.

---

## 📂 Estrutura do Projeto

```bash
├── backend/            # API Spring Boot (Java 25)
│   ├── src/main/java   # Lógica de negócio, Controllers e Segurança
│   └── pom.xml         # Dependências Maven e Versão 3.2.0
├── frontend/           # Aplicação React (Vite)
│   ├── src/            # Componentes, Páginas e Contextos
│   └── package.json    # Dependências e Versão 3.2.0
├── video-server/       # Servidor de Sinalização (Node.js)
│   ├── server.js       # Lógica de handshaking WebRTC
│   └── package.json    # Dependências e Versão 3.2.0
└── docker-compose.yml  # Orquestração do ecossistema Hubify
```

---

## 📦 Como Executar

### Pré-requisitos
- Docker & Docker Compose instalados.

### Passo a Passo
1. Clone este repositório:
   ```bash
   git clone git@github.com:andreygiordane/hubify.git
   ```
2. Inicie o ecossistema completo:
   ```bash
   docker-compose up -d --build
   ```
3. Acesse a plataforma em `http://localhost:5173`.

---

## 👤 Autor
**Andrey Giordane**
Email: [andreycostaa@gmail.com](mailto:andreycostaa@gmail.com)
GitHub: [@andreygiordane](https://github.com/andreygiordane)

---
Desenvolvido com foco em excelência e produtividade corporativa. Hubify v3.2.0.
