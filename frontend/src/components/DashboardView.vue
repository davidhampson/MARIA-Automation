<template>
  <div class="settings">
    <select v-model="selectedSettings">
      <option v-for="setting in settings" :value="setting" :key="setting.name">{{setting.name}}</option>
    </select>
    <button class="save" :disabled="!hasChanges" @click="saveSettings">Save</button>

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

    <button class="stop">Emergency Lift</button>
  </div>


  <div class="page">
    <div class="console">
      <div class="consoleInner">
        <div v-for="text in consoleText" :key="text">{{text}}</div>
      </div>
    </div>
    <div class="graphs">
<!--      <button @click="drawPlot">Topographical</button>
      <button @click="drawScatterPlot">Scatter</button>-->
      <div id="plot"/>
    </div>
  </div>
</template>

<script>
import Plotly from 'plotly.js-dist';
import d3 from '@plotly/d3';
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
      settings: []
    }
  },
  watch: {
    selectedSettings() {
        this.writeConsole(`Loaded ${this.selectedSettings.name} settings`);
        this.selectedSettingsOldVal = _.extend({}, this.selectedSettings);
    },
    'selectedSettings.radial_velocity'(newval, oldval) {
      if (oldval==null) return;
      this.writeConsole(`Radial velocity changed from ${oldval} to ${newval}`);
    },
    'selectedSettings.radial_increment'(newval, oldval) {
      if (oldval==null) return;
      this.writeConsole(`Radial increment changed from ${oldval} to ${newval}`);
    },
    'selectedSettings.z_increment'(newval, oldval) {
      if (oldval==null) return;
      this.writeConsole(`Z increment changed from ${oldval} to ${newval}`);
    },
  },
  computed: {
    hasChanges(){
      return !_.isEqual(this.selectedSettings, this.selectedSettingsOldVal);
    }
  },
  mounted() {
    document.title = 'MARIA | Dashboard';
    this.loadSettings();
    this.drawScatterPlot();
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
    drawScatterPlot() {
      this.writeConsole('Drawing scatter plot');

        function unpack(rows, key) {

          return rows.map(function (row) {
            return row[key];
          });
        }

        let rows = [];
        //let currentGrade = 0;

        let grades = [
          '.1',
          '.1',
          '3.5',
          '.1',
          '.1',
          '.1',
          '.15',
          '.15',
          '4',
          '.2',
          '.15',
          '.1',
          '.1',
          '.1',
          '.1',
          '.2',
          '.5',
          '.1',
        ]
        let counter = 0;
        for (var z = 0; z < 54; z+=3) {
          for (var y = 0;y < 24; y+=2) {
            for (var x = 0; x < 24; x+=2) {

              let record = [];
              record['grade'] = grades[counter];

              record['z'] = z;
              record['x'] = x;
              record['y'] = y;
              rows.push(record);

            }
          }
          counter ++;
        }
/*

        var high = _.where(rows, {"grade": 0});
        var mid = _.where(rows, {"grade": 1});
        var low = _.where(rows, {"grade": 2});
*/

        var trace1 = {
          x: unpack(rows, 'x'), y: unpack(rows, 'y'), z: unpack(rows, 'z'),

          mode: 'markers',
          name: "High grade",

          marker: {
            size: 6,
            color: unpack(rows,'grade'),


            colorscale: [
              ['0.0',  'rgba(13, 8, 135,0.4)'],
              ['0.05', 'rgba(17,0,168,0.4)'],
              ['0.07', 'rgba(177, 42, 144,0.6)'],
              ['0.2',  'rgba(225, 100, 98,0.7)'],
              ['0.2',  'rgba(237, 121, 83,0.7)'],
              ['0.5', 'rgba(253, 180, 47,0.7)'],
              ['0.85', 'rgba(253,212,47,0.7)'],
              ['1',    'rgba(0, 255, 33,0.7)']
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
            }
          },

          type: 'scatter3d'
        };

      //var data = [trace1, trace2, trace3];

        var layout = {
          title: "Gold density",
          height: 700,
          margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 50
          },
        };




        Plotly.newPlot('plot', [trace1], layout);

    },
    drawPlot() {
      this.writeConsole('Drawing topigraphic plot')
      d3.csv('https://raw.githubusercontent.com/plotly/datasets/master/api_docs/mt_bruno_elevation.csv', function (err, rows) {

        function unpack(rows, key) {
          return rows.map(function (row) {
            return row[key];
          });
        }


        var z_data = []

        for (let i = 0; i < 24; i++) {
          z_data.push(unpack(rows, i));
        }


        var data = [{
          z: z_data,
          type: 'surface',
          colorscale: 'Blues'
        }];


        var layout = {
          title: 'Gold density',
          margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0,
          }
        };

        Plotly.newPlot('plot', data, layout);

      });
    }
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

.console, .graphs {
  flex-direction: column;
  padding: 20px;
  background: white;
  color: #999999;
}

.page {
  flex-direction: row;
}

.settings {
  padding: 2em;
  width: 80%;
  margin:  2em auto;
  border: #666666 3px double;
  display: flex;
  align-items: center;
}

span {
  display: flex;
  align-items: baseline;
}

label {
  margin-left: 2em;
  flex: 1 1;
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

.stop:hover {background: #da190b;}


</style>
