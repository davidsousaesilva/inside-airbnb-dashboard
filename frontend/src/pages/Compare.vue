<template>
  <div class="compare-container">

    <div class="main-content">
      
      <div class="control-panel">
        
        <div class="panel-section left-section">
          <h1 class="section-title">Choose a Place</h1>
          
          <div class="input-group">
            <select class="styled-input" v-model="tempCitySelection">
              <option value="" disabled selected>Select a region</option>
              <option v-for="cityObj in discoveredCities" :key="cityObj.city" :value="cityObj.city">
                {{ cityObj.city }}
              </option>
            </select>
            <span class="chevron">⌄</span>
          </div>

          <div class="input-group">
            <select class="styled-input" v-model="tempSelection">
              <option value="" disabled selected>Select an area</option>
              <option value="CLEAR">-- Whole City --</option>
              
              <optgroup v-for="(bairros, nomeDoGrupo) in groupedNeighbourhoods" :key="nomeDoGrupo" :label="nomeDoGrupo === 'null' ? 'Areas' : nomeDoGrupo">
                <option :value="'GRP_' + nomeDoGrupo+ ','">
                  -- All {{ nomeDoGrupo === 'null' ? '' : nomeDoGrupo }} --
                </option>
                <option v-for="bairro in bairros" :key="bairro.neighbourhood" :value="nomeDoGrupo + ',' + bairro.neighbourhood">
                  {{ bairro.neighbourhood }}
                </option>
              </optgroup>
            </select>
            <span class="chevron">⌄</span>
          </div>

          <div class="button-row">
            <button class="btn-outline" @click="confirmLocation">Add</button>
            <button class="btn-outline" @click="clearAllRows">Clear all</button>
          </div>
        </div>

        <div class="panel-section right-section">
          <div class="filters-wrapper">
             <Filters />
          </div>
        </div>

      </div>

      <div class="export-section">
        <button class="btn-export" @click="exportTable">Export Table</button>
        <button class="btn-export" @click="exportCSV">Export Data (CSV)</button>
        <button class="btn-export" @click="exportJSON">Export Data (JSON)</button>
      </div>

      <div class="data-table">
        <div class="table-row table-header">
          <div class="t-col">Location</div>
          <div class="t-col">Total Airbnbs</div>
          <div class="t-col">Average Price</div>
          <div class="t-col">Total Bookings</div>
          <div class="t-col">Total Booked Days</div>
          <div class="t-col remove-col"></div> 
        </div>
        
        <div 
          v-for="row in comparisonRows" 
          :key="row.id" 
          class="table-row table-body"
        >
          <div class="t-col location-col">
            {{ row.location }}
            <span v-if="isUpdating" style="font-size:0.7em; color:#999; margin-left:5px; font-weight:normal;">(updating...)</span>
          </div>
          <div class="t-col">{{ row.totalAirbnbs }}</div>
          <div class="t-col">{{ row.avgPrice }} €</div>
          <div class="t-col">{{ row.totalBookings }}</div>
          <div class="t-col">{{ row.bookedDays }}</div>
          
          <div class="t-col remove-col">
            <button class="btn-remove" @click="removeRow(row.id)">×</button>
          </div>
        </div>

        <div v-if="comparisonRows.length === 0" class="empty-message" style="padding:20px; text-align:center; color:#999;">
          No places added yet. Select a region and click "Add".
        </div>
      </div>

      <div class="footer-info">
        <p>Rows affected by Property Type: All | Rows affected by Time Interval: Total Bookings, Total Booked Days, <b>Average Price</b> | Rows affected by Maximum Price per Day: All</p>
        <p>The table updates automatically when you apply new filters.</p>
      </div>

    </div>
  </div>
</template>

<script>
import { useStore } from "@/stores/store";
import { mapActions, mapState } from "pinia";
import Filters from "@/components/Filters.vue";

export default {
  name: "ComparePage",
  components: {
    Filters
  },
  data() {
    return {
      store: useStore(),
      discoveredCities: [],
      tempCitySelection: '', 
      tempSelection: '',     
      comparisonRows: [],
      dataCache: {}, 
      isUpdating: false
    };
  },
  computed: {
    ...mapState(useStore, [
      'getMaximumPrice', 'getSelectedMaximumPrice',
      'getPropertyTypes', 'getSelectedPropertyType',
      'getStartDay', 'getEndDay', 'getSelectedTimeInterval'
    ]),
    
    filterSignature() {
      return `${this.getSelectedMaximumPrice}|${this.getMaximumPrice}|${this.getSelectedPropertyType}|${this.getPropertyTypes.join(',')}|${this.getSelectedTimeInterval}|${this.getStartDay}|${this.getEndDay}`;
    },

    groupedNeighbourhoods() {
      const list = this.store.getNeighbourhoodsList;
      if (!list || list.length === 0) return {};

      return list.reduce((groups, item) => {
        if (!groups[item.neighbourhood_group]) {
          groups[item.neighbourhood_group] = [];
        }
        groups[item.neighbourhood_group].push(item);
        return groups;
      }, {});
    },
  },
  watch: {
    filterSignature() {
      console.log("Filters changed. Updating table rows...");
      this.recalculateAllRows();
    },

    async tempCitySelection(newCity) {
      const cityObj = this.discoveredCities.find(c => c.city === newCity);
      if (cityObj) {
        await this.store.fetchNeighbourhoodsPerCity(cityObj.city, cityObj.country);
        this.tempSelection = '';
      }
    },
  },
  methods: {
    ...mapActions(useStore, ['fetchListings', 'fetchTotalReviews']),

    async recalculateAllRows() {
      if (this.comparisonRows.length === 0) return;
      this.isUpdating = true;

      const promises = this.comparisonRows.map(async (row) => {

        return await this.calculateRowMetrics(row.rawLocation);
      });

      const updatedResults = await Promise.all(promises);

      this.comparisonRows = this.comparisonRows.map((row, index) => {
        return { ...row, ...updatedResults[index] };
      });

      this.isUpdating = false;
    },

    async calculateRowMetrics(rawLoc) {
      const cityKey = rawLoc.city.toLowerCase();
      
      if (!this.dataCache[cityKey]) {
        try {
          const [listingsRes, reviewsRes] = await Promise.all([
            fetch(`http://localhost:3000/${cityKey}.listings`),
            fetch(`http://localhost:3000/${cityKey}.reviews`)
          ]);
          const listings = await listingsRes.json();
          const reviews = await reviewsRes.json();
          this.dataCache[cityKey] = { listings, reviews };
        } catch (e) {
          console.error("Erro fetching:", e);
          return { totalAirbnbs: '-', avgPrice: '-', totalBookings: '-', bookedDays: '-' };
        }
      }

      const { listings, reviews } = this.dataCache[cityKey];
      const nightsMap = {};
      listings.forEach(l => {
        nightsMap[l.id] = Number(l.minimum_nights) || 1;
      });

      let filteredListings = listings;

      // 1. Filtrar por Localização
      if (rawLoc.neighbourhood && rawLoc.neighbourhood !== 'CLEAR') {
        filteredListings = filteredListings.filter(l => l.neighbourhood === rawLoc.neighbourhood);
      } else if (rawLoc.group) {
        filteredListings = filteredListings.filter(l => l.neighbourhood_group === rawLoc.group);
      }

      // 2. Filtrar por Tipo de Propriedade
      if (this.store.selectedPropertyType && this.store.propertyTypes.length > 0) {
        const selectedLow = this.store.propertyTypes.map(t => t.toLowerCase());
        filteredListings = filteredListings.filter(l => {
          const roomType = (l.room_type || '').toLowerCase();
          return selectedLow.some(sel => roomType.includes(sel.split(' ')[0]));
        });
      }

      // 3. CALCULO DE PREÇO SAZONAL (Igual ao Store)
      if (this.store.selectedTimeInterval) {
        const currentYear = new Date().getFullYear();
        const start = this.store.startDay ? new Date(this.store.startDay) : new Date(currentYear, 0, 1);
        const end = this.store.endDay ? new Date(this.store.endDay) : new Date(currentYear, 11, 31);

        if (start <= end) {
          let daysInT1 = 0, daysInT2 = 0, daysInT3 = 0, daysInT4 = 0, totalDays = 0;
          let current = new Date(start);

          while (current <= end) {
            const m = current.getMonth();
            if (m <= 2) daysInT1++;
            else if (m <= 5) daysInT2++;
            else if (m <= 8) daysInT3++;
            else daysInT4++;
            totalDays++;
            current.setDate(current.getDate() + 1);
          }

          if (totalDays > 0) {
            filteredListings = filteredListings.map(listing => {
              const basePrice = Number(listing.price) || 0;
              
              const p1 = Number(listing.lymp_1t);
              const p2 = Number(listing.lymp_2t);
              const p3 = Number(listing.lymp_3t);
              const p4 = Number(listing.lymp_4t);

              const finalP1 = p1 || basePrice;
              const finalP2 = p2 || basePrice;
              const finalP3 = p3 || basePrice;
              const finalP4 = p4 || basePrice;

              const revenue = (daysInT1 * finalP1) + (daysInT2 * finalP2) + (daysInT3 * finalP3) + (daysInT4 * finalP4);
              const newPrice = Math.round(revenue / totalDays);

              return { ...listing, price: newPrice };
            });
          }
        }
      }

      // 4. Filtrar por Preço Máximo (Só depois de ajustar o preço)
      if (this.store.selectedMaximumPrice && this.store.maximumPrice > 0) {
        filteredListings = filteredListings.filter(l => (l.price || 0) <= this.store.maximumPrice);
      }

      const totalAirbnbs = filteredListings.length;
      let avgPrice = 0;
      if (totalAirbnbs > 0) {
        const sum = filteredListings.reduce((acc, l) => acc + (l.price || 0), 0);
        avgPrice = Math.round(sum / totalAirbnbs);
      }

      const visibleIDs = new Set(filteredListings.map(l => String(l.id)));
      
      let calculatedBookedDays = 0; 

      const filteredReviews = reviews.filter(r => {
        if (!visibleIDs.has(String(r.listing_id))) return false;
        
        if (this.store.selectedTimeInterval && this.store.startDay && this.store.endDay) {
          const rDate = new Date(r.date).getTime();
          const start = new Date(this.store.startDay).getTime();
          const end = new Date(this.store.endDay).getTime();
          
          const isValid = !isNaN(rDate) && rDate >= start && rDate <= end;
          
          if (isValid) {

            const minNights = nightsMap[r.listing_id] || 1;
            calculatedBookedDays += minNights;
          }
          
          return isValid;
        }
        
        const minNights = nightsMap[r.listing_id] || 1;
        calculatedBookedDays += minNights;
        return true;
      });

      return {
        totalAirbnbs: totalAirbnbs,
        avgPrice: avgPrice,
        totalBookings: filteredReviews.length.toLocaleString(),
        bookedDays: calculatedBookedDays.toLocaleString()
      };
    },

    async confirmLocation() {
      if (!this.tempCitySelection) return;

      const cityObj = this.discoveredCities.find(c => c.city === this.tempCitySelection);
      if (!cityObj) return;

      let locationName = `${cityObj.city}, ${cityObj.country}`;
      let rawData = { 
        city: cityObj.city, 
        country: cityObj.country,
        neighbourhood: null,
        group: null 
      };

      if (this.tempSelection && this.tempSelection !== 'CLEAR') {
        if (this.tempSelection.startsWith('GRP_')) {
          const groupName = this.tempSelection.replace('GRP_', '').replace(',', '');
          locationName = `All ${groupName}, ${locationName}`;
          rawData.group = groupName;
        } else {
          const [grp, neigh] = this.tempSelection.split(',');
          locationName = `${neigh}, ${locationName}`;
          rawData.neighbourhood = neigh;
          rawData.group = grp;
        }
      } else {
         rawData.neighbourhood = 'CLEAR';
      }

      const exists = this.comparisonRows.find(r => r.location === locationName);
      if (exists) return alert("This location is already added.");

      const newRow = {
        id: Date.now(),
        location: locationName,
        rawLocation: rawData,
        totalAirbnbs: '...',
        avgPrice: '...',
        totalBookings: '...', 
        bookedDays: "-"
      };
      
      this.comparisonRows.push(newRow);

      const metrics = await this.calculateRowMetrics(rawData);
      
      const index = this.comparisonRows.findIndex(r => r.id === newRow.id);
      if (index !== -1) {
        this.comparisonRows[index] = { ...newRow, ...metrics };
      }
    },

    clearAllRows() {
      this.comparisonRows = [];
      this.dataCache = {};
    },

    removeRow(idToRemove) {
      this.comparisonRows = this.comparisonRows.filter(row => row.id !== idToRemove);
    },

    async discoverCities() {
      try {
        const res = await fetch('http://localhost:3000/');
        const html = await res.text();
        const regex = /href="([^"]+\.neighbourhoods)"/g;
        const cities = [];
        let match;
        while ((match = regex.exec(html)) !== null) {
          const path = match[1].replace("http://localhost:3000/", "");
          const [countryRaw, cityRaw] = path.split(".");
          if (!countryRaw || !cityRaw) continue;
          cities.push({ 
            country: countryRaw.toUpperCase(), 
            city: cityRaw.charAt(0).toUpperCase() + cityRaw.slice(1) 
          });
        }
        this.discoveredCities = cities;
      } catch (error) { console.error(error); }
    },

    exportJSON() {
      if (this.comparisonRows.length === 0) return alert("Não há dados para exportar!");
      const jsonString = JSON.stringify(this.comparisonRows, null, 2);
      this.downloadFile(jsonString, 'application/json', 'airbnb_compare_data.json');
    },
    exportCSV() {
      if (this.comparisonRows.length === 0) return alert("Não há dados para exportar!");
      const headers = ["Location", "Total Airbnbs", "Average Price", "Total Bookings", "Booked Days"];
      const rows = this.comparisonRows.map(row => {
        const loc = `"${row.location}"`; 
        const bookings = `"${row.totalBookings}"`; 
        return [loc, row.totalAirbnbs, row.avgPrice, bookings, row.bookedDays].join(",");
      });
      const csvContent = [headers.join(","), ...rows].join("\n");
      this.downloadFile(csvContent, 'text/csv', 'airbnb_compare_data.csv');
    },
    exportTable() {
      if (this.comparisonRows.length === 0) return alert("Não há dados para exportar!");
      let tableHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"></head><body>
        <table border="1">
          <thead>
            <tr>
              <th>Location</th>
              <th>Total Airbnbs</th>
              <th>Average Price (€)</th>
              <th>Total Bookings</th>
              <th>Booked Days</th>
            </tr>
          </thead>
          <tbody>`;
      this.comparisonRows.forEach(row => {
        tableHTML += `<tr><td>${row.location}</td><td>${row.totalAirbnbs}</td><td>${row.avgPrice}</td><td>${row.totalBookings}</td><td>${row.bookedDays}</td></tr>`;
      });
      tableHTML += `</tbody></table></body></html>`;
      this.downloadFile(tableHTML, 'application/vnd.ms-excel', 'airbnb_table_export.xls');
    },
    downloadFile(content, mimeType, fileName) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  },
  
  mounted() {
    this.discoverCities();
  }
};
</script>

<style scoped>
.compare-container {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #333;
  background-color: #fff;
  padding: 60px 40px 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.control-panel {
  display: flex;
  gap: 80px;
  margin-bottom: 50px;
}
.left-section { 
  flex: 0 0 300px; 
}

.right-section { 
  flex: 1; 
  min-width: 0; 
}

.filters-wrapper { 
  transform-origin: top left; 
  transform: scale(0.95); 
  margin-top: -35px; 
}

.section-title { 
  font-size: 2rem; 
  font-weight: 500; 
  margin-bottom: 35px; 
  margin-top: 0;
}

.input-group { 
  position: relative; 
  margin-bottom: 15px; 
}

.styled-input {
  width: 100%; 
  padding: 12px 10px; 
  border: 1px solid #999; 
  border-radius: 4px;
  background: white; 
  appearance: none; 
  font-size: 1rem; 
  color: #555; 
  cursor: pointer;
}

.chevron { 
  position: absolute; 
  right: 15px; 
  top: 12px; 
  pointer-events: none; 
  font-size: 1.2rem; 
  color: #999; 
}

.button-row { 
  display: flex; 
  gap: 15px; 
  margin-top: 25px; 
}

.btn-outline {
  flex: 1; 
  padding: 6px; 
  border: 1px solid #999; 
  background: white; 
  border-radius: 4px;
  font-size: 0.9rem; 
  cursor: pointer;
}

.btn-outline:hover { 
  background-color: #f7f7f7; 
}

.export-section { 
  display: flex; 
  justify-content: space-between; 
  gap: 20px; 
  margin-bottom: 30px; 
}

.btn-export {
  flex: 1; 
  padding: 12px; 
  border: 1px solid #666; 
  background: white;
  border-radius: 4px; 
  font-weight: 500; 
  font-size: 0.95rem; 
  cursor: pointer;
}

.btn-export:hover { 
  background-color: #f7f7f7; 
}

.data-table { 
  border: 1px solid #666; 
  margin-bottom: 20px; 
}

.table-row { 
  display: grid; 
  grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 50px; 
  text-align: center; 
}

.btn-remove { 
  background: transparent; 
  border: none; 
  font-size: 1.5rem; 
  color: #999; 
  cursor: pointer; 
  line-height: 1; 
}

.btn-remove:hover { 
  color: #ff4444; 
}

.remove-col { 
  border-right: none; 
}

.table-header { 
  background: #f9f9f9; 
  font-weight: 700; 
  border-bottom: 1px solid #666; 
  font-size: 0.9rem; 
}

.table-body { 
  font-weight: 500; 
  font-size: 1rem; 
}

.t-col { 
  padding: 15px 5px; 
  border-right: 1px solid #666; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}

.location-col { 
  justify-content: flex-start; 
  padding-left: 20px; 
  font-weight: 600; 
}

.t-col:last-child { 
  border-right: none; 
}

.footer-info { 
  font-size: 0.75rem; 
  color: #333; 
  line-height: 1.4; 
}

.footer-meta { 
  margin-top: 10px; 
  color: #555; 
  }

</style>