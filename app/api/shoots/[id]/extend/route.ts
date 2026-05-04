import { NextRequest, NextResponse } from "next/server";
import {
  readBase,
  writeBase,
  writeImageState,
  type ShootBase,
} from "@/lib/storage";
import { getPack } from "@/lib/packs";
import { getAnthropic, SCENE_MODEL } from "@/lib/anthropic";
import {
  SURPRISE_SYSTEM_PROMPT,
  SCENE_TOOL_NAME,
  SCENE_TOOL_INPUT_SCHEMA,
  buildSurpriseUserMessage,
} from "@/lib/surprisePrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EXTEND_COUNT = 4;

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const base = await readBase(id);
  if (!base) {
    return NextResponse.json({ error: "Shoot not found" }, { status: 404 });
  }

  let newScenes: string[] = [];

  if (base.mode === "pack") {
    if (!base.packId) {
      return NextResponse.json({ error: "Pack id missing" }, { status: 400 });
    }
    const pack = getPack(base.packId);
    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }
    const start = base.prompts.length % pack.scenes.length;
    for (let i = 0; i < EXTEND_COUNT; i++) {
      newScenes.push(pack.scenes[(start + i) % pack.scenes.length]);
    }
  } else if (base.mode === "surprise") {
    const theme = base.surpriseTheme?.trim();
    if (!theme) {
      return NextResponse.json({ error: "Theme missing" }, { status: 400 });
    }
    const client = getAnthropic();
    if (!client) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY missing on server" },
        { status: 500 }
      );
    }
    const msg = await client.messages.create({
      model: SCENE_MODEL,
      max_tokens: 4096,
      system: SURPRISE_SYSTEM_PROMPT,
      tools: [
        {
          name: SCENE_TOOL_NAME,
          description: "Submit the final list of 12 scene prompts.",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input_schema: SCENE_TOOL_INPUT_SCHEMA as any,
        },
      ],
      tool_choice: { type: "tool", name: SCENE_TOOL_NAME },
      messages: [{ role: "user", content: buildSurpriseUserMessage(theme) }],
    });
    const toolBlock = msg.content.find((c) => c.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return NextResponse.json(
        { error: "Claude returned no tool_use block" },
        { status: 500 }
      );
    }
    const input = toolBlock.input as { scenes?: string[] };
    const all = (input.scenes ?? []).map((s) => String(s).trim()).filter(Boolean);
    const used = new Set(base.prompts);
    newScenes = all.filter((s) => !used.has(s)).slice(0, EXTEND_COUNT);
    if (newScenes.length < EXTEND_COUNT) {
      newScenes = [
        ...newScenes,
        ...all.slice(0, EXTEND_COUNT - newScenes.length),
      ];
    }
  } else {
    return NextResponse.json(
      { error: "Custom mode cannot be extended automatically — add scenes manually." },
      { status: 400 }
    );
  }

  if (newScenes.length === 0) {
    return NextResponse.json({ error: "No scenes to add" }, { status: 500 });
  }

  const startIndex = base.prompts.length;
  const updatedBase: ShootBase = {
    ...base,
    prompts: [...base.prompts, ...newScenes],
  };
  await writeBase(updatedBase);

  await Promise.all(
    newScenes.map((_, i) =>
      writeImageState(id, {
        index: startIndex + i,
        generationId: null,
        state: "queued",
        url: null,
        cdnUrl: null,
        variants: [],
      })
    )
  );

  return NextResponse.json({
    startIndex,
    count: newScenes.length,
    indices: newScenes.map((_, i) => startIndex + i),
  });
}
