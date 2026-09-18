<template>
    <div class="map-page">
        <div class="main-content">
            
            <div class="info-sidebar">
                
                <div class="sidebar-header">
                    <button @click="$router.back()" class="btn-back">←</button>
                    <h2 class="location-title">{{ fullLocationString }}</h2>
                </div>

                <hr class="divider">

                <div class="info-group">
                    <p class="info-item">
                        <strong>Total Listings:</strong> {{ store.getFilteredListings.length }}
                    </p>
                    <p class="info-subtext">
                        Explore the map to see individual prices and details.
                    </p>
                </div>

                </div>

            <div class="map-wrapper">
                <div ref="mapContainer" class="map-container"></div>
                <div class="custom-zoom-controls">
                    <button @click="zoomIn" class="zoom-btn">+</button>
                    <button @click="zoomOut" class="zoom-btn">-</button>
                </div>
            </div>

        </div>
    </div>
</template>

<script>
    import { useStore } from '@/stores/store';

    export default {
        name: 'MapPage',
        data(){
            return {
                map: null,
                store: useStore(),
                markers: []
            };
        },
        methods:{
            initMap() {
                if (!this.$refs.mapContainer) return;
                const {center, zoom} = this.store.mapFocus;
                this.map = new window.google.maps.Map(this.$refs.mapContainer, {
                    center,
                    zoom,
                    mapTypeId: 'roadmap',
                    disableDefaultUI: true,
                });
                this.renderMarkers();
            },

            renderMarkers() {
    const currentlistings = this.store.getFilteredListings;

    currentlistings.slice(0, 500).forEach(listing => {
        
        if (listing.latitude && listing.longitude) {
             const marker = new window.google.maps.Marker({
                position: { lat: parseFloat(listing.latitude), lng: parseFloat(listing.longitude) },
                map: this.map,
                title: listing.name,
            });
            const infoWindow = new window.google.maps.InfoWindow({
                content: `<div>
                        <h3>${listing.name}</h3>
                        <p>Price: ${(!listing.price || listing.price === 'null')? 'N/A' : listing.price}€</p>
                        <p>Minimum nights: ${(!listing.minimum_nights || listing.minimum_nights === 'null')? 'N/A' : listing.minimum_nights}</p>
                    </div>`,
            });

            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });
        }
    });
},

            zoomIn() {
                if (this.map) {
                    this.map.setZoom(this.map.getZoom() + 1);
                }
            },

            zoomOut() {
                if (this.map) {
                    this.map.setZoom(this.map.getZoom() - 1);
                }
            },

            
        },mounted(){
           if(window.google && window.google.maps) this.initMap();

           window.initMap = () => {
               this.initMap();
           };
        },
        computed: {
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
        }
    }
</script>

<style scoped>
    .map-page {
        height: 100vh;
        width: 100vw;
        display: flex;
        overflow: hidden;
        background-color: white;
    }

    .main-content {
        display: flex;
        width: 100%;
        height: 100%;
    }

    .info-sidebar {
        width: 350px;             
        background-color: white;
        border-right: 3px solid #ccc; 
        padding: 25px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        box-shadow: 2px 0 10px rgba(0,0,0,0.05);
        z-index: 20;
    }

    .sidebar-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 5px;
        padding-bottom: 15px; 
    }

    .btn-back {
        background: none;
        border: none;
        font-size: 32px;  
        cursor: pointer;
        color: #000;  
        padding: 0;
        line-height: 1; 
        transition: transform 0.2s;
    }

    .btn-back:hover {
        background-color: transparent;
        transform: translateX(-3px); 
        color: #555;
    }

    .location-title {
        flex: 1;
        text-align: center;
        margin-top: 40px;
        font-size: 1.4rem;
        font-weight: 700;
        line-height: 1.2;
        color: #222;

        padding-right: 30px; 
    }

    .info-subtext {
        font-size: 0.9rem;
        color: #777;
        margin-top: 5px;
    }

    .divider {
        border: 0;
        height: 2px;
        background: #ccc;
        margin-left: -25px;
        margin-right: -25px;
        width: auto;
        
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .map-wrapper { 
        flex: 1; 
        position: relative; 
    }
    .map-container { 
        height: 100%; 
        width: 100%; 
    }
    
    .custom-zoom-controls {
        position: absolute;
        bottom: 30px;
        right: 30px; 
        z-index: 10;
        display: flex;
        flex-direction: row;
        gap: 15px;
    }

    .zoom-btn {
        width: 40px;     
        height: 40px;
        font-size: 24px;
        background: white;
        border: 1px solid #000;
        cursor: pointer;
        border-radius: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        line-height: 1;
        padding: 0;
    }
    .zoom-btn:hover { 
        background-color: #f0f0f0; 
    }

    .custom-zoom-controls {
        position: absolute;
        bottom: 40px;
        right: 20px;
        display: flex;
        flex-direction: row;
        gap: 15px;
        z-index: 20;
    }
</style>