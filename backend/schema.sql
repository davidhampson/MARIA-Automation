CREATE DATABASE IF NOT EXISTS maria;
USE maria;

CREATE TABLE points (
    id INT NOT NULL AUTO_INCREMENT, 
    x DOUBLE,
    y DOUBLE,
    z DOUBLE,
    gold_density DOUBLE,
    PRIMARY KEY (id) );
    
CREATE TABLE settings (
    name VARCHAR(50),
    radial_velocity DOUBLE,
    radial_increment DOUBLE,
    z_increment DOUBLE,
    PRIMARY KEY (name)
);