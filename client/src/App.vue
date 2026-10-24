<template>
  <BApp>
    <BTabs content-class="mt-3">
      <BTab title="Media" active>
        <MediaController></MediaController>
      </BTab>
      <BTab title="Utils">
        <UtilsController></UtilsController>
      </BTab>
      <BTab title="Cast">
        <CastController></CastController>
      </BTab>
    </BTabs>
  </BApp>

</template>

<script setup lang="ts">
import axios from 'axios';
import { BApp } from 'bootstrap-vue-next'
// https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs.html

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import MediaController from './components/MediaController.vue';
import UtilsController from './components/UtilsController.vue';
import CastController from './components/CastController.vue';
</script>