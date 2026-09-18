<template>
  <div class="table-container">
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Hosts</th>
            <th>Entire homes</th>
            <th>Private rooms</th>
            <th>Shared rooms</th>
            <th>Hotel rooms</th>
            <th>Total</th>
          </tr>
        </thead>
      
        <tbody>
          <tr v-for="(row,index) in tableData" :key="index">
            <td class="col-host">{{ row.host }}</td>
            <td>{{ row.entire }}</td>
            <td>{{ row.private }}</td>
            <td>{{ row.shared }}</td>
            <td>{{ row.hotel }}</td>
            <td style="font-weight: bold;">{{ row.total }}</td>
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
    name: 'HostsTable',
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
        const hostStats = {};

        this.listings.forEach(listing => {
          const host = listing.host_name || 'Unknown host';
          if(!hostStats[host]){
            hostStats[host] = {
              host: host,
              entire: 0,
              private: 0,
              shared: 0,
              hotel: 0,
              total: 0
            };
          }

          const type = listing.room_type;
          if (type === 'Entire home/apt') {
            hostStats[host].entire += 1;
          } else if (type === 'Private room') {
            hostStats[host].private += 1;
          } else if (type === 'Shared room') {
            hostStats[host].shared += 1;
          } else if (type === 'Hotel room') {
            hostStats[host].hotel += 1;
          }
          hostStats[host].total += 1;
        });

        return Object.values(hostStats).sort((a,b) => b.total - a.total);//.slice(0,10);
      }
    },
    methods: {
      getExportData() {
        // implementar exportação para CSV
        
        return this.tableData.map(row => {
          return {
            host: row.host,
            entire_homes: row.entire,
            private_rooms: row.private,
            shared_rooms: row.shared,
            hotel_rooms: row.hotel,
            total: row.total
          };
        });
      }
    },
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
    height: 800px;
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
    font-size: 1.5rem;
    color: #000;
    border: 1px solid #999;
  }

  tbody td {
    border: 1px solid #999;
    padding: 25px 10px;
    background-color: white;
    font-size: 1.4rem;
    
  }

  .col-host {
    text-align: left;
    padding-left: 10px;
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