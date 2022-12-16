<template>
  <div @mouseup="clicking = false" @mousedown="clicking=true">
    <div class="topBox">
  <fieldset class="settings">
    <legend>Control Parameters</legend>
    <span>
    <select v-model="selectedSettings">
      <option v-for="setting in settings" :value="setting" :key="setting.name">{{ setting.name }}</option>
    </select>
    <button class="save" :disabled="!hasChanges" @click="saveSettings">Save</button>
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
    </div>

    <button class="start" @click="generateData()">Start Sweep</button>
    <button class="stop">Emergency Lift</button>
    <br style="clear:both">

  </fieldset>

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
    </div>


  <div class="page">
    <div class="console">
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

export default {
  name: 'DashboardView',
  props: {},
  components: {UpdateOnBlur},
  data() {
    return {
      consoleText: [],
      selectedSettings: {
        name: '(not saved)',
        radial_velocity: null,
        radial_increment: null,
        z_increment: null
      },
      selectedSettingsOldVal: {
        name: null,
        radial_velocity: null,
        radial_increment: null,
        z_increment: null
      },
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
      if (oldval == null) return;
      this.writeConsole(`Radial velocity changed from ${oldval} to ${newval}`);
    },
    'selectedSettings.radial_increment'(newval, oldval) {
      if (oldval == null) return;
      this.writeConsole(`Radial increment changed from ${oldval} to ${newval}`);
    },
    'selectedSettings.z_increment'(newval, oldval) {
      if (oldval == null) return;
      this.writeConsole(`Z increment changed from ${oldval} to ${newval}`);
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

    let render = () => {
      if (this.currentRenderPoint <= this.points.length) {
        this.drawScatterPlot(this.points.slice(0,this.currentRenderPoint));
        this.state.long = this.points[this.currentRenderPoint]['x'].toFixed(2);
        this.state.lat = this.points[this.currentRenderPoint]['y'].toFixed(2);
        this.state.depth = this.points[this.currentRenderPoint]['z'].toFixed(2);
        this.state.angle = this.points[this.currentRenderPoint]['angle'].toFixed(2) + " degrees";
        this.currentRenderPoint += 1;
      }
    };

    this.timer = setInterval(() => {if (!this.clicking) render()},100);

  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    saveSettings() {
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
      this.consoleText.push(`[${date.toLocaleDateString()}:${date.toLocaleTimeString()}]: ${text}`);
    },
    generateData(originX=0,originY=0,depth=-70,angle_start=-90,angle_finish=90,distance=50) {
      this.writeConsole('Generating data');
      this.points = [];


      //let currentGrade = 0;
      this.points.push({
        "x": originX,
        "y": originY,
        "z": 0,
        "angle": 0
      });

      let grades = ['.1','.2','.1','.15','3.5','.1','.1','.15','4','.2','.15','.1']
      let counter = 0;
      let wallAngles = Math.PI/4;

      let shrink =  1/((1/this.selectedSettings.z_increment) * Math.tan(wallAngles));
      let dist = this.selectedSettings.radial_increment;
      let direction = 1;


      for (let z = -20; z > depth; z -= this.selectedSettings.z_increment) { //at each depth

        for (dist=distance-(shrink*counter); dist > (shrink*counter); dist -= (this.selectedSettings.radial_increment)) { //at each distance from boat
          let arc_length = (2*Math.PI*dist) * ((angle_finish-angle_start)/360);
          let step_size = this.selectedSettings.radial_velocity/arc_length;


          if (direction == 1) {
            for (let angle = angle_start; angle <= angle_finish; angle += step_size) { // at each angle
              this.setPoint(originX, originY, z, angle, dist, grades[counter]);
            }
          } else {
            for (let angle = angle_finish; angle >= angle_start; angle -= step_size) { // at each angle
              this.setPoint(originX, originY, z, angle, dist, grades[counter]);
            }
          }

          // Make sure we go to the edge
          this.setPoint(originX,originY,z,angle_finish,dist, grades[counter]);
          direction = -direction;
        }

        counter++;
        if (distance-(shrink*counter) < 0) break;
      }
      this.currentRenderPoint = 1;

    },
    setPoint(originX,originY,depth,angle,dist, grade) {
      let record = [];
      record['grade'] = grade;
      record['z'] = depth;
      record['x'] = originX + dist*Math.cos(angle*(Math.PI/180));
      record['y'] = originY + dist*Math.sin(angle*(Math.PI/180));
      record['angle'] = angle;
      this.points.push(record);
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
            ['0.2', 'rgba(237, 121, 83,0.7)'],
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
          cmid: 0.2,
          cmax: 4.5,
        },

        type: 'scatter3d'
      };

      var layout = {
        title: "Gold density",
        height: 550,
        margin: {
          l: 0,
          r: 0,
          b: 0,
          t: 50
        },
        "uirevision": true,

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
  height: 100%;
  overflow-y: scroll;
}

#plot {
  margin-top: 50px;
}

.page, .console, .graphs {
  display: flex;
  flex: 1 1;
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
  padding: 2em;
  margin: 2em auto;
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
  flex: 0 1 5em;
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
