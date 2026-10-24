<template>
    <BCard>
        <BButtonGroup>
            <BButton size='lg' :disabled="!(chromecaststatus?.playerState === 'PLAYING')" @click="sendchromecastcommand('backward')"><i class="pi pi-backward" /></BButton>
            <BButton size='lg' :disabled="!(chromecaststatus?.playerState === 'PLAYING')" @click="sendchromecastcommand('forward')"><i class="pi pi-forward" /></BButton>
            <BButton size='lg' :disabled="!(chromecaststatus?.playerState === 'PLAYING')" @click="sendchromecastcommand('pause')"><i class="pi pi-pause" /></BButton>
            <BButton size='lg' :disabled="!(chromecaststatus?.playerState === 'PAUSED')" @click="sendchromecastcommand('play')"><i class="pi pi-play" /></BButton>
        </BButtonGroup>
        <br>
        <BButton @click="getstatus()">Status</BButton>
        <div v-if="chromecaststatus">
            Status: {{ chromecaststatus.playerState }}, Time: {{ chromecaststatus.currentTime }}, Title: {{ chromecaststatus.media?.metadata?.title }}
            <!-- <pre>{{ chromecaststatus }}</pre> -->
        </div>
    </BCard>
</template> 


<script setup lang="ts">
import axios from 'axios';
import { ref } from 'vue';
import { toast } from 'vue3-toastify';

const chromecaststatus = ref({
    playerState: 'unknown',
    currentTime: -1,
    media: {
        metadata: {
            title: 'unknown'
    }
}
});

function getstatus() {
    axios.post('/media/chromecast/status')
        .then((response) => {
            chromecaststatus.value = response.data
        })
        .catch((error) => {
            toast.error(error);
        });
}


function sendchromecastcommand(command: string = 'pause') {
    axios.post(`/media/chromecast/${command}`)
        .then((response) => {
            // toast.success(`${command} sent to chromecast`);
            getstatus();
        })
        .catch((error) => {
            toast.error(error);
        });
}

setInterval(() => {
    getstatus();
}, 5000);
</script>
