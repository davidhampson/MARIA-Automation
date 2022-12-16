CREATE DATABASE IF NOT EXISTS maria;
USE maria;

CREATE TABLE points (
    id INT NOT NULL AUTO_INCREMENT, 
    x DOUBLE,
    y DOUBLE,
    z DOUBLE,
    gold_density DOUBLE,
    sweep_id BIGINT,
    PRIMARY KEY (id) );

CREATE TABLE sweeps (
   id INT NOT NULL AUTO_INCREMENT,
   timestamp DATETIME DEFAULT NOW()
   locale_x FLOAT;
   locale_y FLOAT;
)
CREATE TABLE settings (
    name VARCHAR(50),
    radial_velocity DOUBLE,
    radial_increment DOUBLE,
    z_increment DOUBLE,
    PRIMARY KEY (name)
);