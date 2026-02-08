---
layout: home

hero:
  name: "PDF Viewer Kit"
  text: "High-Performance PDF Rendering"
  tagline: A framework-agnostic, tile-based PDF viewer for modern web applications.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View API
      link: /api/reference

features:
  - title: Framework Agnostic
    details: Built with vanilla TypeScript. Use it with React, Vue, Angular, Svelte, or plain HTML/JS.
  - title: Tile-Based Rendering
    details: Google Maps-style progressive rendering. Handles large PDFs and high-zoom levels efficiently without crashing the browser.
  - title: Virtualization Support
    details: Smart DOM virtualization ensures only visible pages consume resources. Smooth scrolling even with 1000+ pages.
  - title: Rich Features
    details: Built-in support for annotations, text selection, search, zoom, and customizable toolbars. [Learn more about customization](/examples/customization).
---

<div style="margin-top: 4rem; text-align: center;">
  <h2>Live Demo</h2>
  <p style="margin-bottom: 2rem; color: var(--vp-c-text-2);">
    Experience the smooth scrolling and progressive rendering.
  </p>
  <ClientOnly>
    <DemoViewer src="/pdf-viewer-kit/sample.pdf" height="600px" />
  </ClientOnly>
</div>
