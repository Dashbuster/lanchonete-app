# WhatsApp Robot Setup

## Visao geral

O robô do WhatsApp do `lanchonete-app` funciona a partir de eventos internos do pedido e das configuracoes salvas em `settings`.

O fluxo atual e este:

1. O pedido e criado no checkout.
2. O sistema tenta enviar mensagem de confirmacao do pedido.
3. Quando o pagamento e aprovado, o sistema envia confirmacao de pagamento.
4. Quando o pedido e marcado como `READY`, o sistema envia aviso de saida para entrega.
5. O envio pode seguir tres modos: `SIMULATED`, `WEBHOOK` ou `EVOLUTION`.

O admin nao conversa diretamente com a API do provedor externo. Ele apenas salva as configuracoes em banco, e o backend usa esses dados para disparar as mensagens.

## Provedores disponiveis

### `SIMULATED`

Modo local/de teste.

- Nao chama nenhum provedor externo.
- Executa o fluxo de envio sem dependencia de webhook, Evolution API ou instancia externa.
- Registra log interno em `WhatsAppLog`.
- E o melhor modo para validar o fluxo do sistema antes de integrar com uma plataforma real.

### `WEBHOOK`

Modo para integrar com um bot proprio, `n8n`, Make, servidor interno ou qualquer endpoint HTTP.

- O backend faz `POST` para a `whatsapp_api_url`.
- Se existir `whatsapp_token`, ele envia `Authorization: Bearer <token>`.
- O corpo da requisicao inclui telefone, mensagem, tipo do evento e dados do pedido.

### `EVOLUTION`

Modo para Evolution API.

- O backend chama `POST /message/sendText/{instance}`.
- Exige `whatsapp_api_url`, `whatsapp_instance` e `whatsapp_token`.
- Envia `apikey` e `Authorization` no header.

## Como preencher a tela admin

Abra `Admin > Configuracoes` e preencha os blocos abaixo.

### Geral

- `Nome da Loja`
- `Logo`
- `WhatsApp comercial`
- `Instagram URL`
- `Aceita retirada no local`

### Horario de funcionamento

- Cada dia pode ser marcado como aberto ou fechado.
- Se estiver aberto, informe horario de abertura e fechamento.

### Entrega

- `Taxa de Entrega`
- `Raio de Entrega`
- `Pedido Minimo`

### Area de Atendimento

Esses campos ficam salvos em `settings` com as chaves:

- `delivery_region_label`
- `delivery_region_center`
- `delivery_region_notes`
- `delivery_neighborhoods`

Use assim:

- `Nome da regiao`: nome comercial da area, por exemplo `Zona central`.
- `Ponto de referencia / endereco base`: endereco principal da operacao.
- `Bairros atendidos`: um bairro por linha.
- `Observacoes da cobertura`: regras de entrega, tempo medio, limites ou excecoes.

Importante:

- A configuracao fica persistida no banco.
- A pagina publica do cliente agora consome esses campos e exibe a regiao, a base de entrega, as observacoes e os bairros atendidos.
- Se voce alterar a area de atendimento no admin, salve e recarregue a home publica para confirmar que os dados vieram do banco.

### Robo do WhatsApp

Preencha os campos abaixo:

- `Ativar automacao no WhatsApp`
- `Provedor`
- `Telefone de teste`
- `URL da API / webhook`
- `Instancia / canal`
- `Token de autenticacao`

Chaves salvas no banco:

- `whatsapp_robot_enabled`
- `whatsapp_provider`
- `whatsapp_api_url`
- `whatsapp_instance`
- `whatsapp_token`
- `whatsapp_test_phone`

Regras praticas:

- O teste deve usar um telefone dedicado.
- `WEBHOOK` precisa de URL.
- `EVOLUTION` precisa de URL, instancia e token.
- `SIMULATED` dispensa configuracao externa.

## Como testar

### Teste pela tela admin

1. Abra `Admin > Configuracoes`.
2. Preencha o `Telefone de teste`.
3. Escolha o provedor.
4. Clique em `Salvar e testar`.
5. Se quiser testar sem salvar tudo de novo, clique em `Testar robo`.

### Teste pela rota

Existe uma rota de teste em:

- `POST /api/whatsapp/test`

Corpo aceito:

```json
{
  "phone": "5511999999999"
}
```

Ou:

```json
{
  "customerPhone": "5511999999999"
}
```

Resposta esperada em sucesso:

```json
{
  "success": true,
  "provider": "SIMULATED",
  "skipped": false,
  "messageId": "msg_123456789",
  "sentAt": "2026-04-13T12:00:00.000Z"
}
```

## Eventos que disparam mensagens

### Confirmacao do pedido

Dispara quando o pedido e criado.

- Origem: `src/app/api/orders/route.ts`
- Metodo: `WhatsAppService.sendOrderConfirmation(...)`
- Mensagem gerada com:
  - nome do cliente
  - codigo do pedido
  - valor total

### Confirmacao de pagamento

Dispara quando o pagamento Mercado Pago chega como `approved` ou `authorized`.

- Origem: `src/app/api/payments/webhook/route.ts`
- O pedido precisa estar em `PENDING` para virar `CONFIRMED`.
- A mensagem usa:
  - nome do cliente
  - codigo do pedido
  - valor aprovado

### Saida para entrega

Dispara quando o pedido muda para `READY`.

- Origem: `src/app/api/orders/[id]/route.ts`
- So envia se existir telefone valido e endereco do pedido.
- E voltado para pedidos com entrega, nao para retirada.

## Exemplos de payload

### Payload do webhook de teste

A rota de teste do robo chama o envio com este formato:

```json
{
  "phone": "5511999999999"
}
```

### Payload enviado para `WEBHOOK`

Quando o provedor e `WEBHOOK`, o backend envia este corpo:

```json
{
  "phone": "5511999999999",
  "phoneNumber": "5511999999999",
  "text": "Big Night - pedido confirmado\\n\\nOla Joao!\\nRecebemos seu pedido ABC12345.\\nTotal: R$ 42,90\\nEstamos preparando tudo e vamos te avisar das proximas etapas.",
  "message": "Big Night - pedido confirmado\\n\\nOla Joao!\\nRecebemos seu pedido ABC12345.\\nTotal: R$ 42,90\\nEstamos preparando tudo e vamos te avisar das proximas etapas.",
  "type": "ORDER_CONFIRMATION",
  "orderId": "uuid-do-pedido",
  "customerName": "Joao",
  "source": "lanchonete-app",
  "timestamp": "2026-04-13T12:00:00.000Z"
}
```

Headers principais:

```http
Content-Type: application/json
Authorization: Bearer <whatsapp_token>
```

### Payload enviado para `EVOLUTION`

Quando o provedor e `EVOLUTION`, o backend envia para:

```text
POST {whatsapp_api_url}/message/sendText/{whatsapp_instance}
```

Corpo:

```json
{
  "number": "5511999999999",
  "phone": "5511999999999",
  "text": "Big Night - pagamento aprovado\\n\\nJoao, o pagamento do pedido ABC12345 foi confirmado.\\nValor aprovado: R$ 42,90\\nSeu pedido entrou na fila de preparo.",
  "message": "Big Night - pagamento aprovado\\n\\nJoao, o pagamento do pedido ABC12345 foi confirmado.\\nValor aprovado: R$ 42,90\\nSeu pedido entrou na fila de preparo.",
  "customerName": "Joao",
  "type": "PAYMENT_CONFIRMED",
  "orderId": "uuid-do-pedido"
}
```

Headers principais:

```http
Content-Type: application/json
apikey: <whatsapp_token>
Authorization: Bearer <whatsapp_token>
```

## Tutorial operacional para criar o robo

### Opcao 1: criar um robo simples de teste

1. Abra `Admin > Configuracoes`.
2. Ative `Ativar automacao no WhatsApp`.
3. Selecione `SIMULATED`.
4. Preencha um `Telefone de teste`.
5. Clique em `Salvar e testar`.
6. Verifique se o sistema mostra mensagem de sucesso.

### Opcao 2: integrar com seu proprio webhook

1. Suba um endpoint HTTP que aceite `POST`.
2. Configure a URL em `URL da API / webhook`.
3. Se o endpoint exigir autenticacao, preencha `Token de autenticacao`.
4. Selecione `WEBHOOK`.
5. Clique em `Salvar e testar`.
6. No seu endpoint, leia o campo `type` para diferenciar os eventos.

### Opcao 3: integrar com Evolution API

1. Tenha uma instancia valida na Evolution API.
2. Preencha `URL da API / webhook` com a URL base da Evolution.
3. Preencha `Instancia / canal`.
4. Preencha `Token de autenticacao`.
5. Selecione `EVOLUTION`.
6. Clique em `Salvar e testar`.
7. Se o teste falhar, valide a URL, o nome da instancia e o token.

## Checklist de diagnostico

### Se o robo nao envia mensagem

- Confirme que `whatsapp_robot_enabled` esta `true`.
- Confirme que `whatsapp_provider` esta correto.
- Confirme que o telefone informado tem pelo menos 10 digitos.
- Confirme se existe registro em `WhatsAppLog`.
- Verifique se o pedido possui telefone de cliente.
- Verifique se o pedido nao esta sendo ignorado por estar fora do estado esperado.

### Se o webhook falha

- Confirme se `whatsapp_api_url` esta preenchida.
- Confirme se o endpoint aceita `POST`.
- Confirme se o endpoint responde `2xx`.
- Confirme se o `Authorization` ou `token` batem com o esperado.
- Verifique o timeout de 15 segundos.

### Se a Evolution API falha

- Confirme `whatsapp_api_url`.
- Confirme `whatsapp_instance`.
- Confirme `whatsapp_token`.
- Confirme se a rota final fica no formato `/message/sendText/{instance}`.
- Confirme se o token esta como `apikey` e `Bearer`.

### Se a area de atendimento nao aparece para o cliente

- Confirme que os campos foram salvos em `settings`.
- Confirme se o admin mostra os bairros e o texto da regiao apos salvar.
- Recarregue a home publica para buscar os dados atuais.
- Se o cliente nao ve a mudanca, revise a leitura de `delivery_region_label`, `delivery_region_center`, `delivery_region_notes` e `delivery_neighborhoods` na home publica.

### Se o teste funciona, mas os eventos reais nao

- Confirme que o pedido real esta passando pelas rotas corretas.
- Confirme que o pagamento aprovado esta vindo via webhook do Mercado Pago.
- Confirme que o pedido chega a `READY` para disparar saida para entrega.
- Confirme que o pedido possui `customerPhone` valido.

## Resumo rapido

- Use `SIMULATED` para validar o fluxo sem integracao externa.
- Use `WEBHOOK` para conectar n8n, bot proprio ou outro backend.
- Use `EVOLUTION` para integrar com a Evolution API.
- Teste sempre com um numero dedicado.
- A area de atendimento e salva no banco e refletida na home publica.
