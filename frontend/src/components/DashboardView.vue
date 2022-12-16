<template>
  <div @mouseup="clicking = false" @mousedown="clicking=true">
  <div class="page">
    <div class="console">
      <fieldset class="params">
        <legend>Device State</legend>
        <div class="paramBox">
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
        </div>
      </fieldset>
      <fieldset class="settings">
        <legend>Control Parameters</legend>
        <span>
    <select v-model="selectedSettings">
      <option v-for="setting in settings" :value="setting" :key="setting.name">{{ setting.name }}</option>
    </select>
    <button class="save" :disabled="!hasChanges || selectedSettings.name == null" @click="saveSettings">Save</button>
    <button class="save" @click="saveNewSettings">New</button>
    </span>
        <div class="paramBox">
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
        </div>

        <button class="start" @click="plotTrenchWithSelectedSettings">Start Sweep</button>
        <button class="start" @click="previewTrenchWithSelectedSettings">Preview Sweep</button>
        <button class="stop" @click="currentRenderPoint = -1; plot.data=[];">Emergency Lift</button>
        <br style="clear:both">

      </fieldset>
      <div class="consoleInner">
        <div v-for="text in consoleText" :key="text">{{ text }}</div>
      </div>
    </div>
    <div class="graphs">
      <!--      <button @click="drawPlot">Topographical</button>
            <button @click="drawScatterPlot">Scatter</button>-->
      <div id="plot"/>
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
      selectedSettings: _.extend({},settingsTemplate),
      selectedSettingsOldVal: _.extend({},settingsTemplate),
      settings: [],
      points: [],
      clicking: false,
      state: {
        lat: 0,
        long: 0 ,
        angle: 0,
        depth: 0,

      },
      currentRenderPoint: 1
    }
  },
  watch: {
    selectedSettings() {
      this.writeConsole(`Loaded ${this.selectedSettings.name} settings`);
      this.selectedSettingsOldVal = _.extend({}, this.selectedSettings);
    },
    'selectedSettings.radial_velocity'(newval, oldval) {
      this.reportChange("Radial velocity", newval, oldval);
    },
    'selectedSettings.radial_increment'(newval, oldval) {
      this.reportChange("Radial increment", newval, oldval);
    },
    'selectedSettings.z_increment'(newval, oldval) {
      this.reportChange("Z increment", newval, oldval);
    },
    'selectedSettings.min_distance'(newval, oldval) {
      this.reportChange("Minimum distance", newval, oldval);
    },
    'selectedSettings.wall_angle'(newval, oldval) {
      this.reportChange("Wall angle", newval, oldval);
    },
    'selectedSettings.depth_start'(newval, oldval) {
      this.reportChange("Depth start", newval, oldval);
    },
    'selectedSettings.depth_max'(newval, oldval) {
      this.reportChange("Max depth", newval, oldval);
    },
    'selectedSettings.angle_start'(newval, oldval) {
      this.reportChange("Angle start", newval, oldval);
    },
    'selectedSettings.angle_finish'(newval, oldval) {
      this.reportChange("Angle finish", newval, oldval);
    },
  },
  computed: {
    hasChanges() {
      return !_.isEqual(this.selectedSettings, this.selectedSettingsOldVal);
    }
  },
  mounted() {
    document.title = 'MARIA | Dashboard';
    this.loadSettings();
    this.currentRenderPoint = 0;

    let render = () => {
      if (this.currentRenderPoint < this.points.length) {
        this.drawScatterPlot(this.points.slice(0,this.currentRenderPoint+1));
        this.state.long = this.points[this.currentRenderPoint]['x'].toFixed(2);
        this.state.lat = this.points[this.currentRenderPoint]['y'].toFixed(2);
        this.state.depth = this.points[this.currentRenderPoint]['z'].toFixed(2);
        this.state.angle = this.points[this.currentRenderPoint]['angle'].toFixed(2) + " degrees";
        this.currentRenderPoint ++;

      }
    };

    this.timer = setInterval(() => {if (!this.clicking) render()},1);

  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    reportChange(field,newval,oldval) {
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
      if (this.selectedSettings.name === null) this.selectedSettings.name = prompt("Name?") ;
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
    writeConsole(text) {
      let date = new Date();
      this.consoleText.push(`[${date.toLocaleTimeString()}]: ${text}`);
    },
    previewTrenchWithSelectedSettings() {
      let points = this.plotTrench(
          [0,0,0],
          parseFloat(this.selectedSettings.z_increment),
          parseFloat(this.selectedSettings.radial_increment),
          parseFloat(this.selectedSettings.radial_velocity),
          parseFloat(this.selectedSettings.depth_start),
          parseFloat(this.selectedSettings.depth_max),
          parseFloat(this.selectedSettings.angle_start),
          parseFloat(this.selectedSettings.angle_finish),
          parseFloat(this.selectedSettings.min_distance),
          CRANE_ARM_LENGTH,
          this.selectedSettings.wall_angle,
      );
      this.writeConsole('Done.');
      this.points = points;
      this.currentRenderPoint = this.points.length-1;
    },
    plotTrenchWithSelectedSettings() {
      let points = this.plotTrench(
          [0,0,0],
          parseFloat(this.selectedSettings.z_increment),
          parseFloat(this.selectedSettings.radial_increment),
          parseFloat(this.selectedSettings.radial_velocity),
          parseFloat(this.selectedSettings.depth_start),
          parseFloat(this.selectedSettings.depth_max),
          parseFloat(this.selectedSettings.angle_start),
          parseFloat(this.selectedSettings.angle_finish),
          parseFloat(this.selectedSettings.min_distance),
          CRANE_ARM_LENGTH,
          this.selectedSettings.wall_angle,
      );
      this.points = points;
      this.writeConsole('Starting animation.');
      this.currentRenderPoint = 1;


    },
    plotTrench(origin=[0,0,0],
               zIncrement=5,
               radialIncrement=4,
               radialVelocity=350,
               depthStart=-20,
               maxDepth=-900,
               angleStart=-90,
               angleFinish=90,
               minDistance=10,
               distance=50,
               wallAngles=45) {

      if (this.plot){
        this.plot.data = [];
        this.plot=null;
      }

      this.writeConsole('Generating data.');
      let points = [];


      //let currentGrade = 0;
      points.push({
        x: origin[0],
        y: origin[1],
        z: origin[2],
        angle: 0,
      });
      //TODO receive grade from attached IBF machine
      let gradesTemplate = ['.1','.2','.1','.15','3.5','.1','.1','.15','4','.2','.15','.1','.15','4','.2','.15','.1'];
      let grades = ['.1','.2','.1','.15'];
      for (let m = 0; m < 1000; m ++) {
        grades.push(_.sample(gradesTemplate));
      }
      let counter = 0;
      wallAngles *= (Math.PI/180); // convert to radians
      let shrink =  zIncrement / Math.tan(wallAngles);
      let dist = distance-(shrink*counter);
      let direction = 1;
      let shrunkAngleStart = angleStart
      let shrunkAngleFinish = angleFinish;

      let z;

      for (z = depthStart; z >= maxDepth; z -= zIncrement) { //at each depth
        if (distance-(shrink*counter) < (shrink*counter)) {
          z += zIncrement
          break;
        }

        for (dist=distance-(shrink*counter); dist > (minDistance + (shrink*counter)); dist -= (radialIncrement)) { //at each distance from boat
          let angleShrink =  Math.atan((depthStart-z)/(dist*Math.sin(wallAngles))) * (180/Math.PI);
          //let angleShrink =  Math.atan((zIncrement)/(dist*Math.cos(wallAngles))) * (180/Math.PI);
          //let angleShrink =  Math.atan((Math.cos(wallAngles))) * (180/Math.PI);
          shrunkAngleStart = angleStart + ((angleShrink));
          shrunkAngleFinish = angleFinish - ((angleShrink));
          if (shrunkAngleStart > shrunkAngleFinish) {
            alert('condition hit');
            break;
          }

          let arc_length = (2*Math.PI*dist) * ((shrunkAngleFinish-shrunkAngleStart)/360);
          let step_size = radialVelocity/arc_length;

          if (direction === 1) {
            for (let angle = shrunkAngleStart; angle <= shrunkAngleFinish; angle += step_size) // at each angle
              points.push(this.makePoint(origin, z, angle, dist, grades[counter]));

            // make sure we go to edge
            points.push(this.makePoint(origin,z,shrunkAngleFinish,dist, grades[counter]));
          } else {
            for (let angle = shrunkAngleFinish; angle >= shrunkAngleStart; angle -= step_size) // at each angle
              points.push(this.makePoint(origin, z, angle, dist, grades[counter]));

            // Make sure we go to the edge
            points.push(this.makePoint(origin,z,shrunkAngleStart,dist, grades[counter]));
          }
          
          direction = -direction;
        }
        if (shrunkAngleStart > shrunkAngleFinish) break;
        counter++;
      }
      //let depth_max = z+zIncrement;
      return points;

    },
    makePoint(origin,depth,angle,dist, grade) {
      let record = [];
      record['grade'] = grade;
      record['z'] = depth;
      record['x'] = origin[0] + dist*Math.cos(angle*(Math.PI/180));
      record['y'] = origin[1] + dist*Math.sin(angle*(Math.PI/180));
      record['angle'] = angle;
      return record;
    },
    drawScatterPlot(rows) {

      function unpack(rows, key) {
        return rows.map(function (row) {
          return row[key];
        });
      }

      var trace1 = {
        x: unpack(rows, 'x'), y: unpack(rows, 'y'), z: unpack(rows, 'z'),

        mode: 'markers',
        name: "High grade",

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
          symbol: 'circle',

          colorbar: {
            title: 'Grade (g/ton)'
          },
          cmin: 0,
          cmax: 4,
        },

        type: 'scatter3d'
      };

      var layout = {
        title: "Gold density",
        height: 1000,
        width: 1500,
        margin: {
          l: 0,
          r: 0,
          b: 0,
          t: 50
        },
        "uirevision": true,
        /*x:[-60,60],
        y:[-60,60],
        z:[0,-90],
        autoresize: 'false'*/
      };


      if (this.plot) Plotly.react('plot', [trace1], layout);
      else this.plot = Plotly.newPlot('plot', [trace1], layout);

    },
  }
};
</script>

<style scoped>
.consoleInner {
  background: #666666;
  outline: #999 1px solid;
  color: white;
  font-family: monospace;
  text-align: left;
  padding: 2px 25px;
  height: 250px;
  overflow-y: scroll;
}

#plot {
  margin: 50px auto;
}

.page, .graphs {
  display: flex;
  flex: 1 1;
}

.console {
  display: flex;
  flex: 0 1 20%;
}


.paramBox {
  display: flex;
  flex-direction: column;
}


.console, .graphs {
  flex-direction: column;
  padding: 20px;
  background: white;
  color: #999999;
}

legend {
  display: inline;
  width: auto;
}

.page {
  flex-direction: row;
}

.topBox {
  display: flex;
  flex-direction: row;
  width: 70%;
  margin: auto;
  gap: 10px;
  vertical-align: middle;
}



.settings, .params {
  padding: 1em;
  margin: 1em auto;
  border: #666666 3px double;
  display: flex;
  flex: 1 1;
  flex-direction: column;
  vertical-align: middle;
}

span {
  display: flex;
  align-items: baseline;
}

label {
  margin-left: 2em;
  flex: 0 1 8em;
  text-align: right;
}

button, input, select {
  flex: 1 1;
  margin: 0.5em 1em;
  border: none;
  color: white;
  padding: 0.25em 0.5em;
  cursor: pointer;
  background-color: #666666;
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
  flex: 0 1 3.5em;
}

.stop {
  background-color: #f44336;
}

.stop:hover {
  background: #da190b;
}

.start {
  background-color: #4CAF50;
}

.start:hover {
  background: #68da0b;
}


</style>
