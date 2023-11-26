import { throwIfUnset } from "$misc/error";
import type { OpenAiSettings } from "$misc/openai";
import { json, type RequestHandler } from "@sveltejs/kit";
import OpenAI from "openai";
import type { TranslationCreateParams } from "openai/resources/audio/translations";
import { GOOGLE_API_KEY } from "$env/static/private";

import { v2 } from '@google-cloud/translate';

export const POST: RequestHandler = async ({ request, fetch }) => {
    const requestData = await request.json();
    throwIfUnset('request data', requestData);
    const translate = new v2.Translate()
    translate.key = GOOGLE_API_KEY
    const { text } = requestData;
    const target = 'en';
    // const response = await client.translate('Hello, world!', 'en')
    // let translations = [];
    console.log(requestData)
    let result = ''
    async function translateText() {
        // Translates the text into the target language. "text" can be a string for
        // translating a single piece of text, or an array of strings for translating
        // multiple texts.
        let [translations] = await translate.translate(text, target);
        translations = Array.isArray(translations) ? translations : [translations];
        console.log('Translations:');
        translations.forEach((translation, i) => {
            console.log(`${text[i]} => (${target}) ${translation}`);
            result += translation;
        });
    }
    await translateText()
    // const settings: OpenAiSettings = requestData.settings;
    // throwIfUnset('settings', settings);

    // const openAiKey: string = requestData.openAiKey;
    // throwIfUnset('OpenAI API key', openAiKey);
    // const formData = await request.formData()
    // const openAiKey = formData.get('apiKey') as string
    // const audioFile = formData.get('audioFile') as File;

    // const openai = new OpenAI({
    //     apiKey: openAiKey
    // });
    // const completionOpts: TranslationCreateParams = {
    //     file: audioFile,
    //     model: 'whisper-1',
    //     response_format: 'text'
    // };
    // const response = await openai.audio.translations.create(completionOpts);

    // const transcribe = await openai.audio.transcriptions.create({
    //     model: "whisper-1",
    //     file: audioFile,
    //     response_format: "text"
    // })
    // Replace with your actual API key from the Google Cloud Console
    // const apiKey = 'YOUR_API_KEY';

    // const url = 'https://translation.googleapis.com/language/translate/v2';

    // The text to translate

    // Construct the POST request payload
    // const requestBody = {
    //     q: requestData.text,
    //     source: 'it',
    //     target: 'en',
    //     format: 'text'
    // };

    // const { data } = await (await fetch(url, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Accept-Encoding': 'application/gzip',
    //         'X-Goog-Api-Key': GOOGLE_API_KEY
    //     },
    //     body: JSON.stringify(requestBody)
    // })).json()
    // console.log(data)
    // const translation = data.translations[0].translateText;
    // .then(data => {
    //     if (data && data.data && data.data.translations) {
    //         console.log('Translated text:', data.data.translations[0].translatedText);
    //     } else {
    //         console.log('Error in translation:', data);
    //     }
    // })
    // .catch(error => {
    //     console.error('Error:', error);
    // });
    // const tranlations = response[0]


    // return json({ msg: response })
    return json({ translation: result })
}