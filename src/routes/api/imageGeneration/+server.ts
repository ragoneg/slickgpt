import { json, type RequestHandler } from "@sveltejs/kit";
import OpenAI from "openai";

export const POST: RequestHandler = async ({ request, fetch }) => {
    const { apiKey, msg } = await request.json()
    // const formData = await request.formData()
    // const apiKey = formData.get('apiKey') as string
    // const audioFile = formData.get('imageFile') as File;
    const openai = new OpenAI({ apiKey });
    // console.log(audio_file)
    // audio_file = open("speech.mp3", "rb")
    console.log(msg)
    const response = await openai.images.generate({
        model: "dall-e-2",
        prompt: msg,
        n: 1,
        size: "512x512",
    });
    console.log(response)
    const { data } = response
    // image_url = response.data.data[0].url;
    // const msg = ''
    // const buffer = Buffer.from(await mp3.arrayBuffer());
    // return new Response(buffer, {
    //     headers: {
    //         'Content-Type': 'audio/mpeg'
    //     }
    // })
    // console.log(vision_text.choices[0].message.content)
    // return json({ msg: vision_text })
    return json(data)
}