import dotenv from 'dotenv';
import { ChatGPTAPI } from 'chatgpt';
import express from 'express';

dotenv.config();

const API_KEY = process.env.OPENAI_API_KEY
if (!API_KEY) {
    throw new Error("API_KEY not set!")
}
const api = new ChatGPTAPI({ apiKey: API_KEY })


const app = express()
const port = process.env.PORT || 3000;

app.use(express.json())

app.set('views', './src/static')
app.set('view engine', 'pug')
app.get('/', (req, res) => {
    res.render('index')
})

app.post('/ask', async (req, res) => {
    const text = req.body.text;
    const cid = req.body.cid;
    const mid = req.body.mid;
    const answer = await api.sendMessage(text, {
        conversationId: cid,
        parentMessageId: mid
    });
    res.json(answer);
})

app.listen(port, () => {
    console.log(`App start listen port ${port}`);
})
