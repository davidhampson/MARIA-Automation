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
app.use(bodyParser.json({limit: '50mb'}));

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

    let sweep_id = null;
    let point = req.body[0]; // first point is origin
    con.query("INSERT INTO sweeps (locale_x, locale_y) VALUES " +
        `(${point.x}, ${point.y})`, (error, result) => {
        sweep_id = result['insertId'];
        console.log("Insert sweep: ");
        console.log(result||error);
        let query = "INSERT INTO points (x, y, z, grade, sweep_id) VALUES ";
        let counter = 0;
        for (let point of req.body) {
            let grade = point.grade??0;
            query += `(${point.x}, ${point.y}, ${point.z}, ${grade}, ${sweep_id})`
            counter ++
            if (counter !== req.body.length) query += ", ";
        }

        con.query(query, (error, result) => {
            console.log("Insert points: ");
            console.log(result||error);
            result['sweep_id']= sweep_id;
            res.send(result);
        });
    });
});

app.put('/settings', (req, res) => {
    con.query("UPDATE settings SET " +
               `radial_velocity = ${req.body.radial_velocity}, ` +
               `radial_increment = ${req.body.radial_increment}, ` +
               `z_increment = ${req.body.z_increment}, ` +
               `min_distance = ${req.body.min_distance}, ` +
               `depth_start = ${req.body.depth_start}, ` +
               `depth_max = ${req.body.depth_max}, ` +
               `angle_start = ${req.body.angle_start}, ` +
               `angle_finish = ${req.body.angle_finish}, ` +
               `wall_angle = ${req.body.wall_angle} ` +
                `WHERE name = '${req.body.name}'`, (error, result) => {
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
    con.query("INSERT INTO settings (name, radial_velocity, radial_increment, z_increment, min_distance, wall_angle, depth_start, depth_max, angle_start, angle_finish) VALUES " +
        `('${req.body.name}', ${req.body.radial_velocity}, ${req.body.radial_increment}, ${req.body.z_increment}, ${req.body.min_distance},${req.body.wall_angle},${req.body.depth_start},${req.body.depth_max},${req.body.angle_start},${req.body.angle_finish})`,
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
