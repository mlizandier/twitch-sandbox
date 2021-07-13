require('dotenv').config();
const fs = require('fs');
const process = require('process');
const request = require('request');

const TOKEN = process.env.TOKEN;
var FOLLOWERS = []

const getToken = (url, callback) => {
    const options = {
        url: url,
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

        callback(res);
    });
};

const populateArr = async (data) => {
    for (index in data) {
        FOLLOWERS.push({id: data[index].from_id, login: data[index].from_login});
    }
    return true;
}


const getId = async (login) => {
    const options = {
        url: 'https://api.twitch.tv/helix/users?login='+login,
        method: 'GET',
        headers: {
            'Client-Id': process.env.CLIENT_ID,
            'Authorization': 'Bearer ' + TOKEN
        }
    };
    return new Promise((resolve, reject) => {
        request.get(options, (err, res, body) => {
            if (err) {
                reject(err);
            }
            resolve(JSON.parse(body).data[0].id);
        });
    });
};

const getNextFollowers = async (id, cursor) => {
    const options = {
        url: 'https://api.twitch.tv/helix/users/follows?to_id='+id+'&first=100&after='+cursor,
        method: 'GET',
        headers: {
            'Client-Id': process.env.CLIENT_ID,
            'Authorization': 'Bearer ' + TOKEN
        }
    };
    return new Promise((resolve, reject) => {

        request.get(options, (err, res, body) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            const resp = JSON.parse(body);
            console.log('Status: ' + res.statusCode);
            resolve(resp);
        })

    })

}

const getFollowers = async (login, callback) => {
    const id = await getId(login);
    const options = {
        url: 'https://api.twitch.tv/helix/users/follows?to_id='+id+'&first=100',
        method: 'GET',
        headers: {
            'Client-Id': process.env.CLIENT_ID,
            'Authorization': 'Bearer ' + TOKEN
        }
    };

    request.get(options, async (err, res, body) => {
        if (err) {
            console.log(err);
        }
        const test = []
        const b = JSON.parse(body);
        console.log('Status: ' + res.statusCode);
        var cursor = b.pagination.cursor;
        while (cursor !== undefined) {
            var resp = await getNextFollowers(id, cursor);
            cursor = resp.pagination.cursor;
            callback(resp.data);
        }
        callback(b.data);
    })
}

getFollowers(process.argv[2], (data) => {
    populateArr(data).then(fs.writeFile('./json/' + process.argv[2] + '.json', JSON.stringify(FOLLOWERS), () => {console.log('done')}))
});