CREATE DATABASE IF NOT EXISTS maria;
USE maria;
CREATE TABLE sweeps (
   id INT NOT NULL AUTO_INCREMENT,
   timestamp DATETIME DEFAULT NOW(),
   locale_x FLOAT,
   locale_y FLOAT,
   PRIMARY KEY (id)

);

CREATE TABLE points (
    id INT NOT NULL AUTO_INCREMENT,
    x DOUBLE,
    y DOUBLE,
    z DOUBLE,
    gold_density DOUBLE,
    sweep_id INT,
    FOREIGN KEY (sweep_id) REFERENCES sweeps(id),
    PRIMARY KEY (id)
);


CREATE TABLE settings (
    name VARCHAR(50),
    radial_velocity DOUBLE,
    radial_increment DOUBLE,
    z_increment DOUBLE,
    min_distance DOUBLE,
    wall_angle DOUBLE,
    depth_start DOUBLE,
    depth_max DOUBLE,
    angle_start DOUBLE,
    angle_finish DOUBLE,
    PRIMARY KEY (name)
);