<template>
  <div class="filters">
    <h2>Filters</h2>

    <div class="row">
      <div class="col-left">
        <div class="filter-section">
          <div class="label-line">
            <span>Property type</span>
            <input type="checkbox" v-model="localSelectedPropertyType" />
          </div>

          <div class="property-types">
            <button
              v-for="type in constantPropertyTypes"
              :key="type"
              :class="{
                'property-active': localPropertyTypes.includes(type),
              }"
              @click="toggleLocalPropertyType(type)"
            >
              {{ type }}
            </button>
          </div>
        </div>
      </div>

      <div class="col-right">
        <div class="filter-section">
          <div class="label-line">
            <span>Time interval</span>
            <input type="checkbox" v-model="localSelectedTimeInterval" />
          </div>

          <div class="time-interval-slider">
            <div class="track"></div>

            <div
              class="range-highlight"
              :style="{
                left: startPercent + '%',
                width: endPercent - startPercent + '%',
              }"
            ></div>

            <input
              type="range"
              class="thumb thumb-start"
              :min="minTimestamp"
              :max="maxTimestamp"
              v-model.number="localStartTimestamp"
              @input="onStartChange"
            />
            <input
              type="range"
              class="thumb thumb-end"
              :min="minTimestamp"
              :max="maxTimestamp"
              v-model.number="localEndTimestamp"
              @input="onEndChange"
            />

            <span
              class="date-label start-label"
              :style="{ left: startPercent + '%' }"
            >
              {{ formatDate(localStartTimestamp) }}
            </span>
            <span
              class="date-label end-label"
              :style="{ left: endPercent + '%' }"
            >
              {{ formatDate(localEndTimestamp) }}
            </span>
          </div>
        </div>

        <div class="right-bottom">
          <div class="filter-section filter-section-price">
            <div class="label-line">
              <span>Maximum price per day</span>
              <input type="checkbox" v-model="localSelectedMaximumPrice" />
            </div>

            <div class="price-input">
              <span>€</span>
              <input type="number" v-model.number="localMaximumPrice" />
            </div>
          </div>

          <div class="buttons">
            <button @click="clearFilters">Clear</button>
            <button @click="applyFilters">Apply</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useStore } from "@/stores/store";
import { useRouter } from "vue-router";

export default {
  name: "FiltersPanel",

  data() {
    const store = useStore();

    const minTimestamp = new Date("2009-12-09").getTime();
    const maxTimestamp = new Date("2025-12-09").getTime();

    return {
      store,
      router: useRouter(),
      constantPropertyTypes: [
        "Entire Home",
        "Private Room",
        "Shared Room",
        "Hotel Room",
      ],
      minTimestamp,
      maxTimestamp,

      localSelectedPropertyType: false,
      localPropertyTypes: [],

      localSelectedTimeInterval: true,
      localStartTimestamp: minTimestamp,
      localEndTimestamp: maxTimestamp,

      localSelectedMaximumPrice: false,
      localMaximumPrice: 0,
    };
  },

  created() {
    this.syncLocalStateWithStore();
  },

  computed: {

    startPercent() {
      const range = this.maxTimestamp - this.minTimestamp;
      return ((this.localStartTimestamp - this.minTimestamp) / range) * 100;
    },
    endPercent() {
      const range = this.maxTimestamp - this.minTimestamp;
      return ((this.localEndTimestamp - this.minTimestamp) / range) * 100;
    },
  },

  methods: {

    syncLocalStateWithStore() {

      this.localSelectedPropertyType = this.store.getSelectedPropertyType;
      this.localSelectedTimeInterval = this.store.getSelectedTimeInterval;
      this.localSelectedMaximumPrice = this.store.getSelectedMaximumPrice;

      this.localPropertyTypes = [...this.store.getPropertyTypes]; 
      
      this.localMaximumPrice = this.store.getMaximumPrice || 0;

      if (this.store.getStartDay) {
        this.localStartTimestamp = new Date(this.store.getStartDay).getTime();
      } else {
        this.localStartTimestamp = this.minTimestamp;
      }

      if (this.store.getEndDay) {
        this.localEndTimestamp = new Date(this.store.getEndDay).getTime();
      } else {
        this.localEndTimestamp = this.maxTimestamp;
      }
    },

    toggleLocalPropertyType(type) {
      if (this.localPropertyTypes.includes(type)) {
        this.localPropertyTypes = this.localPropertyTypes.filter((t) => t !== type);
      } else {
        this.localPropertyTypes.push(type);
      }
    },

    onStartChange() {
    
      if (this.localStartTimestamp > this.localEndTimestamp) {
        this.localStartTimestamp = this.localEndTimestamp;
      }
    },

    onEndChange() {
    
      if (this.localEndTimestamp < this.localStartTimestamp) {
        this.localEndTimestamp = this.localStartTimestamp;
      }
    },

    formatDate(ts) {
      if (!ts) return "";
      const d = new Date(ts);
      const day = d.getDate().toString().padStart(2, "0");
      const month = d.toLocaleDateString("en-GB", { month: "short" });
      const year = d.toLocaleDateString("en-GB", { year: "2-digit" });
      return `${day} ${month} ${year}`;
    },


    clearFilters() {

      this.localSelectedPropertyType = false;
      this.localSelectedTimeInterval = true;
      this.localSelectedMaximumPrice = false;
      this.localPropertyTypes = [];
      this.localMaximumPrice = 0;
      this.localStartTimestamp = this.minTimestamp;
      this.localEndTimestamp = this.maxTimestamp;

      this.store.resetFilters();
      this.store.fetchTotalReviews();
    },

    applyFilters() {
      console.log("Applying filters...");

      this.store.setSelectedPropertyType(this.localSelectedPropertyType);
      this.store.setSelectedTimeInterval(this.localSelectedTimeInterval);
      this.store.setSelectedMaximumPrice(this.localSelectedMaximumPrice);
      this.store.clearPropertyTypes();
      this.localPropertyTypes.forEach(t => this.store.addPropertyType(t));

      this.store.setMaximumPrice(this.localMaximumPrice);

      const startDate = new Date(this.localStartTimestamp).toISOString().split("T")[0];
      const endDate = new Date(this.localEndTimestamp).toISOString().split("T")[0];
      this.store.setStartDay(startDate);
      this.store.setEndDay(endDate);
      this.store.fetchTotalReviews();
    },
  },
};
</script>

<style scoped>
.filters {
  width: 900px;
  margin: 0 auto;
}

h2 {
  font-size: 2rem;
  margin-bottom: 32px;
}

.row {
  display: flex;
  justify-content: space-between;
}

.col-left {
  width: 260px;
  flex: 0 0 auto;
}

.col-right {
  width: 560px;
  flex: 0 0 auto;
}

.filter-section {
  margin-bottom: 25px;
}

.filter-section-price {
  margin-top: 20px;
}

.label-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.4rem;
  padding-bottom: 20px;
}

.property-types button {
  display: block;
  width: 260px;
  margin: 8px 0;
  padding: 10px 0;
  font-size: 1.3rem;
  border: 2px solid #111;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}

.property-types button.property-active {
  background: black;
  color: white;
}

.time-interval-slider {
  position: relative;
  width: 560px;
  margin-top: 2px;
  height: 40px;
}

.track {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 4px;
  background: #e5e5e5;
  transform: translateY(-50%);
  border-radius: 999px;
}

.range-highlight {
  position: absolute;
  top: 50%;
  height: 4px;
  transform: translateY(-50%);
  background: black;
  border-radius: 999px;
}

.thumb {
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
  margin: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  top: 50%;
  transform: translateY(-50%);
}

.thumb::-webkit-slider-runnable-track {
  background: transparent;
}
.thumb::-moz-range-track {
  background: transparent;
}

.thumb::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: black;
  cursor: pointer;
  pointer-events: auto;
}
.thumb::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: black;
  cursor: pointer;
  pointer-events: auto;
}

.date-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.8rem;
  white-space: nowrap;
  z-index: 3;
}

.start-label {
  bottom: calc(100% - 5px);
  margin-left: 9px;
}

.end-label {
  top: calc(100% - 5px);
  margin-left: -9px;
}

.price-input {
  display: flex;
  align-items: center;
  margin-top: 15px;
}

.price-input span {
  font-size: 1.7rem;
  margin-right: 8px;
}

.price-input input[type="number"] {
  font-size: 1.3rem;
  width: 260px;
  border: 2px solid #111;
  border-radius: 10px;
  padding: 10px 14px;
  background: #fff;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
  width: 200px;
}

.buttons button {
  width: 200px;
  padding: 10px 0;
  font-size: 1.3rem;
  border: 2px solid #111;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}

.right-bottom {
  display: flex;
  justify-content: space-between;
  width: 560px;
  margin-top: 53px;
}

input[type="checkbox"] {
  width: 15px;
  height: 15px;
  accent-color: black;
}

input[type="checkbox"]:hover {
  cursor: pointer;
}

button:hover {
  background-color: rgb(200, 200, 200);
}
</style>