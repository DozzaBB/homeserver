<template>
    <BCard>
        <BButton variant="danger" @click="sendshutdown">shutdown PC</BButton>
    </BCard>
    <BCard>
        <BButton variant="warning" @click="sendrestart">Restart</BButton>
    </BCard>
    <BCard>
        <BButton variant="secondary" @click="sendkillpia">Kill PIA Client</BButton>
    </BCard>
    <BCard>
        <BButton variant="warning" @click="killvlc">Kill VLC</BButton>
    </BCard>
    <BInputGroup>
        <BInputGroupText>Add Hidden Term</BInputGroupText>
        <BInput v-model="hiddenTerm"></BInput>
        <BButton @click="addHiddenTerm">Add</BButton>
    </BInputGroup>
</template> 

<script setup lang="ts">
import axios from 'axios';
import { ref } from 'vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

function sendshutdown() {
    axios.get("/utils/shutdown");
}
function sendrestart() {
    axios.get("/utils/restart");
}

function sendkillpia() {
    axios.get("/utils/kill/pia-client");
}

function killvlc() {
    axios.get("/utils/kill/vlc").then(() => {
        toast('VLC was killed');
    });
}

const hiddenTerm = ref("");

function addHiddenTerm() {
    axios.get(`/media/addhiddenterm?term=${hiddenTerm.value}`);
    hiddenTerm.value = "";
}
</script>

