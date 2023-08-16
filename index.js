const serverless = require("serverless-http");
const line = require('@line/bot-sdk')
const express = require('express')
const axios = require('axios').default

const app = express()

const lineConfig = {
    channelAccessToken: process.env.ACCESS_TOKEN,
    channelSecret: process.env.SECRET_TOKEN
}

const client = new line.Client(lineConfig);

app.get('/', (req, res) => {
    res.send('Call API')
})

app.post('/webhook', line.middleware(lineConfig),async(req,res)=>{
    try {
        const events = req.body.events;
        console.log('event',events);
        return events.length > 0 ? await events.map(item => handleEvent(item)) : res.status(200).send('OK')
    } catch (error) {
        res.status(500).end()        
    }
});

const handleEvent = async (event) => {
    if(event.type === 'message' && event.message.type === 'text'){

        const textInput = event.message.text
        let textLot = textInput.trim().split(' ');
        console.log('textLot',textLot)
        textLot = [textLot[0]]

        textLot.forEach(async text => {
            try {
                const {data} = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`)

                let replyMessage = ''
                
                const word = data[0].word
                const word2 = word.charAt(0).toUpperCase() + word.slice(1);
        
                replyMessage += word2 + '\n' + '\n'
                
                data[0].meanings.forEach(meaning => {
        
                    const partOfSpeech = meaning.partOfSpeech
                    const definitions = meaning.definitions
                    const definition = definitions[0].definition
        
                    const pos = partOfSpeech.charAt(0).toUpperCase() + partOfSpeech.slice(1);
                    const def = definition.charAt(0).toUpperCase() + definition.slice(1);
        
                    replyMessage += pos + ': ' + def + '\n'
                });
                return client.replyMessage(event.replyToken, {type:'text', text:replyMessage});
                
            } catch (error) {
                console.error('Error',error)
                return
            }
        });
    }
}

exports.handler = serverless(app);