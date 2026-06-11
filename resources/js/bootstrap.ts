import axios from 'axios'
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
axios.defaults.withCredentials = true
axios.defaults.withXSRFToken = true
const meta = document.head.querySelector('meta[name="base-url"]')
if (meta instanceof HTMLMetaElement) axios.defaults.baseURL = meta.content
window.axios = axios
declare global { interface Window { axios: typeof axios } }
