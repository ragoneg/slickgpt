import { json, type RequestHandler } from "@sveltejs/kit";
import OpenAI from "openai";

export const POST: RequestHandler = async ({ request, fetch }) => {
    const { apiKey, imageFile, text } = await request.json()
    // const formData = await request.formData()
    // const apiKey = formData.get('apiKey') as string
    // const audioFile = formData.get('imageFile') as File;
    const openai = new OpenAI({ apiKey });
    // console.log(audio_file)
    // audio_file = open("speech.mp3", "rb")

    const url = imageFile
    // const vision_text = url;
    const vision_text = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text },
                    {
                        type: "image_url",
                        image_url: {
                            url
                            //   url: f"data:image/jpeg;base64,{base64_image}"
                        }
                    },
                ],
            },
        ],
    })
    // const msg = ''
    // const buffer = Buffer.from(await mp3.arrayBuffer());
    // return new Response(buffer, {
    //     headers: {
    //         'Content-Type': 'audio/mpeg'
    //     }
    // })
    console.log(vision_text.choices[0].message.content)
    return json({ msg: vision_text })
}