<template>
  <div @mouseup="clicking = false" @mousedown="clicking=true">
    <div class="page">
      <div class="leftBar">
          <fieldset class="settings">
            <legend>Control Parameters</legend>
            <span>
            <select v-model="selectedSettings">
              <option v-for="setting in settings" :value="setting" :key="setting.name">{{ setting.name }}</option>
            </select>
            <button class="save" :disabled="!hasChanges || selectedSettings.name == null" @click="saveSettings">Save</button>
            <button class="save" @click="saveNewSettings">New</button>
            </span>
            <span>
              <label>Radial velocity</label>
              <UpdateOnBlur v-model="selectedSettings.radial_velocity"/>
            </span>
            <span>
              <label>Radial increment</label>
              <UpdateOnBlur v-model="selectedSettings.radial_increment"/>
            </span>
            <span>
              <label>Z increment</label>
              <UpdateOnBlur v-model="selectedSettings.z_increment"/>
            </span>
            <span>
              <label>Depth start</label>
              <UpdateOnBlur v-model="selectedSettings.depth_start"/>
            </span>
            <span>
              <label>Max depth</label>
              <UpdateOnBlur v-model="selectedSettings.depth_max"/>
            </span>
            <span>
              <label>Wall angle</label>
              <UpdateOnBlur v-model="selectedSettings.wall_angle"/>
            </span>
            <span>
              <label>Min distance</label>
              <UpdateOnBlur v-model="selectedSettings.min_distance"/>
            </span>
            <span>
              <label>Origin X</label>
              <UpdateOnBlur v-model="originX"/>
            </span>
            <span>
              <label>Origin Y</label>
              <UpdateOnBlur v-model="originY"/>
            </span>
            <span>
              <label>Origin Z</label>
              <UpdateOnBlur v-model="originZ"/>
            </span>
            <span>
              <label>Origin Angle</label>
              <UpdateOnBlur v-model="originAngle"/>
            </span>

            <button class="start" @click="digTrench">Start Sweep</button>
            <button @click="previewTrench">Preview Sweep</button>
            <button @click="saveSweep">Save Sweep</button>
            <button class="stop" @click="clearTimer">Emergency Lift</button>
          </fieldset>
          <div class="console">
            <div v-for="text in consoleText" :key="text">{{ text }}</div>
          </div>
      </div>
      <div class="graphs">
        <!--      <button @click="drawPlot">Topographical</button>
              <button @click="drawScatterPlot">Scatter</button>-->
        <div id="plot"/>
      </div>

      <div class="rightBar">
        <fieldset class="params">
          <legend>Device State</legend>
          <span>
        <label>Latitude</label>
        <input v-model="state.lat"/>
      </span>
          <span>
        <label>Longitude</label>
        <input v-model="state.long"/>
      </span>
          <span>
        <label>Angle</label>
        <input v-model="state.angle"/>
      </span>
          <span>
        <label>Depth</label>
        <input v-model="state.depth"/>
      </span>
        </fieldset>

        <fieldset class="params">
          <legend>Intelligent Sweep</legend>
          <span>
          <label>Angle start</label>
          <UpdateOnBlur v-model="selectedSettings.angle_start"/>
          </span>
          <span>
          <label>Angle finish</label>
          <UpdateOnBlur v-model="selectedSettings.angle_finish"/>
        </span>
          <button @disabled="dataPoints.length === 0" @click="horizons = computeHorizons()">
            Compute Horizons
          </button>
<!--
          <button @click="loadSweep">Load Points</button>
-->
          <button @click="previewTrench">Preview Sweep</button>
          <table class="depthTable" v-show="horizons.length !== 0">
            <thead>
            <tr>
              <th>Depth</th>
              <th>Avg. Grade</th>
            </tr>
            </thead>
            <tbody>
            <tr><td colspan="2" display="flex"></td></tr>
            <tr v-for="horizon in horizons" :key="horizon.depthMin"
                @click="setHorizon(horizon.depthMax,horizon.depthMin)">
              <td>{{ horizon.depthMax }}</td>
              <td>{{ horizon.average }}</td>
            </tr>

            </tbody>
          </table>
          <button v-show="filterChanged" class="stop" @click="filter = (x)=>x; filterChanged=false">Clear filter</button>

        </fieldset>
      </div>
    </div>
  </div>
</template>

<script>
import Plotly from 'plotly.js-dist';
/*
import d3 from '@plotly/d3';
*/
import axios from 'axios'
import UpdateOnBlur from '@/components/UpdateOnBlur'
import _ from 'underscore';

const SHAPES = [
  'circle', 'square', 'x', 'diamond', 'cross', 'triangle'
];
const CRANE_ARM_LENGTH = 50;
const settingsTemplate = {
  name: null,
  radial_velocity: null,
  radial_increment: null,
  z_increment: null,
  min_distance: null, // from crane
  wall_angle: null,
  depth_start: null,
  depth_max: null,
  angle_start: null,
  angle_finish: null,
};

export default {
  name: 'DashboardView',
  props: {},
  components: {UpdateOnBlur},
  data() {
    return {
      consoleText: [],
      selectedSettings: _.extend({}, settingsTemplate),
      selectedSettingsOldVal: _.extend({}, settingsTemplate),
      settings: [],
      dataPoints: {
        "Preview Sweep": [],
        "Active Sweep": [],
        "Area Data": [],
      },
      clicking: false,
      state: {
        lat: 0,
        long: 0,
        angle: 0,
        depth: 0,

      },
      currentRenderPoint: 1,
      horizons: [],
      originX: 0,
      originY: 50,
      originZ: 0,
      originAngle: 0,
      filter: x => x,
      filterChanged: false
    }
  },
  watch: {
    selectedSettings() {
      this.writeConsole(`Loaded ${this.selectedSettings.name} settings`);
      this.selectedSettingsOldVal = _.extend({}, this.selectedSettings);
    },
    'selectedSettings.radial_velocity'(newval, oldval) {
      this.selectedSettings.radial_velocity = parseFloat(newval);
      this.reportChange("Radial velocity", newval, oldval);
    },
    'selectedSettings.radial_increment'(newval, oldval) {
      this.selectedSettings.radial_increment = parseFloat(newval);
      this.reportChange("Radial increment", newval, oldval);
    },
    'selectedSettings.z_increment'(newval, oldval) {
      this.selectedSettings.z_increment = parseFloat(newval);
      this.reportChange("Z increment", newval, oldval);
    },
    'selectedSettings.min_distance'(newval, oldval) {
      this.selectedSettings.min_distance = parseFloat(newval);
      this.reportChange("Minimum distance", newval, oldval);
    },
    'selectedSettings.wall_angle'(newval, oldval) {
      this.selectedSettings.wall_angle = parseFloat(newval);
      this.reportChange("Wall angle", newval, oldval);
    },
    'selectedSettings.depth_start'(newval, oldval) {
      this.selectedSettings.depth_start = parseFloat(newval);
      this.reportChange("Depth start", newval, oldval);
    },
    'selectedSettings.depth_max'(newval, oldval) {
      this.selectedSettings.depth_max = parseFloat(newval);
      this.reportChange("Max depth", newval, oldval);
    },
    'selectedSettings.angle_start'(newval, oldval) {
      this.selectedSettings.angle_start = parseFloat(newval);
      this.reportChange("Angle start", newval, oldval);
    },
    'selectedSettings.angle_finish'(newval, oldval) {
      this.selectedSettings.angle_finish = parseFloat(newval);
      this.reportChange("Angle finish", newval, oldval);
    },
    filter() {
      this.drawScatterPlot(this.dataPoints);
    },/*
    dataPoints() {
      this.drawScatterPlot(this.displayPoints);
    },
    'dataPoints.Active Sweep'() {
      alert("updated active sweep");
      this.drawScatterPlot(this.displayPoints);
    }*/
  },
  computed: {
    hasChanges() {
      return !_.isEqual(this.selectedSettings, this.selectedSettingsOldVal);
    },
    origin() {
      return [parseFloat(this.originX), parseFloat(this.originY), parseFloat(this.originZ), parseFloat(this.originAngle)];
    }
  },
  mounted() {
    document.title = 'MARIA | Dashboard';
    this.loadSettings();
    this.loadSweep();
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
  methods: {
    setHorizon(dMin,dMax) {
      this.filterChanged = true;
      this.filter=(x)=>x.z <= dMin && x.z > dMax;
      this.selectedSettings.depth_max = dMax;
    },
    computeHorizons() {
      let z = this.selectedSettings.z_increment;
      let dStart = this.selectedSettings.depth_start;
      let dMax = this.runPlotWithSettings()['depth_max'];
      let table = [];

      //TODO order by z, then get slices at indexes where it changes

      for (let search = dStart; search > dMax; search -= z) {

        let depthMax = search;
        let depthMin = search - z;

        let sample = _.filter(this.dataPoints['Area Data'], (p) => {
          return p.z <= depthMax && p.z > depthMin;
        });
        if (!sample.length) continue;
        let record = {
          sample,
          average: (_.reduce(sample, (m, s) => m + parseFloat(s.grade), 0) / sample.length).toFixed(2),
          depthMin,
          depthMax
        }
        table.push(record);
      }

      if (table === []) alert("No horizons generated (no data)");
      return _.sortBy(table, (x) => (-x['average'] * 100) + (-x['depthMin'] / 100));
    },
    reportChange(field, newval, oldval) {
      if (oldval == null) return;
      this.writeConsole(`${field} changed from ${oldval} to ${newval}`);
    },
    saveNewSettings() {
      this.selectedSettings.name = prompt("Name?");
      axios.post('//localhost:3000/settings', this.selectedSettings).then(() => {
        this.writeConsole(`Saved new settings ${this.selectedSettings.name}`);
        this.selectedSettingsOldVal = _.extend({}, this.selectedSettings); //TODO return value from endpoint and set it that way?
      });
    },
    saveSettings() {
      if (this.selectedSettings.name === null) this.selectedSettings.name = prompt("Name?");
      axios.put('//localhost:3000/settings', this.selectedSettings).then(() => {
        this.writeConsole(`Saved settings ${this.selectedSettings.name}`);
        this.selectedSettingsOldVal = _.extend({}, this.selectedSettings); //TODO return value from endpoint and set it that way?
      });
    },
    loadSettings() {
      axios.get('//localhost:3000/settings').then((result) => {
        this.settings = result.data;
        if (this.settings.length > 0) {
          this.selectedSettings = this.settings[0];
        }
      });
    },
    loadSweep() {
      axios.get('//localhost:3000/points', this.origin).then((response) => {
        this.dataPoints["Area Data"] = response.data;
        this.drawScatterPlot(this.dataPoints);
      });
    },
    saveSweep() {
      axios.post('//localhost:3000/points', this.dataPoints['Active Sweep']).then((response) => {
        this.writeConsole("Sweep saved as " + response.data.sweep_id);
      });
    },
    writeConsole(text) {
      let date = new Date();
      this.consoleText.push(`[${date.toLocaleTimeString()}]: ${text}`);
    },
    runPlotWithSettings(preview=true) {
      return this.plotTrench(
          this.origin,
          this.selectedSettings.z_increment,
          this.selectedSettings.radial_increment,
          this.selectedSettings.radial_velocity,
          this.selectedSettings.depth_start,
          this.selectedSettings.depth_max,
          this.selectedSettings.angle_start,
          this.selectedSettings.angle_finish,
          this.selectedSettings.min_distance,
          CRANE_ARM_LENGTH,
          this.selectedSettings.wall_angle,
          preview
      );
    },
    previewTrench() {
      //this.filter = (x) => x;
      let sweep = this.runPlotWithSettings();
      this.writeConsole('Generating data.');
      this.dataPoints['Preview Sweep'] = sweep['points'];
      this.drawScatterPlot(this.dataPoints);
    },
    clearTimer() {
      clearInterval(this.timer);
    },
    digTrench() {
      let sweep = this.runPlotWithSettings(false);
      let points = sweep['points'];
      this.writeConsole('Starting animation.');
      this.dataPoints['Preview Sweep'] = [];
      this.dataPoints['Active Sweep'] = [];
      let i = 1;
      let render = (point) => {
        this.dataPoints['Active Sweep'] = points.slice(0, point + 1);
        this.state.long = this.dataPoints['Active Sweep'][point]['x'].toFixed(2);
        this.state.lat = this.dataPoints['Active Sweep'][point]['y'].toFixed(2);
        this.state.depth = this.dataPoints['Active Sweep'][point]['z'].toFixed(2);
        this.state.angle = this.dataPoints['Active Sweep'][point]['angle'].toFixed(2) + " degrees";
        this.drawScatterPlot(this.dataPoints);
      };

      this.timer = setInterval(() => {
        if (i < points.length) {
          if (!this.clicking) {
            render(i);
            i++;
          }
        } else {
          clearInterval(this.timer);
        }
      }, 1);
    },
    plotTrench(origin = [0, 0, 0, 0],
               zIncrement = 5,
               radialIncrement = 4,
               radialVelocity = 350,
               depthStart = -20,
               maxDepth = -900,
               angleStart = -90,
               angleFinish = 90,
               minDistance = 10,
               craneArmLength = 50,
               wallAngles = 45,
               preview = true) {

      if (this.plot) {
        this.plot.data = [];
        this.plot = null;
      }

      let points = [];


      //let currentGrade = 0;
      points.push({
        x: origin[0],
        y: origin[1],
        z: origin[2],
        angle: origin[3],
      });

      angleStart = angleStart + origin[3];
      angleFinish = angleFinish + origin[3];

      //TODO receive grade from attached IBF machine
      let gradesTemplate = ['.1', '.2', '.1', '.15', '3.5', '.1', '.1', '.15', '4', '.2', '.15', '.1', '.15', '4', '.2', '.15', '.1'];
      let grades = ['.1', '.2', '.1', '.15'];
      for (let m = 0; m < 1000; m++) {
        grades.push(parseFloat(_.sample(gradesTemplate)));
      }
      let counter = 0;
      wallAngles *= (Math.PI / 180); // convert to radians
      let shrink = zIncrement / Math.tan(wallAngles);
      let direction = 1;
      let shrunkAngleStart = angleStart
      let shrunkAngleFinish = angleFinish;

      let z;
      for (z = depthStart; z >= maxDepth; z -= zIncrement) { //at each depth

        let dist = craneArmLength - (shrink * counter); // set dist to max
        let minDist = minDistance + (shrink * counter);

        if (dist < minDist) {
          z += zIncrement
          break;
        }

        let finished = false;
        /*for (dist=distance-(shrink*counter); dist >= (minDistance + (shrink*counter)) dist >= 0; dist -= (radialIncrement)) {*/ //at each distance from boat
        while (!finished) {
          if (dist <= (minDistance + (shrink * counter))) { // Make sure we trim right along the minimum edge
            dist = minDistance + shrink * counter
            finished = true;
          }

          //TODO why is this not 0 with 90degree wall angles
          let angleShrink;
          if (Math.abs(wallAngles - Math.PI / 2) < 0.005) angleShrink = 0;
          else angleShrink = Math.atan((depthStart - z) / (dist * Math.sin(wallAngles))) * (180 / Math.PI);

          shrunkAngleStart = angleStart + angleShrink;
          shrunkAngleFinish = angleFinish - angleShrink;
          if (shrunkAngleStart > shrunkAngleFinish) {
            break;
          }

          let arc_length = (2 * Math.PI * dist) * ((shrunkAngleFinish - shrunkAngleStart) / 360);
          let step_size = radialVelocity / arc_length;


          if (direction === 1) {
            for (let angle = shrunkAngleStart; angle <= shrunkAngleFinish; angle += step_size) // at each angle
              points.push(this.makePoint(origin, z, angle, dist, preview ? null : grades[counter]*(1+(Math.random() * 0.1)-0.1)));

            // make sure we go to edge
            points.push(this.makePoint(origin, z, shrunkAngleFinish, dist, preview ? null : grades[counter]*(1+(Math.random() * 0.1)-0.1)));
          } else {
            for (let angle = shrunkAngleFinish; angle >= shrunkAngleStart; angle -= step_size) // at each angle
              points.push(this.makePoint(origin, z, angle, dist, preview ? null : grades[counter]*(1+(Math.random() * 0.1)-0.1)));

            // Make sure we go to the edge
            points.push(this.makePoint(origin, z, shrunkAngleStart, dist, preview ? null : grades[counter]*(1+(Math.random() * 0.1)-0.1)));
          }

          direction = -direction;
          dist -= radialIncrement; // Pull the arm in
        }

        //if (shrunkAngleStart > shrunkAngleFinish) break;
        counter++;
      }
      let depth_max = z + zIncrement;
      return {points, depth_max};

    },
    makePoint(origin, depth, angle, dist, grade) {
      let record = {};
      record['grade'] = grade;
      record['z'] = depth;
      record['x'] = origin[0] + dist * Math.cos(angle * (Math.PI / 180));
      record['y'] = origin[1] + dist * Math.sin(angle * (Math.PI / 180));
      record['angle'] = angle;
      return record;
    },
    drawScatterPlot(traces) {
      function unpack(rows, key) {
        return rows.map(function (row) {
          return row[key];
        });
      }

      let plotTraces = [];
      let counter = 0;
      for(let name of Object.keys(traces)){

        let rows = _.filter(traces[name], this.filter);
        let trace = {
          x: unpack(rows, 'x'), y: unpack(rows, 'y'), z: unpack(rows, 'z'),
          mode: 'markers',
          name: name,
          marker: {
            size: 6,
            color: unpack(rows, 'grade'),
            colorscale: [
              ['0.0', 'rgba(13, 8, 135,0.4)'],
              ['0.03', 'rgba(17,0,168,0.4)'],
              ['0.07', 'rgba(177, 42, 144,0.6)'],
              ['0.2', 'rgba(225, 100, 98,0.7)'],
              ['0.4', 'rgba(237, 121, 83,0.7)'],
              ['0.5', 'rgba(253, 180, 47,0.7)'],
              ['0.85', 'rgba(253,212,47,0.7)'],
              ['1', 'rgba(0, 255, 33,0.7)'],
            ],
            custom_data: ['grade'],
            showscale: true,
            opacity: 0.8,
            line: {
              color: 'rgba(0,0,0,0.42)',
              width: 0.5
            },
            symbol: SHAPES[counter],

            colorbar: {
              title: 'Grade (g/ton)'
            },
            cmin: 0,
            cmax: 4,
          },

          type: 'scatter3d'
        };
        plotTraces.push(trace);
        counter ++;
      }


      var layout = {
        /*title: "Gold density",*/
        height: 1000,
        width: 1500,
        margin: {
          l: 0,
          r: 0,
          b: 0,
          t: 50
        },
        showlegend: true,
        legend: {
          x: 1,
          xanchor: 'right',
          y: 1
        },
        "uirevision": true,
        /*x:[-60,60],
        y:[-60,60],
        z:[0,-90],
        autoresize: 'false'*/
      };


      if (this.plot) Plotly.react('plot', plotTraces, layout);
      else this.plot = Plotly.newPlot('plot', plotTraces, layout);

    },
  }
};
</script>

<style scoped>
.console {
  background: #666666;
  outline: #999 1px solid;
  color: white;
  font-family: monospace;
  text-align: left;
  padding: 2px 25px;
  height: 250px;
  margin: 1em;
  overflow-y: scroll;
}

#plot {
  margin: 50px auto;
}

.depthTable {
  width: 100%;
}

.depthTable thead {
  font-weight: bold;
  text-align: center;
}

.depthTable tbody tr:hover {
  background: #2c3e50;
  color: white;
}


.leftBar, .rightBar {
  flex: 0 1 455px;
}

.graphs {
  flex: 1 1 80%;
}

.page {
  display: flex;
}

.leftBar, .rightBar, .graphs {
  display: flex;
  flex-direction: column;
  color: #999999;
}

legend {
  display: inline;
  width: auto;
}

.page {
  flex-direction: row;
}


.settings, .params {
  padding: 1em;
  margin: 1em;
  border: #666666 3px double;
  display: flex;
  flex-direction: column;
  vertical-align: middle;
}

span {
  display: flex;
  flex: 0 1 90%;
  align-items: baseline;
  vertical-align: center;
}

label {
  flex: 1 0;
  text-align: right;
}

button, input, select {
  flex: 1 1;
  margin: 0.5em 0.25em;
  border: none;
  color: white;
  padding: 0.25em;
  cursor: pointer;
  background-color: #666666;
  height: 2em;
}

button:hover {
  background-color: #cccccc;
  color: #2c3e50;
}

button:disabled {
  background-color: #cccccc;
  color: #666666;
}

.save {
  flex: 0 1;
}

.stop {
  background-color: #f44336;
}

.stop:hover {
  background: #da190b;
}

.start:hover {
  background: #68da0b;
}


.start {
  background-color: #4CAF50;
}

.start:hover {
  background: #68da0b;
}


</style>
