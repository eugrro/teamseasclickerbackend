var express = require('express')
var cors = require('cors');
var bodyParser = require('body-parser')
var app = express();
app.use(cors())
var jsonParser = bodyParser.json()

const fs = require('fs');
const dbName = './db.json';
const lbName = './leaderboard.json';
const fpName = './fingerprint.json';

var port = 3000;

function addClick(data) {
    var file_content = fs.readFileSync(dbName);
    var allData = JSON.parse(file_content);
    allData.clicks += 1;
    data.name = data.name.toLowerCase()
    presses = allData.presses;
    if (presses[data.ip] != null) {
        user = presses[data.ip]
        if (user[data.name] != null) {
            user[data.name] += 1
        } else {
            user[data.name] = 0
        }
    } else {
        var newObj = {};
        newObj[data.name] = 0
        presses[data.ip] = newObj;
    }
    fs.writeFileSync(dbName, JSON.stringify(allData), function writeJSON(err) {
        if (err) return console.log(err);
    })
    //fs.close(file_content);
}
app.listen(port, () => {
    console.log(`App listening at http://192.168.86.21:${port}`)
})

app.get('/', function (req, res) {
    res.send({ running: true })
})
function validClick(data) {
    var file_content = fs.readFileSync(fpName);
    var allData = JSON.parse(file_content);
    if (allData[data.ip] == null) {
        allData[data.ip] = data.fingerprint;
        fs.writeFileSync(fpName, JSON.stringify(allData), function writeJSON(err) {
            if (err) return console.log(err);
        })
        return true;
    } else if (allData[data.ip] != null && allData[data.ip] == data.fingerprint) {
        return true;
    }
    else {
        return false;
    }
}
app.post('/countClick', jsonParser, function (req, res) {
    console.log("Adding Click");
    data = req.body;
    if (validClick(data)) {
        addClick(data)
        res.send({ "Click Counted": true });

    } else {
        res.send({ "Click Counted": false });

    }
})
app.get('/getClicks', function (req, res) {

    var file_content = fs.readFileSync(dbName);
    var allData = JSON.parse(file_content);
    console.log("Got Clicks " + allData["clicks"])
    res.send({ numClicks: allData["clicks"] })
})
function updateLeaderBoard() {
    var leaderboard = {}
    var file_content = fs.readFileSync(dbName);
    var allData = JSON.parse(file_content);
    var v = allData["presses"];

    for (const [key, v_] of Object.entries(v)) {
        for (const [key2, value2] of Object.entries(v_)) {
            if (leaderboard[key2] == null) {
                leaderboard[key2] = value2;
            } else {
                leaderboard[key2] += value2;
            }
        }
    }

    var items = Object.keys(leaderboard).map(function (key) {
        return [key, leaderboard[key]];
    });

    // Sort the array based on the second element
    items.sort(function (first, second) {
        return second[1] - first[1];
    });

    // Create a new array with only the first 5 items
    var size = items.length;
    var numItems = 5;
    var lb = items.slice(0, size < numItems ? size : numItems);
    fs.writeFileSync(lbName, JSON.stringify(lb), function writeJSON(err) {
        if (err) return console.log(err);
    })
}
app.get('/getLeaderboard', function (req, res) {
    updateLeaderBoard();
    var file_content = fs.readFileSync(lbName);
    res.send(JSON.parse(file_content));

})
