<template>
  <div class="table-container">
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>AirBnb</th>
            <th>Host</th>
            <th>Anomaly</th>
          </tr>
        </thead>
      
        <tbody>
          <tr v-for="(row,index) in tableData" :key="index">
            <td>{{ row.airbnb }}</td>
            <td>{{ row.host }}</td>
            <td :class="getAnomalyClass(row.anomaly)">
              {{ row.anomaly }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class = "filter-info">
      <p class="card-subtext description">The data in this table covers the last 12 months and remains unaffected by any filters previously applied.</p>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'pinia';
  import { useStore } from '@/stores/store';



  export default {
    name: 'AnomaliesTable',
    props:{
      displayTitle: {
        type: Boolean,
        default: true
      }
    },
    computed: {
       ...mapState(useStore, {
        listings: 'getFilteredListings',
      }),
      tableData() {

        return this.listings.filter(listing => {
          const highAvailablity = listing.availability_365 > 300;

          const suspiciousReviews = listing.number_of_reviews > 100 && listing.reviews_per_month < 10;
          
          return highAvailablity || suspiciousReviews;
        })
        .map(listing => {
          let anomalytype = '';

          if (listing.availability_365 > 300) {
            anomalytype = '>300 nights per year';
          }else{
            anomalytype = 'Many reviews, few bookings';
          }

          return{
            airbnb: listing.name || 'N/A',
            host: listing.host_name || 'N/A',
            anomaly: anomalytype
          };
        })//.slice(0,10);
      }
    },
    methods: {
      getAnomalyClass(text) {
        if (text.includes('>300')) return 'text-red';
        if (text.includes('Many reviews')) return 'text-yellow';
        return '';
      },

      getExportData() {
        // implementar exportação para CSV
        return this.tableData.map(row => {
          return {
            'Airbnb Name': row.airbnb,
            'Host Name': row.host,
            'Anomaly Type': row.anomaly
          };
        });
      }
    
    }
  }
</script>

<style scoped>
  .table-container {
    margin-top: 100px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items:center;
    font-family:sans-serif;
  }

  .table-wrapper {
    width:100%;
    max-width: 1200px;
    overflow-x: auto;
    height:800px;
  }

  table {
    width:100%;
    border-collapse: collapse;
    text-align: center;
    border: 1px solid #999;
    table-layout :fixed;
  }

  thead th {
    background-color:#dcdcdc;
    padding: 20px 10px;
    font-weight:bold;
    color: #000;
    border: 1px solid #999;
    font-size: 1.5rem;
  }

  tbody td {
    border: 1px solid #999;
    padding: 20px 0px;
    background-color: white;
    font-size: 1.4rem;
  }

  .text-red {
    color: #b71c1c;
    font-weight:500;
  }

  .text-yellow {
    color: #d4a017;
    font-weight:500;
  }

  
  
  .filter-info {

    margin-top: 50px;
    padding: 10px 0;
    font-size: 2.3rem;
  }

  .description {
    color: #666;
    margin-bottom: 5px;
    line-height: 1.2;

  }

</style>