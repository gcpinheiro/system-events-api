# Presence API – Guia de Execução e Arquitetura

Este documento descreve **como rodar o projeto localmente** e **a arquitetura adotada**, incluindo a separação de responsabilidades por módulos, o fluxo de autenticação (Auth Exchange) e as principais decisões técnicas.

---

## 📌 Visão Geral

A Presence API é responsável pelo controle de presença em eventos acadêmicos, utilizando:

- Autenticação via **Auth Exchange**
- Validação de presença por **QR Code**
- Envio de **e-mail de confirmação**
- Arquitetura modular baseada em **NestJS**

---

## 🚀 Como rodar o projeto localmente

### Pré-requisitos
Antes de iniciar, certifique-se de ter instalado:

- Node.js (versão LTS recomendada)
- NPM ou Yarn
- Docker e Docker Compose (para banco de dados e Redis)
- NestJS CLI

```bash
npm i -g @nestjs/cli
```

---

### 1️⃣ Clonar o repositório
```bash
git clone <repo-url>
cd presence-api
```

---

### 2️⃣ Instalar dependências
```bash
npm install
```

---

### 3️⃣ Subir dependências de infraestrutura (opcional, recomendado)
```bash
docker compose up -d
```

---

### 4️⃣ Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/presence

# JWT
JWT_SECRET=super_secret_key
JWT_EXPIRES_IN=1h

# Redis (fila)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

### 5️⃣ Rodar migrações (se aplicável)
Caso utilize Prisma:

```bash
npx prisma migrate dev
```

---

### 6️⃣ Iniciar a aplicação
```bash
npm run start:dev
```

A API ficará disponível em:
```
http://localhost:3000
```

Swagger (se habilitado):
```
http://localhost:3000/api
```

---

## 🔐 Autenticação – Auth Exchange

O sistema utiliza o padrão **Auth Exchange**, separando a autenticação institucional do domínio da aplicação.

### Fluxo resumido
1. O aluno acessa o Portal Institucional autenticado.
2. O Portal redireciona para a Presence API enviando um **token institucional**.
3. A Presence API valida esse token via integração externa.
4. Um **token interno (APP_TOKEN)** é gerado.
5. O APP_TOKEN é usado para todas as chamadas subsequentes.

### Endpoint
```
POST /auth/exchange
```

---

## 🧱 Arquitetura por Módulos (NestJS)

```
src/
 ├─ auth/
 ├─ events/
 ├─ sessions/
 ├─ attendance/
 ├─ mail/
 ├─ integrations/
 ├─ persistence/
 ├─ common/
 ├─ app.module.ts
 └─ main.ts
```

---

## 📦 Módulos e Responsabilidades

### AuthModule
- Auth Exchange
- JWT
- Guards e roles

### EventsModule
- CRUD de eventos
- Metadados

### SessionsModule
- Sessões ativas
- Controle de checkout

### AttendanceModule
- Confirmação de presença via QR Code
- Validações de negócio
- Registro de presença
- Disparo de e-mail

### MailModule
- Envio assíncrono de e-mails
- Integração com provider institucional

### IntegrationsModule
- Validação do token institucional
- Busca de dados do aluno

### PersistenceModule
- ORM
- Banco de dados
- Repositórios

### Common
- Guards
- Decorators
- Filtros
- Utilitários

---

## 🧠 Princípios de Arquitetura

- Separação clara de responsabilidades
- Feature-based modules
- Baixo acoplamento
- Controllers finos
- Regra de negócio nos services
- Processos assíncronos para tarefas custosas

---

## 🚀 Tecnologias Utilizadas

- Node.js
- NestJS
- JWT
- PostgreSQL
- Prisma ou TypeORM
- Redis / BullMQ
- SMTP ou serviço institucional

---

## 📈 Evolução futura

- Workers separados
- Observabilidade
- Rate limiting
- Auditoria
- Dashboard administrativo

---

## 📄 Licença
Projeto institucional – uso interno.
