<script>
  import { Bar } from 'vue-chartjs';
  import { useStore } from '@/stores/store';
  import { mapState } from 'pinia';


  export default {
    name: 'ActivityChart',
    components: {
      Bar
    },
    props: {
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
        const data = this.listings;
        return data.map(listing => {
          const occupancy = 365 - Number(listing.availability_365);
          return {
            name: listing.name || 'N/A',
            occupancy_days: occupancy,
            availability_365: listing.availability_365 || 'N/A'
          };
        });
      }
    },
    computed: {
       ...mapState(useStore, {
        listings: 'getFilteredListings',
      }),
      
      filterInsight() {
        const propertyType = this.store.getSelectedPropertyType
          ? this.store.getPropertyTypes.join(', ')
          : 'All';
        const maxPrice = this.store.getSelectedMaximumPrice
          ? `${this.store.getMaximumPrice}€`
          : `No limit`

        return {
          description: "The information of this chart has a time interval of 12 months and applies the selected Property Type and Maximum Price per Day filters. The booked days are calculated using the calendar data, which indicates whether a listing was active or inactive on each day.",
          details: `Property Type: ${propertyType} | Maximum Price per day: ${maxPrice}`
        }
      },


      chartData() {
        const bins =new Array(13).fill(0);
        this.listings.forEach(listing => {
          const occupancy = 365 - Number(listing.availability_365);


          if (occupancy === 0) bins[0]++;
          else bins[Math.min(Math.round(occupancy / 30) , 12)]++;
        });
        return {
          labels: ['0', '1-30', '31-60', '91-120', '120-150', '151-180', '181-210', '211-240',"241-270", "271-300", "301-330", "331-365"],
          datasets: [
            {
              label: 'Listings',
              backgroundColor: '#E31C25',
              data: bins,
              barPercentage: 0.7,
            }
          ]
        };

      },
      chartOptions(){
        return{
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: false
            }
          },
          scales: {
            y: {
              grid:{
                display:false,
              },
              beginAtZero: true,
              title: {
                display: true,
                text: 'listings',
                font: {
                  weight: 'bold',
                  size: this.legendFontSize,
                }
              },
              ticks: {
                font: {
                  size:22,
                }
              }
            },
            x:{
              grid:{
                display:false,
              },
              title: {
                display:true,
                text: 'occupancy in days (last 12 months)',
                font: { 
                  weight: 'bold',
                  size: this.legendFontSize,
                }
              },
              ticks: {
                font: {
                  size:22,
                }
              }
            }
          }
        }
      }

    },
    data(){
      return{
        store: useStore()
      }
    }
  }
</script>

<template>
  <div class="chart-container">
    <div :class="isDashboard ? 'dashboard-mode': 'canvas-wrapper' ">
      <Bar :data="chartData" :options="chartOptions" />
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
    padding: 10px;
    position: relative;
  }


  h3 {
    font-size: 1.5rem;
    color: #666;
    margin-bottom: 15px;
    margin-left: 10px;
    font-family: sans-serif;
  }

  .canvas-wrapper {
    flex-grow: 1;
    position: relative;
    height:700px;

    width:100%;
    overflow:hidden;
  }

  .dashboard-mode{
    min-height: 400px;
    width:100%;
  }


  .filter-info {

    margin-top: 20px;
    padding-top: auto;
    padding: 10px 0;
    font-size: 2.3rem;
  }

  .description {
    color: #666;
    margin-bottom: 5px;
    line-height: 1.2;

  }

  .details{
    
    font-weight: bold;
    color: #333;
  }
  

</style>
