import { Mercadopago } from "mercadopago";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not set");
}

export const mpClient = new Mercadopago({
  access_token: accessToken,
});
