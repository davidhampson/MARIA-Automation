const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const mysql = require("mysql");

var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "admin",
    schema: "public",
    database: "maria",
});

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    next();
});

app.get('/', (req, res) => res.send('Index: (no calls yet)'))
app.get('/points', (req, res) => {
    con.query("SELECT * from points", (error, result) => {
        console.log(result||error);
        res.send(result);
    });
});

app.post('/points', (req, res) => {
    con.query("INSERT INTO points (x, y, z, gold_density) VALUES " +
        `(${req.body.x}, ${req.body.y}, ${req.body.z}, ${req.body.gold_density})`, (error, result) => {
        console.log(result||error);
        res.send(result);
    });
    res.send();
});

app.get('/points', (req, res) => {
    con.query("SELECT * FROM points"), (error, result) => {
        console.log(result||error);
        res.send(result);
    });
    res.send();
});

app.put('/settings', (req, res) => {
    con.query(`UPDATE settings SET radial_velocity = ${req.body.radial_velocity}, radial_increment = ${req.body.radial_increment}, z_increment = ${req.body.z_increment} WHERE name = '${req.body.name}'`, (error, result) => {
        console.log(result||error);
        res.send(result);
    });
});

app.get('/settings', (req, res) => {
    
    if (req.query.name) {
        con.query(`SELECT * from settings WHERE name = '${req.query.name}';`, (error, result) => {
            console.log(result||error);
            res.send(result);
        });
    } else {
        con.query("SELECT * from settings", (error, result) => {
            console.log(result||error);
            res.send(result);
        });    
    }
    
    
});

app.post('/settings', (req, res, next) => {
    con.query("INSERT INTO settings (name, radial_velocity, radial_increment, z_increment) VALUES " +
        `('${req.body.name}', ${req.body.radial_velocity}, ${req.body.radial_increment}, ${req.body.z_increment})`,
        (error, result) => {
            console.log(result||error);
            if (error) res.status(500)
            res.send(result||error);
    });
});


app.get('/settings', (req, res) => res.send('Index: (no calls yet)'))

app.post('/settings',(request,response) => {
//code to perform particular action.
//To access POST variable use req.body()methods.
console.log(request.body);
});


app.listen(port, () => console.log(`REST API Started on port ${port}`))
