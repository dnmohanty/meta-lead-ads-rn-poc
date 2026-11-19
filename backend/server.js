require('dotenv').config()

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const META_PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN; 

app.get('/', (req, res) => {
  res.status(200).send('Server is running')
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode==='subscribe' && token === META_VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    console.log('WEBHOOK_VERIFICATION_FAILED');
    res.sendStatus(403);
  }
});

async function fetchLeadDetails(leadgenId) {
  try{
    const url = `https://graph.facebook.com/v27.0/${leadgenId}?access_token=${META_PAGE_ACCESS_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log('Lead Details:',JSON.stringify(data, null, 2));
    if(!response.ok){
        console.error('Meta API Error:', data);
        return null;
    }
return data;
  }
catch (error) {
    console.error('Error fetching lead data:', error);
    return null;
}
}

app.post('/webhook', async (req, res) => {
  if(req.body.object !== 'page') {
    return res.sendStatus(400);
  }
try{
  for(const entry of req.body.entry || []) {
    for(const change of entry.changes || []) {
      if(change.field === 'leadgen') {
        const leadgenId = change.value.leadgen_id;
        console.log('Received leadgen_id:', leadgenId);
        await fetchLeadDetails(leadgenId);
      }
    }
  }
}
catch (error) {
  console.error('Error processing webhook:', error);
}
res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});