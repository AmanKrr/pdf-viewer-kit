import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "PDF Viewer Kit",
  description: "A framework-agnostic, high-performance PDF rendering library.",
  base: '/pdf-viewer-kit/', // Assuming GitHub Pages deployment
  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;700;800&display=swap', rel: 'stylesheet' }]
  ],
  themeConfig: {
    logo: '/logo.png', // We might need to create this or remove if not exists
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/reference' },
      { text: 'Examples', link: '/examples/basic' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'PdfViewerKit', link: '/api/reference#pdfviewerkit' },
            { text: 'PDFViewerInstance', link: '/api/reference#ipdfviewerinstance' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Usage', link: '/examples/basic' },
            { text: 'Advanced Features', link: '/examples/advanced' },
            { text: 'Event Handling', link: '/examples/events' },
            { text: 'Customization', link: '/examples/customization' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/AmanKrr/pdf-viewer-kit' }
    ],

    footer: {
      message: 'Released under the Apache-2.0 License.',
      copyright: 'Copyright © 2025 Aman Kumar'
    },
    
    search: {
      provider: 'local'
    }
  }
})
