import type { RequestHandler } from "@sveltejs/kit";
import OpenAI from "openai";

export const POST: RequestHandler = async ({ request, fetch }) => {
    const { apiKey, msg: input } = await request.json()
    const openai = new OpenAI({ apiKey });

    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return new Response(buffer, {
        headers: {
            'Content-Type': 'audio/mpeg'
        }
    })
}