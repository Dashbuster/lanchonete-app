import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const settingsUpsertSchema = z.array(
  z.object({
    key: z.string().min(1, 'Chave é obrigatória'),
    value: z.string().min(1, 'Valor é obrigatório'),
  })
);

const singleSettingSchema = z.object({
  key: z.string().min(1, 'Chave é obrigatória'),
  value: z.string().min(1, 'Valor é obrigatório'),
});

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });

    // Return as a map for easier consumption
    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return handleUpsert(request);
}

export async function PUT(request: Request) {
  return handleUpsert(request);
}

async function handleUpsert(request: Request) {
  try {
    const body = await request.json();

    // Support both single object and array of objects
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
          { error: 'Dados inválidos', details: 'Esperado objeto ou array de {key, value}' },
          { status: 400 }
        );
      }
    }

    // Upsert each setting
    const results = await Promise.all(
      entries.map(async ({ key, value }) => {
        const setting = await prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
        return setting;
      })
    );

    const settingsMap: Record<string, string> = {};
    for (const setting of results) {
      settingsMap[setting.key] = setting.value;
    }

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Error upserting settings:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}
