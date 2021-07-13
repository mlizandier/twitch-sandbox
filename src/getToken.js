require('dotenv').config();
const request = require('request');

const getToken = () => {
    const options = {
        url: 'https://id.twitch.tv/oauth2/token',
        json: true,
        body: {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'client_credentials'
        }
    };

    request.post(options, (err, res, body) => {
        if (err) {
            console.log(err);
        }
        console.log('Status: ' + res.statusCode);
        console.log(body);
    });
};

getToken();