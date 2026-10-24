import './assets/main.css';
import 'primeicons/primeicons.css'
import axios from 'axios';
import { createApp } from 'vue'
import App from './App.vue'


if (import.meta.env.MODE === 'development') {
    console.log('Useing development hosturl');
    axios.defaults.baseURL = 'http://localhost:3000';
}
const app = createApp(App)
app.mount('#app');
