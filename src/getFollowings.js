require('dotenv').config();
const fs = require('fs');
const request = require('request');

const TOKEN = process.env.TOKEN;
var FOLLOWERS = []

const populateArr = async (data) => {
    for (index in data) {
        FOLLOWERS.push({id: data[index].to_id, login: data[index].to_login});
    }
    return true;
}


const getNextFollowings = async (id, cursor) => {
    const options = {
        url: 'https://api.twitch.tv/helix/users/follows?from_id='+id+'&first=100&after='+cursor,
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
            console.log('Status next following: ' + res.statusCode);
            resolve(resp);
        })

    })

}

const getFollowings = async (id, callback) => {
    const options = {
        url: 'https://api.twitch.tv/helix/users/follows?from_id='+id+'&first=100',
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
        const b = JSON.parse(body);
        console.log('Status: ' + res.statusCode);
        console.log('Total: '+ b.total + '\nExpect ' + Math.floor(b.total/100) + ' more loops.')
        var cursor = b.pagination.cursor;
        while (cursor !== undefined) {
            var resp = await getNextFollowings(id, cursor);
            cursor = resp.pagination.cursor;
            callback(resp.data);
        }
        callback(b.data);
    })
}

(async function() {
    if (process.argv.length === 3) {
        let rawdata = fs.readFileSync('./json/' + process.argv[2] + '.json');
        let followers = JSON.parse(rawdata);
        followers.forEach((follower, i) => {
            setTimeout(() => {
                console.log('Getting following list of ' + follower.login)
                getFollowings(follower.id, (data) => {
                    populateArr(data).then(fs.writeFile('./json_followings/' + process.argv[2] + '_followings.json', JSON.stringify(FOLLOWERS), () => {}))
                });
            }, i * 2000);
        })
    } else {
        console.log('Usage: \nnode getFollowings.js [filename]');
    }
})();