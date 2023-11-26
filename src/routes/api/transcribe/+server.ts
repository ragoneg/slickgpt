import { json, type RequestHandler } from "@sveltejs/kit";
import OpenAI from "openai";

export const POST: RequestHandler = async ({ request, fetch }) => {
    const formData = await request.formData()
    const apiKey = formData.get('apiKey') as string
    const audioFile = formData.get('audioFile') as File;
    const openai = new OpenAI({ apiKey });


    // const transcribe = await openai.audio.transcriptions.create({
    //     model: "whisper-1",
    //     file: audioFile,
    //     response_format: "text"
    // })
    const transcribe = 'good'
    console.log(transcribe)
    return json({ msg: transcribe })
}