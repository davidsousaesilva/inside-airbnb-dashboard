import { createRouter, createWebHistory } from "vue-router";
import { useStore } from "@/stores/store";

import LandingPage from "@/pages/LandingPage.vue";
import PopularCities from "@/pages/PopularCities.vue";
import Dashboard from "@/pages/Dashboard.vue";
import Compare from "@/pages/Compare.vue";
import NotFoundPage from "./pages/NotFoundPage.vue";
import CardDetail from "./pages/CardDetail.vue";
import MapPage from "./pages/MapPage.vue";

function requireCity(to, from, next) {
  const store = useStore();
  if (!store.getCity) {
    next("/popular");
  } else {
    next();
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "",
      redirect: "/landing",
    },
    {
      path: "/landing",
      component: LandingPage,
    },
    {
      path: "/popular",
      component: PopularCities,
    },
    {
      path: "/dashboard",
      component: Dashboard,
      beforeEnter: requireCity,
    },
    ,
    {
      path: "/compare",
      component: Compare,
    },
    {
      path: "/card/:type",
      component: CardDetail,
      props: true,
      beforeEnter: requireCity,
    },
    {
      path: "/:notFound(.*)",
      component: NotFoundPage,
    },
    {
      path: "/map",
      component: MapPage,
      beforeEnter: requireCity
    }
  ],
  scrollBehavior() {
    // sempre que muda de rota, volta ao topo
    return { left: 0, top: 0 };
  },
});

export default router;
