import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

let _payment: Payment | null = null;
let _preference: Preference | null = null;
let _client: MercadoPagoConfig | null = null;

function getClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not set");
  }
  if (!_client) {
    _client = new MercadoPagoConfig({ accessToken });
  }
  return _client;
}

export function getMpPayment() {
  if (!_payment) {
    _payment = new Payment(getClient());
  }
  return _payment;
}

export function getMpPreference() {
  if (!_preference) {
    _preference = new Preference(getClient());
  }
  return _preference;
}

// Backwards-compatible re-exports (lazy)
export const mpClient = {
  get client() { return getClient(); },
};
export const mpPayment = new Proxy({} as Payment, {
  get(_, prop) {
    return Reflect.get(getMpPayment(), prop);
  },
});
export const mpPreference = new Proxy({} as Preference, {
  get(_, prop) {
    return Reflect.get(getMpPreference(), prop);
  },
});
