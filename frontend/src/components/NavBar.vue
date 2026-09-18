<template>
  <nav id="nav">
    <router-link to="/landing" class="no-box" @click.native="resetStore">
      <svg
        width="40"
        height="40"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip0_877_5274)">
          <path
            d="M20.8332 41.6667V29.1667H29.1665V41.6667H39.5832V25H45.8332L24.9998 6.25L4.1665 25H10.4165V41.6667H20.8332Z"
            fill="black"
          />
        </g>
        <defs>
          <clipPath id="clip0_877_5274">
            <rect width="50" height="50" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </router-link>

    <div class="nav-items">
      <router-link to="/dashboard">Dashboard</router-link>
      <router-link to="/compare">Compare</router-link>
    </div>
  </nav>
</template>

<script>
import { useStore } from "@/stores/store";

export default {
  data() {
    return {};
  },

  created() {
    this.store = useStore();
  },

  methods: {
    resetStore() {
      this.store.$reset();
    },
  },
};
</script>

<style scoped>
#nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: rgb(238, 246, 252);
  border-bottom: 1px solid black;
}

a {
  background-color: white;
  text-decoration: none;
  padding: 0.5rem 1.5rem;
  font-weight: 600;
  margin-left: 10px;
  border: 1px solid var(--color-accent);
  border-radius: 5px;
  color: var(--color-accent);
  transition: all 0.3s ease-in;
}

a:hover {
  background-color: rgb(200, 200, 200);
}

a.router-link-active {
  background-color: var(--color-accent);
  color: var(--color-light);
}

.no-box {
  all: unset;
  padding: 0.5rem 0rem;
  margin-left: -5px;
  cursor: pointer;
  align-items: center;
}

.no-box:hover {
  background-color: unset;
}

.no-box svg {
  transition: transform 0.2s ease-in-out;
}

.no-box svg:hover {
  transform: scale(1.1);
}
</style>
