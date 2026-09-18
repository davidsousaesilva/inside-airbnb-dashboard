<template>
  <div class="page-container"><div class="card-detail-wrapper">
    <div class="card-detail">
      <!-- layout comum: header, filtros reaproveitados, etc. -->
      <h1>{{ title }}</h1>
      
      <div class="chart-area">
        <component 
          :is="componentName"
          ref="currentChart"
          legend-position="right"
          :display-title="false"
          :legend-font-size="30"
        />
      </div>

      <div class="actions-area">
        <div class="export-row">
          <button class="btn-export" @click="exportCSV">Export Data (CSV)</button>
          <button class="btn-export" @click="exportComponent">{{ isTable ? 'Export Table' : 'Export Chart' }}</button>
          <button class="btn-export" @click="exportJSON">Export Data (JSON)</button>
        </div>

        <button class="btn-back" @click="goBack">go back</button>
      </div>
      
    </div>
  </div>
  <Notification
    :show="notification.show"
    :message="notification.message"
    :type="notification.type"
    :label="notification.label"
    @close="notification.show=false"
  />
  </div>
</template>

<script>
import AvgPriceChart from "@/components/detail/AvgPriceChart.vue";
import PieChart from "@/components/detail/PieChart.vue";
import ActivityChart from "@/components/detail/ActivityChart.vue";
import AnomaliesTable from "@/components/detail/AnomaliesTable.vue";
import HostsTable from "@/components/detail/HostsTable.vue";
import { useStore } from '@/stores/store';
import html2canvas from 'html2canvas';
import Notification from "@/components/ui/Notification.vue";

export default {
  components: {
    AvgPriceChart,
    PieChart,
    ActivityChart,
    AnomaliesTable,
    HostsTable,
    Notification
  },

  props: {
    type: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      titleMap: {
        "avg-price": "Average price per day per Airbnb",
        "pie-chart": "Type of property distribution",
        activity: "Activity",
        anomalies: "Anomalies detected in listed Airbnbs",
        hosts: "Total Airbnbs per host",
      },
      componentMap: {
        "avg-price": "AvgPriceChart",
        "pie-chart": "PieChart",
        activity: "ActivityChart",
        anomalies: "AnomaliesTable",
        hosts: "HostsTable",
      },
      store: useStore(),
      notification: {
        show: false,
        message: '',
        type: 'success',
        label: ''
      }
    };
  },

  computed: {
    title() {
      return this.titleMap[this.type];
    },
    // devolve o nome do componente para usar com <component :is="...">
    componentName() {
      return this.componentMap[this.type];
    },

    isTable() {
      return this.componentName.includes("Table");
    }
  },
  methods:{
    goBack() {
      this.$router.back();
    },

    showNotification(message,label,  type='success') {
      console.log("Mostrando notificação:", message, label, type);
      this.notification = {
        show: true,
        message,
        type,
        label
      };
      
    },

    exportCSV() {
      const label = this.isTable ? 'table' : 'csv';

      try{

        let dataToExport = [];
        const componentRef = this.$refs.currentChart;
        if (componentRef &&  typeof componentRef.getExportData === 'function') {
          dataToExport = componentRef.getExportData();
        } else{
          throw new Error("Component export function not found");
        }

        if (dataToExport.length === 0) {
          alert("No data to export.");
          return;
        }

        const headers = Object.keys(dataToExport[0]);
        const csvRows = [
          headers.join(','), // header row
          ...dataToExport.map(row => 
          headers.map(header => `"${String(row[header] || 'N/A').replace(/"/g, '""')}"`).join(',')
        )
        ].join('\n');

        this.downloadFile(csvRows, `${this.type}_data.csv`, 'text/csv');

        this.showNotification(`${label.toUpperCase()} file exported with success!`, label);
      }catch(error){
        console.error("Error exporting data:", error);
        this.showNotification(`${label.toUpperCase()} file couldn't be exported!`, label, 'error');
        return;
      }
    },

    exportJSON() {
      try{

        let dataToExport = [];
        const componentRef = this.$refs.currentChart;
        if (componentRef &&  typeof componentRef.getExportData === 'function') {
          dataToExport = componentRef.getExportData();
        } else{
          throw new Error("Component export function not found");
        }
        
        if (dataToExport.length === 0) {
          throw new Error("No data available");
        }


        this.downloadFile(JSON.stringify(dataToExport, null, 2), `${this.type}_data.json`, 'application/json');
        this.showNotification(`JSON file exported with success!`, 'JSON');
      }catch (error){
        this.showNotification(`JSON file couldn't be exported!`, 'JSON', 'error');
        console.log(error);
      }
      
    },

    async exportComponent() {
      if (this.isTable) {
        this.exportCSV();
      } else {
        
        const element = document.querySelector('.chart-area');
        if (!element) return;
        
        try {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false
          });

          const image = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = image;
          link.download = `${this.type}_chart.png`;
          link.click();
          this.showNotification(`Chart exported with success!`, 'graph')
        }catch (error) {
          this.showNotification(`Chart couldn't be exported!`, 'graph','error')
          console.error("Error exporting chart:", error);
        }
        //window.print();
      }
    },

    downloadFile(content, filename, contentType) {
      const blob = new Blob([content], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  },
}
</script>

<style scoped>



.card-detail-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  
  width: 100vw;
  overflow-x: auto;
  box-sizing: border-box;
}
.card-detail {
  width: 50%;
  min-height: 1700px;
  margin: 70px;
  background-color: rgb(238, 246, 252);
  border: 1px solid black;
  border-radius: 15px;
  min-width: 1000px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 90px;
  padding-bottom: 100px;
}

h1{
  font-size: 3rem;
  margin-bottom: 40px;
  font-family: sans-serif;
  text-align: center;
}

.chart-area {
  width: 80%;
  height: 700px;
  margin-bottom: 50px;
  flex-shrink: 0;
  margin-bottom: 10vh;


}


.actions-area {
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  margin-top: auto;
}

.export-row {
  display: flex;
  gap: 50px;
  width: 100%;
  justify-content: center;
  padding-bottom: 40px;

}

button {
  width: 30%;
  height: 60px;
  cursor: pointer;
  background-color: white;
  border: 1px solid black;
  border-radius: 4px;
  font-family: sans-serif;
}

button:hover {
  box-shadow: 0 0 0 1px;
}

.btn-export {
  padding: 8px 15px;
  font-size: 1.5rem;
  min-width: 120px;
}

.btn-back {
  padding: 8px 15px;
  font-size: 1.5rem;
}



</style>
