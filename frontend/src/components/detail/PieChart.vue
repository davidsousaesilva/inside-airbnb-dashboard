<script>

  import { Pie } from 'vue-chartjs'
  import { mapState } from 'pinia'
  import { useStore } from '../../stores/store.js'

  export default {
    name: 'PieChart',
    components: {
      Pie
    },
    props: {
      legendPosition: {
        type: String,
        default: 'bottom'
      },
      legendFontSize: {
        type: Number,
        default: 18
      },
      isDashboard: {
        type:Boolean,
        default: false
      }
    },
    methods: {
      getExportData() {
        // implementar exportação para CSV
        const labels = this.chartData.labels;
        const values = this.chartData.datasets[0].data;
        return labels.map((label, index) => {
          return {
            room_type: label,
            count: values[index]
          };
        });
      }
    },
    computed: {
      ...mapState(useStore, {
        listings: 'getFilteredListings',
      }),
      filterInsight() {
        const maxPrice = this.store.getSelectedMaximumPrice
          ? `${this.store.getMaximumPrice}€`
          : `No limit`

        return {
          description: "The information of this chart reflects the current situation and applies the selected Maximum Price per Day filter.",
          details: `Maximum Price per day: ${maxPrice}`
        }
      },
      chartOptions() {
        return{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: this.legendPosition,
              labels: {
                usePointStyle: true,
                padding: 40,
                font: {
                  size: this.legendFontSize
                }
              }
            }
          }
        }
      },


      chartData() {
        let entireHome = 0;
        let privateRoom = 0;
        let sharedRoom = 0;
        let hotelRoom = 0;
        let unknown = 0;

        this.listings.forEach(listing => {
          switch (listing.room_type) {
            case 'Entire home/apt':
              entireHome++;
              break;
            case 'Private room':
              privateRoom++;
              break;
            case 'Shared room':
              sharedRoom++;
              break;
            case 'Hotel room':
              hotelRoom++;
              break;
            default:
              unknown++;
          }
        });
        return {
          labels: ['Entire Home', 'Private Room', 'Shared Room', 'Hotel Room'],
          datasets: [
            {
              backgroundColor: ['#E31C25', '#1E1EFF', '#FFD700', '#E01E84'],
              data: [entireHome, privateRoom, sharedRoom, hotelRoom]
            }
          ]
        }
      }
    },

    data() {
      return {
        store : useStore()
        
      }
    }
  }
</script>

<template>
  <div class="chart-container" >
    <div :class="isDashboard ? 'dashboard-mode': 'canvas-wrapper' ">
      <Pie :data="chartData" :options="chartOptions" />
    </div>

    <div v-if="!isDashboard" class = "filter-info">
      <p class="card-subtext description">{{ filterInsight.description }}</p>
      <p class="card-subtext details">{{ filterInsight.details }}</p>
    </div>
  </div>
</template>


<style scoped>
  .chart-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 0px;
    position: relative;
  }

  .canvas-wrapper {
    margin-top: 40px;
    height: 700px;
    flex-grow: 1;

    width:100%;
  }

  .dashboard-mode{
    min-height: 400px;
    width:100%;
    height: 100%;
  }

  .filter-info {

    margin-top: 5vh;
    padding: 10px 0;
    font-size: 2.3rem;
  }

  .description {
    color: #666;
    margin-bottom: 5x;
    line-height: 1.2;

  }

  

  .details{
    
    font-weight: bold;
    color: #333;
  }
  
</style>
