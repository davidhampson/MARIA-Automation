
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
      d3.csv('https://raw.githubusercontent.com/plotly/datasets/master/3d-scatter.csv', function (err, rows) {

        function unpack(rows, key) {

          return rows.map(function (row) {
            return row[key];
          });
        }


        var trace1 = {

          x: unpack(rows, 'x1'), y: unpack(rows, 'y1'), z: unpack(rows, 'z1'),

          mode: 'markers',
          name: "Below minimum gold threshold",

          marker: {

            size: 12,

            line: {

              color: 'rgba(217, 217, 217, 0.14)',

              width: 0.5
            },

            opacity: 0.8
          },

          type: 'scatter3d'

        };


        var trace2 = {

          x: unpack(rows, 'x2'), y: unpack(rows, 'y2'), z: unpack(rows, 'z2'),

          mode: 'markers',
          name: "Above minimum gold threshold",
          marker: {

            color: 'rgb(127, 127, 127)',

            size: 12,

            symbol: 'circle',

            line: {

              color: 'rgb(204, 204, 204)',

              width: 1
            },

            opacity: 0.8
          },

          type: 'scatter3d'
        };


        var data = [trace1, trace2];

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

      });

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
  height: 500px;
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
}

.page {
  flex-direction: row;
}

</style>
