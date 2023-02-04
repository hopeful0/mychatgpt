import dotenv from 'dotenv';
import { ChatGPTAPI } from 'chatgpt';
import express from 'express';
import expressWs from 'express-ws';
import morgan from 'morgan';

dotenv.config();

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY not set!");
}
const api = new ChatGPTAPI({ apiKey: API_KEY });


const app = expressWs(express()).app;
const port = process.env.PORT || 3000;

app.use(morgan(process.env.MORGAN_FORMAT || 'combined'));

app.use(express.json());

app.set('views', './src/static');
app.set('view engine', 'pug');
app.get('/', (req, res) => {
    res.render('ws');
});

app.post('/ask', async (req, res) => {
    const text = req.body.text;
    const cid = req.body.cid;
    const mid = req.body.mid;
    const answer = await api.sendMessage(text, {
        conversationId: cid,
        parentMessageId: mid
    });
    res.json(answer);
});

app.ws('/longask', (ws, req) => {
    var cid: string | undefined = undefined;
    var mid: string | undefined = undefined;
    var text = '';
    var handling = false;
    ws.onmessage = async (msg) => {
        if (handling) {
            ws.send('Another message is processing!')
            return;
        }
        text += msg.data;
        if (text.endsWith('\n')) {
            handling = true;
            var offset = 0;
            text = text.substring(0, text.length - 1);
            let answer = await api.sendMessage(text, {
                conversationId: cid,
                parentMessageId: mid,
                onProgress: (part) => {
                    let newdata = part.text.substring(offset);
                    offset += newdata.length;
                    ws.send(newdata);
                }
            });
            ws.send('\u0000');
            cid = answer.conversationId;
            mid = answer.id;
            text = '';
            handling = false;
        }
    }
});

app.listen(port, () => {
    console.log(`App start listen port ${port}`);
});
