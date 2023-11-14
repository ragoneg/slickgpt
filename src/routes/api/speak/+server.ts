import type { RequestHandler } from "@sveltejs/kit";
import OpenAI from "openai";

export const POST: RequestHandler = async ({ request, fetch }) => {
    const { apiKey, input } = await request.json()
    const openai = new OpenAI({ apiKey });

    const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input, response_format: "mp3"
    });
    // const buffer = Buffer.from(await mp3.arrayBuffer());
    return new Response(response.body, {
        headers: {
            'Content-Type': 'audio/mpeg'
        }
    });
}