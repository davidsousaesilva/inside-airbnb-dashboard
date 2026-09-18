<script>
  import { mapState } from 'pinia';
  import { Line } from 'vue-chartjs';
  import { useStore } from '@/stores/store';

  export default {
    name: 'AvgPriceChart',
    components: {
      Line
    },
    props: {
      displayTitle: {
        type: Boolean,
        default: true
      }
    },
    methods:{
      getExportData(){
        const labels = this.chartData.labels;
        const dataValues = this.chartData.datasets[0].data;

        return labels.map((label, index)=> {
          return {
            'Quarter Ending': label,
            'Average Price (€/day)': dataValues[index],
            'Location': this.fullLocationString.split(' - ')[0]
          }
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
          ? `${this.store.getMaximumPrice}`
          : 'No limit'; 

        return {
          description: "The information of this chart has a time interval of 12 months and applies the selectes Property Type and Maximum Price per Day filters.",
          details: `Property Type: ${propertyType} | Maximum Price per Day: ${maxPrice}`
        
        };
      },
      fullLocationString() {
        const parts = [];
        if (this.store.getNeighbourhood) {
            parts.push(this.store.getNeighbourhood);
        }
        if (this.store.getNeighbourhoodGroup && this.store.getNeighbourhoodGroup !== 'null') {
            parts.push(this.store.getNeighbourhoodGroup.toLowerCase());
        }
        parts.push(this.store.getCity);
        parts.push(this.store.getCountry);

        return parts.filter(Boolean).join(', ') + ' - Average Price per Day per Quarter';

      },
      chartData() {
        const counts = {
          'March': { total: 0, count: 0 },
          'June': { total: 0, count: 0 },
          'September': { total: 0, count: 0 },
          'December': { total: 0, count: 0 }
        };

        this.listings.forEach(listing => {
          if (listing.last_review) {
            
            const p1 = Number(listing.lymp_1t) || 0;
            const p2 = Number(listing.lymp_2t) || 0;
            const p3 = Number(listing.lymp_3t) || 0;
            const p4 = Number(listing.lymp_4t) || 0;

            // Março (T1)
            if (p1 > 0) {
              counts['March'].total += p1;
              counts['March'].count++;
            }
            
            // Junho (T2)
            if (p2 > 0) {
              counts['June'].total += p2;
              counts['June'].count++;
            }
            
            // Setembro (T3)
            if (p3 > 0) {
              counts['September'].total += p3;
              counts['September'].count++;
            }
            
            // Dezembro (T4)
            if (p4 > 0) {
              counts['December'].total += p4;
              counts['December'].count++;
            }
          }
        });

        const getAvg = (key) => {
          return counts[key].count === 0 ? 0 : Math.round(counts[key].total / counts[key].count);
        };

        return {
          // Ordem cronológica: Março -> Junho -> Setembro -> Dezembro
          labels: ['March', 'June', 'September', 'December'],
          datasets: [
            {
              label: 'Avg Price (€/day)',
              backgroundColor: '#000eff',
              pointBackgroundColor: '#000eff',
              borderColor: '#000eff',
              data: [
                getAvg('March'),
                getAvg('June'),
                getAvg('September'),
                getAvg('December')
              ],
              tension: 0,
              pointRadius: 5
            }
          ]
        };
      },
      chartOptions() {
        
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title:{
              display: true,
              text: this.fullLocationString,
              align: 'start',
              font: {
                weight: 'normal',
                size: 40
              },
              color: '#666',
              padding: {bottom: 20}
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.parsed.y + '€';
                }
              }
            }
          },
          scales: {
            y: {
              grid: {
                display: false
              },
              beginAtZero: true,
              title: {
                display: true,
                text: 'Price (€/day)',
                font: {
                  weight: 'bold',
                  size: 20,
                }
              },
              ticks: {
                font: {
                  size: 18,
                }
              }
            },
            x:{
              title: {
                display:true,
                text: 'Month',
                font: { 
                  weight: 'bold',
                  size: 20,
                }
              },
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 18,
                }
              }
            }
          }
        }
      }
    },


    data(){
      return{
        store: useStore(),
        
      }
    }
  }
</script>

<template>
  <div class="chart-container">
    <h3 v-if="displayTitle">Total Airbnbs Evolution:</h3>

    <div class="canvas-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <div class = "filter-info">
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
    padding-top: 70px;
    position: relative;
    min-height: 1000px;
  }


  h3 {
    font-size: 1.5rem;
    color: #666;
    margin-bottom: 15px;
    padding-top: 10px;
    font-family: sans-serif;
  }

  .canvas-wrapper {
    height:700px;
    flex-grow: 1;
    position: relative;

    width:100%;
    overflow:hidden;
  }

  .filter-info {

    margin-top: 50px;
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