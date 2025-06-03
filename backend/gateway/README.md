# eGerente Gateway API

Gateway API para o sistema eGerente, integrando com o Supabase.

## Requisitos

- Node.js 14+
- Conta no Supabase
- PostgreSQL (gerenciado pelo Supabase)

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`
   - Preencha as variáveis com suas credenciais do Supabase

## Configuração do Supabase

1. Crie um novo projeto no Supabase
2. Crie as seguintes tabelas:

### Usuários
```sql
create table usuarios (
  id uuid default uuid_generate_v4() primary key,
  codigo varchar(5) unique not null,
  nome varchar(100) not null,
  email varchar(100) unique not null,
  senha varchar(100) not null,
  nivel varchar(20) not null,
  status varchar(20) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Colaboradores
```sql
create table colaboradores (
  id uuid default uuid_generate_v4() primary key,
  codigo varchar(5) unique not null,
  nome varchar(100) not null,
  email varchar(100) unique not null,
  telefone varchar(20),
  cargo varchar(50) not null,
  status varchar(20) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Clientes
```sql
create table clientes (
  id uuid default uuid_generate_v4() primary key,
  codigo varchar(5) unique not null,
  nome varchar(100) not null,
  tipo varchar(2) not null,
  email varchar(100),
  telefone varchar(20),
  status varchar(20) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Produtos
```sql
create table produtos (
  id uuid default uuid_generate_v4() primary key,
  codigo varchar(5) unique not null,
  nome varchar(100) not null,
  preco decimal(10,2) not null,
  status varchar(20) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Serviços
```sql
create table servicos (
  id uuid default uuid_generate_v4() primary key,
  codigo varchar(5) unique not null,
  nome varchar(100) not null,
  preco decimal(10,2) not null,
  duracao varchar(20) not null,
  status varchar(20) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## Executando o projeto

1. Em desenvolvimento:
   ```bash
   npm run dev
   ```

2. Em produção:
   ```bash
   npm start
   ```

## Endpoints

### Usuários
- GET /api/usuarios - Lista todos os usuários
- GET /api/usuarios/:codigo - Busca um usuário pelo código
- POST /api/usuarios - Cria um novo usuário
- PUT /api/usuarios/:codigo - Atualiza um usuário
- DELETE /api/usuarios/:codigo - Exclui um usuário

## Segurança

- CORS habilitado
- Rate limiting
- Helmet para headers de segurança
- Autenticação via Supabase (a ser implementada) 