import { NextRequest, NextResponse } from "next/server";
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

interface SurpriseBody {
  theme: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SurpriseBody;
    const theme = body.theme?.trim();
    if (!theme) {
      return NextResponse.json({ error: "Missing theme" }, { status: 400 });
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
        { error: "No tool_use block in response" },
        { status: 500 }
      );
    }
    const input = toolBlock.input as { scenes?: string[] };
    const scenes = (input.scenes ?? [])
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 12);

    if (scenes.length < 12) {
      return NextResponse.json(
        { error: `Expected 12 scenes, got ${scenes.length}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ theme, scenes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Surprise failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
