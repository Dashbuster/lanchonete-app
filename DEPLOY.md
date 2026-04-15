# Deploy do lanchonete-app

## 1. O que precisa estar pronto

- Banco PostgreSQL acessivel e com `DATABASE_URL` valida.
- Se usar pooler do Supabase, manter tambem `DIRECT_URL` com a conexao direta para tarefas administrativas.
- Variaveis do `.env` preenchidas a partir do `.env.example`.
- Credenciais de admin definidas em `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
- Credenciais do Mercado Pago definidas se voce quiser testar PIX real.

## 2. Teste local antes de publicar

1. Instale dependencias:
```bash
npm install
```
2. Gere o client do Prisma:
```bash
npm run db:generate
```
3. Aplique o schema no banco:
```bash
npm run db:push
```
4. Popule dados iniciais:
```bash
npm run db:seed
```
O seed usa `ADMIN_EMAIL` e `ADMIN_PASSWORD` para o usuario admin principal.
5. Rode a aplicacao:
```bash
npm run dev
```
6. Verifique:
```text
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/admin/dashboard
```

## 3. Checklist funcional

- Cardapio carrega categorias e produtos.
- Modal do produto abre e permite escolher complementos.
- Carrinho adiciona, remove e altera quantidade.
- Checkout cria pedido com entrega ou retirada.
- Pagamento PIX cria preferencia ou link do Mercado Pago.
- Tela `/pedido/{id}` mostra o acompanhamento do pedido.
- Admin faz login com `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
- Admin lista pedidos, avanca status e cancela pedido.
- Admin consegue editar categorias, produtos, configuracoes e relatorios.

## 4. Colocar no ar com Vercel

1. Suba o projeto para GitHub.
2. No Vercel, clique em `Add New > Project`.
3. Importe o repositorio `lanchonete-app`.
4. Configure as variaveis de ambiente do `.env.example`.
5. Em `Build Command`, use:
```bash
npm run build
```
6. Em `Install Command`, use:
```bash
npm install
```
7. Em `Output`, deixe o padrao do Next.js.
8. Publique.

## 5. Banco em producao

- Se for usar Supabase, crie um projeto PostgreSQL e copie a string de conexao.
- Em runtime na Vercel, prefira o pooler em `DATABASE_URL`; para manutencao local/CI, use a conexao direta em `DIRECT_URL`.
- Rode `npm run db:push` apontando para o banco de producao.
- Rode `npm run db:seed` apenas se quiser dados de exemplo.
- Se nao quiser dados ficticios em producao, cadastre categorias e produtos pelo admin.

## 6. Variaveis recomendadas na Vercel

```env
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_APP_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_PUBLIC_KEY=
MERCADO_PAGO_WEBHOOK_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## 7. Teste depois do deploy

1. Abra a home publicada.
2. Confirme se produtos e categorias aparecem.
3. Faça um pedido de teste.
4. Abra `/pedido/{id}` e veja se o status carrega.
5. Entre no admin.
6. Atualize o pedido ate `DELIVERED`.
7. Se usar PIX real, confirme se o webhook atualiza o pedido.

## 8. Status atual desta verificacao

Verificacao realizada em 13/04/2026:

- `npm run build` concluiu com sucesso em modo de producao.
- `npm run db:push` conectou no PostgreSQL configurado e confirmou schema sincronizado.
- `npm run db:seed` executou com sucesso no banco atual.

Pendencia externa para o deploy final:

- Publicar no provedor escolhido (ex.: Vercel) com `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL` apontando para o dominio real.
- Se for usar PIX em producao, cadastrar a URL publica de `/api/payments/webhook` no Mercado Pago.
