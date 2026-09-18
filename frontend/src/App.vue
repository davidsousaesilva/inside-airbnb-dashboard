<script>
import NavBar from "./components/NavBar.vue";

export default {
  components: {
    NavBar,
  },
  computed: {
    hideNav() {
      const path = this.$route.path;

      return (
        path === "/landing" || path === "/popular" || path.startsWith("/card") || path === "/map"
      );
    },
  },
};
</script>

<template>
  <div>
    <nav-bar v-if="!hideNav"></nav-bar>
    <router-view />
  </div>
</template>

<style>
div {
  font-family: "Inter", Arial, Helvetica, sans-serif;
}
</style>
