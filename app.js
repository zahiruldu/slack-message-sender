const express = require('express');
require('dotenv').config({ debug: process.env.DEBUG })
const formidable = require('formidable');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri =  process.env.REDIRECT_URL;
const access_token = process.env.ACCESS_TOKEN;

const scope = 'chat:write:bot, chat:write:user,channels:read';


app.get('/', async (req, res)=>{

  const text = `
  <a href="https://slack.com/oauth/authorize?scope=${scope}&client_id=${client_id}&redirect_uri=${redirect_uri}"><img src="https://api.slack.com/img/sign_in_with_slack.png" /></a>
  `

  if(req.query.code) {

   const result = await axios.get('https://slack.com/api/oauth.access',{ params: {
      client_id:  client_id,
      client_secret: client_secret,
      code: req.query.code,
      redirect_uri: redirect_uri
    }});
    
    if(result.data.ok){
      code = result.data.access_token;

      res.end('Access_Token: ' + code);
    }

    res.send(text);

  } else {

  res.send(text);
  }
});


app.get('/message',(req, res)=>{

  const text = `
    <div class="form-header">
    <h2>Send Slack message</h2>
    </div>
    <form method="post" action="/message" novalidate>
      <div class="form-field">
        <label for="message">Message</label>
        <textarea class="input" id="message" name="message" rows="4" autofocus></textarea>
      </div>
      <div class="form-field">
        <label for="email">Channel Name</label>
        <input class="input" id="channel" name="channel" type="text" value="" />
      </div>
      <div class="form-actions">
        <button class="btn" type="submit">Send</button>
      </div>
    </form>
  `;

  res.writeHead(200, {'content-type': 'text/html'});
  res.end(text);
});

app.post('/message',(req, res)=>{

  if (req.url == '/message' && req.method.toLowerCase() == 'post') {

    var form = new formidable.IncomingForm();

    form.parse(req, async function(err, fields, files) {
      if (err) {
        console.error(err.message);
        res.redirect('message');
      }

     const result = await axios({ 
            method: 'post',
            url: 'https://slack.com/api/chat.postMessage',
            headers: {
              'Authorization': `Bearer ${access_token}`
            },
            data: {
              text: fields.message,
              channel: fields.channel,
              as_user: true
            }
     });

          // console.log('result', result.data)

      res.redirect('message');
    });
    
  }
})

app.get('/channels', async (req, res)=>{

  const result = await axios({ 
            method: 'get',
            url: 'https://slack.com/api/channels.list',
            headers: {
              'Authorization': `Bearer ${access_token}`
            }
     });

     console.log('result',result.data.channels)
     const channels = result.data.channels.map((chn)=>{
       return {
         id: chn.id,
         name: chn.name
       }
     });

     res.end(JSON.stringify(channels))
});


app.listen(PORT, ()=>{
  console.log('listening to port:',PORT)
})