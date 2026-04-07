import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not set");
}

const client = new MercadoPagoConfig({
  accessToken,
});

export const mpClient = client;
export const mpPayment = new Payment(client);
export const mpPreference = new Preference(client);
