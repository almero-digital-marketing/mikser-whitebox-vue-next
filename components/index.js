import Markdown from "./Markdown.vue"
import ExternalLink from "./ExternalLink.vue"
import PhoneLink from "./PhoneLink.vue"
import Metatext from "./Metatext.vue"

const install = Vue => {
    Vue.component("whitebox-markdown", Markdown)
    Vue.component("whitebox-external-link", ExternalLink)
    Vue.component("whitebox-phone-link", PhoneLink)
    Vue.component("whitebox-metatext", Metatext)
};

export default {
    install
}

export { Markdown, ExternalLink, PhoneLink, Metatext }