import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

const ALLOWED_SETTING_KEYS = [
  "delivery_fee",
  "min_order_value",
  "accepts_pickup",
  "store_open",
  "store_day_hours",
  "payment_pix",
  "payment_credit_card",
  "payment_debit_card",
  "payment_cash",
  "payment_on_site",
  "delivery_radius_km",
  "delivery_region_label",
  "delivery_region_center",
  "delivery_region_notes",
  "delivery_neighborhoods",
  "whatsapp",
  "instagram",
  "whatsapp_robot_enabled",
  "whatsapp_provider",
  "whatsapp_enabled",
  "whatsapp_mode",
  "whatsapp_api_url",
  "whatsapp_instance",
  "whatsapp_token",
  "whatsapp_meta_phone_number_id",
  "whatsapp_test_phone",
  "whatsapp_phone",
  "whatsapp_api_key",
  "whatsapp_timeout",
  "whatsapp_retry_limit",
  "store_name",
  "store_logo",
  "store_description",
  "whatsapp_phone",
  "mercadopago_enabled",
  "mercadopago_public_key",
] as const;

const settingKeySchema = z.string().refine(
  (key) => (ALLOWED_SETTING_KEYS as readonly string[]).includes(key),
  { message: `Chave de configuracao invalida. Chaves validas: ${ALLOWED_SETTING_KEYS.join(", ")}` }
);

const settingEntrySchema = z.object({
  key: settingKeySchema,
  value: z.string(),
});

const settingsUpsertSchema = z.array(settingEntrySchema);

const singleSettingSchema = settingEntrySchema;

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: "asc" },
    });

    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configuracoes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  return handleUpsert(request);
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  return handleUpsert(request);
}

async function handleUpsert(request: NextRequest) {
  try {
    const body = await request.json();
    let entries: { key: string; value: string }[];

    const arrayValidation = settingsUpsertSchema.safeParse(body);
    if (arrayValidation.success) {
      entries = arrayValidation.data;
    } else {
      const singleValidation = singleSettingSchema.safeParse(body);
      if (singleValidation.success) {
        entries = [singleValidation.data];
      } else {
        return NextResponse.json(
          { error: "Dados invalidos", details: "Esperado objeto ou array de {key, value}" },
          { status: 400 }
        );
      }
    }

    const results = await Promise.all(
      entries.map(async ({ key, value }) => {
        return prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      })
    );

    const settingsMap: Record<string, string> = {};
    for (const setting of results) {
      settingsMap[setting.key] = setting.value;
    }

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Error upserting settings:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configuracoes" },
      { status: 500 }
    );
  }
}
