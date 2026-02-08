import DefaultTheme from 'vitepress/theme'
import DemoViewer from '../components/DemoViewer.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component('DemoViewer', DemoViewer)
  }
}
