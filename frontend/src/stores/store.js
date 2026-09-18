import { defineStore } from "pinia";

export const useStore = defineStore("store", {
  state: () => ({
    
    // Localização
    isCity: false,
    isNeighbourhoodGroup: false,
    isNeighbourhood: false,
    city: "",
    neighbourhoodGroup: "",
    neighbourhood: "",
    country: "",
    neighbourhoodsList: [],
    
    // Dados
    listings: [],
    totalReviews: 0,
    loading: false,
    error: null,

    // Filtros - Estado
    selectedPropertyType: false,   // Checkbox Mestra (On/Off)
    selectedTimeInterval: true,    // Checkbox Mestra (On/Off)
    selectedMaximumPrice: false,   // Checkbox Mestra (On/Off)
    
    propertyTypes: [],      
    startDay: null,
    endDay: null,
    maximumPrice: 0,

    // Mapa
    mapFocus: {
      center: { lat: 0, lng: 0 },
      zoom: 12,
    }
  }),

  getters: {
    // Getters Básicos
    getListings: (state) => state.listings,
    totalListingsCount: (state) => state.listings.length,
    getTotalReviews: (state) => state.totalReviews,

    // Getters de Localização
    getIsCity: (state) => state.isCity,
    getCity: (state) => state.city,
    getIsNeighbourhoodGroup: (state) => state.isNeighbourhoodGroup,
    getNeighbourhoodGroup: (state) => state.neighbourhoodGroup,
    getIsNeighbourhood: (state) => state.isNeighbourhood,
    getNeighbourhood: (state) => state.neighbourhood,
    getNeighbourhoodsList: (state) => state.neighbourhoodsList,
    getCountry: (state) => state.country,

    // Getters dos Filtros
    getSelectedPropertyType: (state) => state.selectedPropertyType,
    getSelectedTimeInterval: (state) => state.selectedTimeInterval,
    getSelectedMaximumPrice: (state) => state.selectedMaximumPrice,
    getPropertyTypes: (state) => state.propertyTypes,
    getStartDay: (state) => state.startDay,
    getEndDay: (state) => state.endDay,
    getMaximumPrice: (state) => state.maximumPrice,

    currentSelectionValue: (state) => {
      if(state.isNeighbourhood && state.neighbourhood){
        return `${state.neighbourhoodGroup},${state.neighbourhood}`;
      } else if (state.isNeighbourhoodGroup && !state.isNeighbourhood){
        return 'GRP_' + state.neighbourhoodGroup;
      } else {
        return '';
      }
    },

    getFilteredListings: (state) => {
      let result = state.listings || [];

      if (state.isNeighbourhood && state.neighbourhood) {
        result = result.filter(l => l.neighbourhood === state.neighbourhood);
      } else if (state.isNeighbourhoodGroup && state.neighbourhoodGroup) {
        result = result.filter(l => l.neighbourhood_group === state.neighbourhoodGroup);
      }

      if (state.selectedPropertyType && state.propertyTypes.length > 0) {
        const selectedLow = state.propertyTypes.map(t => t.toLowerCase());
        result = result.filter(l => {
          const roomType = (l.room_type || '').toLowerCase();
          return selectedLow.some(selected => roomType.includes(selected.split(' ')[0]));
        });
      }

      if (state.selectedTimeInterval) {
        
        const currentYear = new Date().getFullYear();
        const start = state.startDay ? new Date(state.startDay) : new Date(currentYear, 0, 1);
        const end = state.endDay ? new Date(state.endDay) : new Date(currentYear, 11, 31);

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
              let changedCount = 0;
              let staticCount = 0;

              result = result.map(listing => {

                const basePrice = Number(listing.price) || 0;

                const p1 = Number(listing.lymp_1t);
                const p2 = Number(listing.lymp_2t);
                const p3 = Number(listing.lymp_3t);
                const p4 = Number(listing.lymp_4t);

                const hasSeasonalData = p1 || p2 || p3 || p4;

                const finalP1 = p1 || basePrice;
                const finalP2 = p2 || basePrice;
                const finalP3 = p3 || basePrice;
                const finalP4 = p4 || basePrice;

                const revenue = (daysInT1 * finalP1) + (daysInT2 * finalP2) + (daysInT3 * finalP3) + (daysInT4 * finalP4);
                const newPrice = Math.round(revenue / totalDays);

                if (hasSeasonalData && newPrice !== basePrice) {
                  changedCount++;
                } else {
                  staticCount++;
                }

                return { 
                  ...listing, 
                  price: newPrice 
                };
              });

            }
        }
      }

      if (state.selectedMaximumPrice && state.maximumPrice > 0) {
        result = result.filter(l => (l.price || 0) <= state.maximumPrice);
      }

      return result;
    },
  },

  actions: {
    // Carregar Casas (Backend)
    async fetchListings(){
      this.loading = true;
      try {
        if (!this.city) return;
        const cityEndpoint = this.city.toLowerCase();
        const response = await fetch(`http://localhost:3000/${cityEndpoint}.listings`);

        if(!response.ok) throw new Error('Erro ao ligar ao servidor');

        const data = await response.json();
        this.listings = data;
        console.log("Dados recebidos:", this.listings.length);
      } catch(error){
        console.error("ERRO fetchListings: ", error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    // Carregar Reviews (Calcula com base na Data)
    async fetchTotalReviews(){
      try{
        if (!this.city || !this.country) return;

        const countryKey = this.country.toLowerCase();
        const cityKey = this.city.toLowerCase();

        const endpoint = `http://localhost:3000/${cityKey}.reviews`;
        const response = await fetch(endpoint);

        if (!response.ok) throw new Error('Erro ao carregar reviews');

        const allreviews = await response.json();
        
        const visibleListingIDs = new Set(this.getFilteredListings.map(l => String(l.id)));
        
        const filteredReviews = allreviews.filter(review => {

          if(!visibleListingIDs.has(String(review.listing_id))) return false;

          if(this.selectedTimeInterval && this.startDay && this.endDay) {
            const reviewDate = new Date(review.date).getTime();
            const start = new Date(this.startDay).getTime();
            const end = new Date(this.endDay).getTime();
            return !isNaN(reviewDate) && reviewDate >= start && reviewDate <= end;
          }

          return true;
        });

        this.totalReviews = filteredReviews.length;
        console.log("Total reviews filtradas:", this.totalReviews); 

      } catch (error) {
        console.error("Erro ao carregar reviews: ", error);
        this.totalReviews = 0;
      }
    },

    // Buscar Bairros
    async fetchNeighbourhoods(){
      this.fetchNeighbourhoodsPerCity(this.city, this.country);
    },

    async fetchNeighbourhoodsPerCity(cityName, countryName){
      try{
        const countryKey = countryName.toLowerCase();
        const cityKey = cityName.toLowerCase();
        const endpoint = `http://localhost:3000/${countryKey}.${cityKey}.neighbourhoods`;
        const response = await fetch(endpoint);
        
        if(!response.ok) throw new Error('Erro neighbourhoods');
        
        this.neighbourhoodsList = await response.json();
      } catch(error){
        console.error("ERRO neighbourhoods: ", error);
        this.neighbourhoodsList = [];
      }
    },

    // Setters de Localização
    setCity(name, country) {
      this.resetLocation();
      this.isCity = true;
      this.city = name;
      this.country = country;

      this.fetchListings();
      this.fetchNeighbourhoods();
      this.fetchTotalReviews();
    },

    setNeighbourhood(value){
      if(value === "CLEAR"){
        this.isNeighbourhood = false;
        this.neighbourhood = "";
        this.isNeighbourhoodGroup = false;
        this.neighbourhoodGroup = "";
        return;
      }

      if(value.startsWith('GRP_')){
        const groupName = value.replace('GRP_', '').replace(',', '');
        this.isNeighbourhoodGroup = true;
        this.neighbourhoodGroup = groupName;
        this.isNeighbourhood = false;
        this.neighbourhood = "";
      } else {
        const [groupName, neighbourhoodName] = value.split(',');
        this.isNeighbourhood = true;
        this.neighbourhood = neighbourhoodName;
        this.neighbourhoodGroup = groupName;
        this.isNeighbourhoodGroup = true;
      }
    },

    resetLocation() {
      this.isCity = false;
      this.city = "";
      this.isNeighbourhoodGroup = false;
      this.isNeighbourhood = false;
      this.neighbourhoodGroup = "";
      this.neighbourhood = "";
      this.country = "";
      this.neighbourhoodsList = [];
    },

    // Setters de Filtros
    setSelectedPropertyType(value) { this.selectedPropertyType = value; },
    setSelectedTimeInterval(value) { this.selectedTimeInterval = value; },
    setSelectedMaximumPrice(value) { this.selectedMaximumPrice = value; },

    addPropertyType(type) {
      if (!this.propertyTypes.includes(type)) this.propertyTypes.push(type);
    },
    removePropertyType(type) {
      this.propertyTypes = this.propertyTypes.filter((t) => t !== type);
    },
    clearPropertyTypes() {
      this.propertyTypes = [];
    },

    setStartDay(date) { this.startDay = date; },
    setEndDay(date) { this.endDay = date; },
    setMaximumPrice(value) { this.maximumPrice = value; },

    resetFilters() {
      this.selectedPropertyType = false;
      this.selectedTimeInterval = true;
      this.selectedMaximumPrice = false;
      this.propertyTypes = [];
      this.startDay = null;
      this.endDay = null;
      this.maximumPrice = 0;
    },

    setMapFocus(center, zoom) {
      this.mapFocus = { center, zoom };
    },
  },
});