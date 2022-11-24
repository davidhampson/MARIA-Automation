
<template>
  <h1>Dashboard</h1>

  <div class="page">
    <div class="console">
      <h3>Console</h3>
      <div class="consoleInner">
        <div v-for="text in consoleText" :key="text">{{text}}</div>
      </div>
    </div>
    <div class="graphs">
      <h3>Graphs</h3>
      <button @click="drawPlot">Topographical</button>
      <button @click="drawScatterPlot">Scatter</button>
      <div id="plot"/>
    </div>
  </div>
</template>

<script>
import Plotly from 'plotly.js-dist';
import d3 from '@plotly/d3';
import _ from 'underscore';

export default {
  name: 'DashboardView',
  props: {},
  data() {
    return {
      consoleText: []
    }
  },
  mounted() {
    document.title = 'MARIA | Dashboard';
    this.drawPlot();
  },
  methods: {
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
        let currentGrade = 0;
        for (var z = 48; z > 0; z-=2) {
          let rand = Math.random();
          if (rand < .6) {
            currentGrade = 0;
          }
          else if (rand < .8) {
            currentGrade = 1
          }
          else if (rand < 1) {
            currentGrade = 2;
          }

          for (var y = 0;y < 40; y+=4) {
            for (var x = 0; x < 40; x+=4) {
              //let rand = Math.random();

              let record = [];
              /*if (rand < .9)
              else if (rand < .95) record['grade'] = 1;
              else record['grade'] = 0;
*/
              record['grade'] = currentGrade;

              record['z'] = z;
              record['x'] = x;
              record['y'] = y;
              rows.push(record);

            }
          }
        }

        var high = _.where(rows, {"grade": 0});
        var mid = _.where(rows, {"grade": 1});
        var low = _.where(rows, {"grade": 2});

        var trace1 = {
          x: unpack(high, 'x'), y: unpack(high, 'y'), z: unpack(high, 'z'),

          mode: 'markers',
          name: "High grade",

          marker: {
            size: 6,
            color: 'rgb(0, 155, 0)',
            line: {
              color: 'rgb(204, 204, 204, 0.14)',
              width: 0.5
            },
            opacity: 0.8
          },
          type: 'scatter3d'
        };


        var trace2 = {

          x: unpack(mid, 'x'), y: unpack(mid, 'y'), z: unpack(mid, 'z'),

          mode: 'markers',
          name: "Mid grade",
          marker: {
            color: 'rgb(0, 0, 155)',
            size: 6,
            symbol: 'circle',
            line: {
              color: 'rgb(204, 204, 204, 0.14)',
              width: 0.5
            },
            opacity: 0.7
          },

          type: 'scatter3d'
        };

      var trace3 = {

        x: unpack(low, 'x'), y: unpack(low, 'y'), z: unpack(low, 'z'),

        mode: 'markers',
        name: "Low grade",
        marker: {
          color: 'rgba(155, 0, 0, 0.5)',
          size: 6,
          symbol: 'circle',
          line: {
            color: 'rgb(204, 204, 204, 0.14)',
            width: 0.5
          },
          opacity: 0.7
        },

        type: 'scatter3d'
      };



      var data = [trace1, trace2, trace3];

        var layout = {
          title: "Gold density",
          margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0
          }
        };

        Plotly.newPlot('plot', data, layout);

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

</style>
