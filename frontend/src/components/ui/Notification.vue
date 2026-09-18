<template>
    <div v-if="show" class="notification" :class="type">
        <div class = "content">

            <div class="message-box">
                <p :class="{'error-text': type === 'error'}">{{ message }}</p>
                <p v-if="type === 'error'" class = "error-text sub-text">Please try again.</p>
            </div>
        </div>
        <button @click="$emit('close')" class="close-btn">x</button>
    </div>
</template>

<script>
    export default {
        props: ['show', 'type', 'message', 'label']
    };
</script>

<style scoped>
.notification {
    position: fixed;
    top: 50%;
    right : 50%;
    background: white;
    transform: translate(50%, -50%);
    border: 1px solid #000;
    border-radius: 6px;
    padding: 40px 25px 25px 25px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 40%;
    height: 200px;
    z-index: 9999;
    min-width: 350px;
    font-family: sans-serif;
    font-size: 1.9rem;
}



.message-box {
    text-align: center;
    padding:10px 0;
}

.error-text {
    color: #ff4d4d;
}

.sub-text {
    font-size: 1.9rem;
}

.close-btn {
    position: absolute;
    top: 5px;
    right: 10px;
    background: transparent;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    font-weight: bold;
}


</style>