# AgroFrete CRM - Next.js

Versao em Next.js + React + TypeScript do MVP AgroFrete.

## Rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Copie `.env.local.example` para `.env.local` e preencha a chave publica do Supabase.

3. Rode:

```bash
npm run dev
```

4. Abra:

```txt
http://localhost:3000
```

## Banco

Esta versao usa as tabelas ja criadas no Supabase:

- `clientes`
- `cargas`
- `motoristas`
- `veiculos`

Antes de producao, revise login, permissoes e Row Level Security.
