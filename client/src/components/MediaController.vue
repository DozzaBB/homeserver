<template>
    <BCard>
        <BFormInput v-model="tableFilter" placeholder="Filter...">
        </BFormInput>
        <h2>Chromecast: {{ccName }} ({{ ccip }})<BButton @click="sendrestart" v-if="!ccName">Refresh<BSpinner v-if="showSpinner"></BSpinner></BButton></h2>
    </BCard>
    <!-- Sort table by unwatched first. then most recently watched -->
    <BTable :items="allFiles"
    :filter="tableFilter"
    :fields="['folderName','prettyName','playButton']">
        <template #cell(playButton)="data">
            <BButtonGroup>
                <BButton variant=success :disabled="!ccip" @click="playFile(data.item)">Play</BButton>
                <BButton v-if="!watched[data.item.path]" @click="markwatched(data.item)" variant="primary">Mark Watched</BButton>
            </BButtonGroup>
        </template>
         <template #cell(folderName)="data">
            <BButton variant="secondary" v-b-modal.inspect @click="openModal(data.item._id)">+</BButton>
            <BBadge variant="success" v-if="!watched[data.item.path]">New!</BBadge>
            <!-- {{ data.item._id }} -->
        </template>
    </BTable>
    <BModal size="xl" @ok="playWithSkip":title="inspectedFile.prettyName" id="inspect">
        <!-- {{ inspectedFile._id }}<br> -->
        <!-- Start playing at time. -->
         <BInputGroup>
            <BInputGroupText>Start At</BInputGroupText>
           <BInput type="number" min="0" placeholder="00" v-model="skipMinutes"></BInput>
           <BInputGroupText>minutes</BInputGroupText>
           <BInput type="number" min="0" placeholder="00" v-model="skipSeconds"></BInput>
           <BInputGroupText>seconds</BInputGroupText>
         </BInputGroup>
         <BInputGroup>
            <BInputGroupText>Audio Track</BInputGroupText>
            <BFormSelect v-model="audioTrackSelector"
            :options="audioStreams"
            labelField="codec_type"
            value-field="index"
            ></BFormSelect>
         </BInputGroup>
         Last Watched: {{ inspectedFile.lastWatched ? new Date(inspectedFile.lastWatched).toLocaleString() : "Not Watched" }}

         <BButton v-if="!watched[inspectedFile.path]" @click="markwatched(inspectedFile)" variant="success">Mark Watched</BButton>

         <pre>{{ ffprobebrief }}</pre>
         <BButton
  v-b-toggle.collapse-1
  variant="primary"
  >FFProbe Detailed</BButton
>

<BCollapse id="collapse-1">
  <BCard class="mt-4">
    <pre class="card-text">{{ffproberesults}}</pre>
  </BCard>
</BCollapse>

    </BModal>
</template>

<script setup lang="ts">
import axios from 'axios';
import type {FResponse} from '../../../types';
import { ref, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

// type NonNullable<T> = T extends null | undefined ? never : T;

const allFiles = ref<DFile[]>([]);
const ccip = ref<string | undefined>(undefined);
const ccName = ref<string | undefined>(undefined);
const tableFilter = ref<string>('');
const showSpinner = ref<boolean>(false);
const inspectedFile = ref<any>({});
const skipSeconds = ref<number>(0);
const skipMinutes = ref<number>(0);
const ffproberesults = ref<string>("");
const ffprobebrief = ref<string>("");
const audioTrackSelector = ref<number>();
const audioStreams = ref<any[]>([]);

let watched: Record<string, string> = {};

interface DFile {
    path: string
    prettyName: string
    folderName: string
    _id: string
}

function playWithSkip() {
    // https://stackoverflow.com/questions/39269701/typescript-trying-the-addition-of-two-variables-but-get-the-concatenation-of-t
    const toSkip = +skipMinutes.value * 60 + +skipSeconds.value;
    const audioIndex = audioTrackSelector.value; // todo.
    console.log(toSkip);
    playFile(inspectedFile.value, toSkip, audioIndex);
}

function getProbe(path: string) {
    axios.get(`/media/ffprobe?filename=${path}`).then((r) => {
        console.log(r.data);
        ffproberesults.value = JSON.stringify(r.data,null,1);
        audioStreams.value = r.data.streams.filter((s: any) => s.codec_type === 'audio');
        audioStreams.value.forEach((s: any) => {s.label = s.tags.language ?? "Unknown"});
        ffprobebrief.value = 
`Resolution: ${r.data.streams.find((s: any) => s.codec_type === "video").width}x${r.data.streams.find((s: any) => s.codec_type === "video").height}
Duration: ${Math.floor(r.data.format.duration / 3600)} hours, ${Math.floor(r.data.format.duration % 3600 / 60).toString().padStart(2, '0')} minutes,
Codecs: ${r.data.streams.map((s: any) => s.codec_name).join(", ")}
Format: ${r.data.format.format_name}`;
    });
}

function openModal(_id: string) {
    console.log(_id);
    let i = allFiles.value.find((f) => f._id === _id) ?? allFiles.value[0] as DFile;
    inspectedFile.value = i;
    getProbe(i.path);
}

function sendrestart() {
    axios.get("/utils/restart");
    showSpinner.value = true;
    setTimeout(() => {
        loadpage();
    }, 2000)
}

function markwatched(file: DFile) {
    axios.get(`/media/markwatched?filename=${file.path}`).then(() => {
        toast(`marked ${file.prettyName} as watched`);
        watched[file.path] = new Date().toISOString();
    })
}



function playFile(file: DFile, skip: number = 0, audioIndex: number = 0) {
    console.log("sending request");
    axios.get(`/media/play?filename=${file.path}` + (skip ? `&starttime=${skip}` : '') + (audioIndex ? `&audioindex=${audioIndex}` : '')).then(() => {
        toast(`playing ${file.prettyName}`)
    });
}



function loadpage() {
    showSpinner.value = true;
    axios.get("/media/files").then((r: FResponse) => {    
    showSpinner.value = false;
    ccip.value = r.data.chromecastData.ip;
    ccName.value = r.data.chromecastData.name;
    watched = r.data.watched;
    let _id = 0;
    allFiles.value = r.data.files.map((i: string) => {
        _id += 1;
        const parts = i.split("/") ?? '';
        const last = parts.at(-1) ?? '';
        const folder = i.replace(last, "").replaceAll("."," ");
        const prettyName = last.replaceAll("."," ").split(" ").filter((c: string) => !r.data.hiddenTerms.includes((c.toUpperCase()))).join(" ");
        return {
            prettyName: prettyName,
            path: i,
            folderName: folder,
            _id: String(_id),
            lastWatched: watched[i]
        }
    });
    allFiles.value.sort((a, b) => {
        const aw = watched[a.path];
        const bw = watched[b.path];
        if (!aw && !bw) return 0;
        if (!aw) return -1;
        if (!bw) return 1;
        return new Date(bw).getTime() - new Date(aw).getTime();
    })
    })
}

onMounted(loadpage)
</script>
