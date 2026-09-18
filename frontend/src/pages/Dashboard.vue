<template>
  <header>
    <div class="choose-a-place-wrapper">

    
      
      <!-- <p>isCity: {{ store.getIsCity }}</p> -->
      <!-- <p>isNeighbourhoodGroup: {{ store.getIsNeighbourhoodGroup }}</p> -->
      <!-- <p>isNeighbourhood: {{ store.getIsNeighbourhood }}</p> -->
      <!-- <p>city: {{ store.getCity }}</p> -->
      <!-- <p>neighbourhoodGroup: {{ store.getNeighbourhoodGroup }}</p> -->
      <!-- <p>neighbourhood: {{ store.getNeighbourhood }}</p> -->
      <!-- <p>country: {{ store.getCountry }}</p> -->

      <!-- <p>startDay: {{ store.getStartDay }}</p> -->
      <!-- <p>endDay: {{ store.getEndDay }}</p> -->
       
      
      <h2>Choose a place</h2>
      <div class="selection-grid">
        <div class="input-group">
          <label class="input-label">{{ store.getCountry.toUpperCase() || 'COUNTRY' }}</label>

          <select class= "custom-select" v-model="tempCitySelection" >
            <option v-if="discoveredCities.length === 0" disabled>Loading Cities...</option>

            <option v-for="cityObj in discoveredCities" :key="cityObj.city" :value="cityObj.city">
              {{ cityObj.city }}
            </option>
          </select>
        </div>

        <button class="btn-outline" @click="confirmLocation">Set your location</button>

        <div class="input-group">
          <label class="input-label">
            {{ (store.neighbourhoodGroup && store.neighbourhoodGroup !== 'null') ? store.neighbourhoodGroup : 'Select Area' }}
          </label>

          <select class= "custom-select" v-model="tempSelection">
            <option value="" disabled selected>Select Area</option>
            <option value="CLEAR">-- Ver cidade inteira --</option>

            <optgroup v-for="(bairros, nomeDoGrupo) in groupedNeighbourhoods" :key="nomeDoGrupo" :label="nomeDoGrupo === 'null' ? '' : nomeDoGrupo">
              <option :value="'GRP_' + nomeDoGrupo+ ','">
                -- All {{ nomeDoGrupo === 'null' ? '' : nomeDoGrupo + "'s" }} neighbourhoods  --
              </option>
              <option v-for="bairro in bairros" :key="bairro.neighbourhood" :value="nomeDoGrupo + ',' + bairro.neighbourhood">
                {{ bairro.neighbourhood }}
              </option>

            </optgroup>
            
          </select>
        </div>

        <button class="btn-outline" @click="viewMap">View Map</button>
        
      </div>
      <p class="current-viewing">Currently viewing: {{ fullLocationString }}</p>
    </div>
    <div class="filters-wrapper">
      <Filters />
    </div>
  </header>

  <main class="dashboard-wrapper">
    <div class="card area-total">
      <div class="card-content">
        <h3 class="title">Number of Total AirBnbs</h3>
        <p class="card-value">{{ totalListingsCount }}</p>
        <p class="card-subtext">The data reflects the current situation</p>
      </div>
    </div>
     
    <div class="card cardh area-price" @click="goToCard('avg-price')">
      <div class="card-content">
        <h3 class="title">Average Price per Day</h3>
        <p class="card-value">{{ averagePrice }} €</p>
        <p class="card-subtext">Affected by: Property type and Time interval.</p>
      </div>
    </div>

    <div class="card area-location" v-if="!store.getIsNeighbourhood">
      <div class="card-content">
        <h3 class="title">Location with most AirBnbs</h3>
        <p class="card-value" >{{locationMostAirbnbs}}</p>
        <p class="card-subtext">
          {{ store.getIsNeighbourhoodGroup ? `Top neighbourhood in ${ store.getNeighbourhoodGroup }` : `Top area in ${ store.getCity }` }} with the highest number of Airbnbs
        </p>
      </div>
    </div>

    <div class="card area-bookings">
      <div class="card-content">
        <h3 class="title">Total Bookings made</h3>
        <p class="card-value">{{store.getTotalReviews.toLocaleString()}}</p> 
        <p class="card-subtext">Approximated Based on reviews and affected by Time filter.</p>
      </div>
    </div>

    <div class="card cardh chart-card area-pie" @click="goToCard('pie-chart')">
      <h3 class="title">Type of property distribution</h3>
      <PieChart :is-dashboard="true" :legend-font-size="25"/>
    </div>

    <div class="card cardh chart-card area-activity" @click="goToCard('activity')">
      <h3 class="title">Type of property distribution</h3>
      <ActivityChart :is-dashboard="true" :legend-font-size="25"/>
    </div>

    <div class="card cardh area-anomalies" @click="goToCard('anomalies')">
      <div class="card-content">
        <h3 class="title">Anomalies detected</h3>
        <ul class="preview-list">
          <li v-for="a in anomaliesPreview" :key="a.id" class="preview-row">
            <span class="col-name bold">{{ a.name }}</span>
            <span :class="['col-value', getAnomalyColorClass(a)]">{{ getAnomalyText(a) }}</span>
          </li>
        </ul>
        <p class="view-more">view more</p>
      </div>
    </div>

    <div class="card cardh area-hosts" @click="goToCard('hosts')">
      <div class="card-content">
        <h3 class="title">Total Airbnbs per host</h3>
        <ul class="preview-list">
          <li v-for="h in hostsPreview" :key="h.host" class="preview-row">
            <span class="col-name bold">{{ h.host }}</span>
            <span class="col-value">{{ h.total }}</span>
          </li>
        </ul>
        <p class="view-more">view more</p>
      </div>
    </div>
  </main>
</template>

<script>
import Filters from "@/components/Filters.vue";
import { useStore } from "@/stores/store";
import { useRouter } from "vue-router";
import PieChart from "../components/detail/PieChart.vue";
import ActivityChart from "../components/detail/ActivityChart.vue";
import {mapActions, mapState} from "pinia";

export default {
  components: {
    Filters,
    PieChart,
    ActivityChart,
  },
  computed: {
    ...mapState(useStore, {
      listings: 'getFilteredListings',
      totalListingsCount: 'totalListingsCount'
    }),

    locationMostAirbnbs() {
      if (this.listings.length === 0) {
        return "-";
      }


      if (this.store.getIsNeighbourhood) {
        return this.store.getNeighbourhood;
      
      } 
      const counts={};

      if (this.store.getIsNeighbourhoodGroup) {
       
        this.listings.forEach(l => {
          const key = l.neighbourhood;
          if (key) counts[key] = (counts[key] || 0) + 1;
        });

        return Object.keys(counts).reduce((a,b) => counts[a] > counts[b] ? a : b);
      }
      
      this.listings.forEach(listing => {
        const key = listing.neighbourhood_group || listing.neighbourhood;  //se não tiver group, tenta o bairro
        if (key) counts[key] = (counts[key] || 0) + 1;
      });

      const keys = Object.keys(counts);
      if (keys.length === 0) return "No data available";

      return keys.reduce((a,b) => counts[a] > counts[b] ? a : b);
    },

    totalListingsCount() {
      return this.listings.length;
    },

    averagePrice() {
      if(this.totalListingsCount === 0) return 0;

      const totalPrice = this.listings.reduce((sum, listing) => {
        return sum + (listing.price || 0);
      }, 0);

      return Math.round(totalPrice / this.listings.length);
    },

  
    anomaliesPreview(){
      return this.listings.filter(l => l.number_of_reviews >100 || l.availability_365 > 300).slice(0,3)
    },

    hostsPreview(){
      const counts={};
      this.listings.forEach(l => {
        counts[l.host_name] = (counts[l.host_name] || 0) +1;
      });
      return Object.entries(counts).map(([host,total])=>({host, total})).sort((a,b) => b.total - a.total).slice(0,3);
    },

    groupedNeighbourhoods(){
      const list = this.store.getNeighbourhoodsList;
      if(!list || list.length ===0) return {};

      return list.reduce((groups, item) => {
        if (!groups[item.neighbourhood_group]) {
          groups[item.neighbourhood_group] = [];
        }
        groups[item.neighbourhood_group].push(item);
        return groups;
      }, {});
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

      return parts.filter(Boolean).join(', ');

    },
  },
  methods: {
    goToCard(type) {
      this.router.push({ path: `/card/${type}` });
    },
    ...mapActions(useStore, ['fetchListings']),

    getAnomalyText(anomaly) {
      if (anomaly.availability_365 > 300) {
        return `>300 nights per year`;
      }
       else if (anomaly.number_of_reviews > 100) {
        return `Many reviews, few bookings.`;
      }
      return 'Suspicious';
    },

    getAnomalyColorClass(anomaly) {
      if (anomaly.availability_365 > 300) {
        return 'text-red';
      } else if (anomaly.number_of_reviews > 100) {
        return 'text-yellow';
      }
      return 'text-red';
    },

    async discoverCities() {
      try{
        const res = await fetch('http://localhost:3000/');
        const html = await res.text();
        
        const regex = /href="([^"]+\.neighbourhoods)"/g;
        const cities = [];
        let match;

        while ((match = regex.exec(html)) !== null) {
          const path = match[1].replace("http://localhost:3000/", "");
          const [countryRaw, cityRaw] = path.split(".");

          if (!countryRaw || !cityRaw) continue;
          const country = countryRaw.toUpperCase();
          const city = cityRaw.charAt(0).toUpperCase() + cityRaw.slice(1);

          cities.push({ country, city });
        }
        

        this.discoveredCities = cities;
      } catch (error) {
        console.error('Error fetching discovered cities:', error);
      }
    },


    viewMap() {
      if (this.listings.length === 0) {return;}

      

      const lats = this.listings.map(l => parseFloat(l.latitude));
      const lngs = this.listings.map(l => parseFloat(l.longitude));

      const center = {
        lat:  lats.reduce((a,b) => a + b, 0) / lats.length,
        lng:  lngs .reduce((a,b) => a + b, 0) / lngs.length,
      };

      let zoom = 12;
      if (this.store.getIsNeighbourhood) {
        zoom = 15;
      } else if (this.store.getIsNeighbourhoodGroup) {
        zoom = 13;
      }

      this.store.setMapFocus(center, zoom);
      this.router.push({ path: '/map' });
    },

    async confirmLocation() {
      if (!this.tempCitySelection) return;


      const cityObj = this.discoveredCities.find(c => c.city === this.tempCitySelection);

      if (cityObj) {
        this.store.setCity(cityObj.city, cityObj.country);

        if (this.tempSelection && this.tempSelection !== 'CLEAR') {

          this.store.setNeighbourhood(this.tempSelection);

        }else{
          this.store.setNeighbourhood('CLEAR');
        }

        await Promise.all([
          this.store.fetchListings(),
          this.store.fetchTotalReviews()
        ]);
      }
       

    },

    


  },
  created() {
    this.fetchListings();
  },
  watch: {
    async tempCitySelection(newCity) {
      const cityObj = this.discoveredCities.find(c => c.city === newCity);
      if (cityObj) {
        await this.store.fetchNeighbourhoodsPerCity(cityObj.city, cityObj.country);
        this.tempSelection = '';
      }
    },
  },
  data() {
    return {
      store: useStore(),
      router: useRouter(),
      discoveredCities: [],
      tempSelection: '',
      tempCitySelection: '',
    };
  },
  async mounted() {
    this.discoverCities();

    if(this.store.city){
      this.tempSelection = this.store.currentSelectionValue;
      this.tempCitySelection = this.store.getCity;
      await this.store.fetchNeighbourhoodsPerCity(this.store.getCity, this.store.getCountry);
      await Promise.all([
            this.store.fetchListings(),
            this.store.fetchTotalReviews()
        ]);
    }
  }

  // Created(){ chama uma função (que vai estar na store) para calcular dados a mostrar (escreve em variavel/variaveis), com base na escolha de localidade e filtros atuais (filtros default) }
};
</script>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
}

.choose-a-place-wrapper {
  margin-left: 40px;
  font-size: 2.5rem;
  margin-bottom: 0px;
  min-width: 600px;
  font-family:sans-serif;
}

.selection-grid {
  display: grid;
  grid-template-columns: minmax(200px, 2fr) minmax(200px, 2fr);
  gap: 15px;
  margin-bottom: 20px;
}

.input-group {
  border: 1px solid #999;
  border-radius: 4px;
  padding: 5px 10px;
  display: flex;
  flex-direction: column;
  background: white;
}

.input-label {
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
}

.custom-select {
  border: none;
  outline: none;
  font-size: 1.2rem;
  background: transparent;
  cursor: pointer;
  width: 100%;
}

.btn-outline {
  border: 1px solid #333;
  background: white;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  height: 100%;
  transition: background 0.2s;
}

.btn-outline:hover {
  background: #f0f0f0;
}

.current-viewing {
  font-weight: bold;
  font-size: 1.7rem;
  margin-top: 40px;
}

.filters-wrapper {
  transform: scale(0.75);
  transform-origin: top right;
  margin-right: 100px;
  margin-top : 40px;
}

.dashboard-wrapper {
  min-width: 1250px;
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  grid-template-rows: 250px 250px 250px 250px;
  grid-template-areas:
    "card1a card1b card2"
    "card1c card1d card2"
    "card3  card3  card4a"
    "card3  card3  card4b";
  gap: 30px;
  margin: 0px 40px 40px;
}

.area-total {
  grid-area: card1a;
}
.area-price {
  grid-area: card1b;
}
.area-location {
  grid-area: card1c;
}
.area-bookings {
  grid-area: card1d;
}
.area-pie {
  grid-area: card2;
}
.area-activity {
  grid-area: card3;
}
.area-anomalies {
  grid-area: card4a;
}
.area-hosts {
  grid-area: card4b;
}

.card {
  background-color: rgb(238, 246, 252);
  border: 1px solid #000;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow:hidden;
  min-width: 390px;
}

.chart-card {
  padding: 10px 15px;
  min-height: 0;
  min-width: 650px;
}


.card-content {
  padding-left: 20px;
  
}
.title{
  font-weight: normal;
    color: #333;
    font-size: 1.8rem;
  }
.card-value {
  font-size: 3rem;
  font-weight: bold;
  margin: 15px 0;
}

.bold { font-weight: bold; }
.text-red { color: #b71c1c; }
.text-yellow { color: #c4b944; }

.card-subtext {
  font-size: 1.5rem;
  color: #555;
}

.cardh:hover {
  box-shadow: 0 0 0 1px;
  cursor: pointer;
}

.preview-list {
  font-size: 1.6rem;
  list-style-type: none;
  padding-left: 0px;
  padding-right: 20px;
  margin-top: 0px;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 5px;
  width: 100%;
}

.col-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.view-more{
  font-size: 1.5rem;
  font-weight:500;
  color: blue;
  text-align: center;
  
}

.view-more:hover{
  text-decoration: underline;
  cursor: pointer;
  color:#FFA53F;
  
}
</style>
