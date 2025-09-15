# [1.0.0-canvas-pooling.2](https://github.com/AmanKrr/pdf-kit/compare/v1.0.0-canvas-pooling.1...v1.0.0-canvas-pooling.2) (2025-09-15)


### Bug Fixes

* enhance annotation configuration with modern rectangle coordinates ([b447df0](https://github.com/AmanKrr/pdf-kit/commit/b447df0754ad9108418b41591807810018344b66))
* **RectangleAnnotation:** adjust SVG positioning and dimensions for accurate rendering ([e9fcb2d](https://github.com/AmanKrr/pdf-kit/commit/e9fcb2d50a24468a7f8f9bcae193b911f57598ae))

# [1.0.0-canvas-pooling.1](https://github.com/AmanKrr/pdf-kit/compare/v0.2.0-canvas-pooling.3...v1.0.0-canvas-pooling.1) (2025-08-17)


### Features

* **Delete Confirmation:** implement delete confirmation popup and enhance delete button functionality ([6304f46](https://github.com/AmanKrr/pdf-kit/commit/6304f465ca5a613c7e904b8808ce17834258b049))
* implement comprehensive annotation system improvements and architecture refactoring ([0748f3d](https://github.com/AmanKrr/pdf-kit/commit/0748f3db153e4ad2677b412d42b20d5eb3437025))
* **PDFViewerKit:** enhance PDF viewer instance management and public API ([8fff955](https://github.com/AmanKrr/pdf-kit/commit/8fff9556f71861a2568712d12e5b57a875f51344))


### BREAKING CHANGES

* Library structure has been reorganized with new public API
* File naming conventions have been standardized to lowercase

# [0.2.0-canvas-pooling.3](https://github.com/AmanKrr/pdf-kit/compare/v0.2.0-canvas-pooling.2...v0.2.0-canvas-pooling.3) (2025-08-17)


### Features

* **annotations:** enhance annotation handling with modern and legacy coordinate support ([b2379c5](https://github.com/AmanKrr/pdf-kit/commit/b2379c55cf6ed3dc6429190a70f1c690e1e00353))
* **annotations:** enhance interactive effects and drawing management ([202736e](https://github.com/AmanKrr/pdf-kit/commit/202736e2a0dbb46c1be6c256a16f1fde64d26932))
* **annotations:** enhance rectangle annotation functionality and improve PDF viewer styles ([cf38b7f](https://github.com/AmanKrr/pdf-kit/commit/cf38b7f999e4f91a24838c4b4d9cfaf9f948663c))
* **annotations:** update RectangleAnnotation attributes for enhanced customization ([dca1c7f](https://github.com/AmanKrr/pdf-kit/commit/dca1c7f35f6ed5de9b36d74f86a55af11414f58f))
* **canvas-pooling:** implement canvas bucketing and memory management enhancements ([0de1828](https://github.com/AmanKrr/pdf-kit/commit/0de1828a011f99c7caa6d4163a6d0eb5413fb2b1))
* **pdf-viewer:** enhance page rendering with improved queue management and aggressive cancellation ([5cc9943](https://github.com/AmanKrr/pdf-kit/commit/5cc9943e2027e24375dd9fbff3be17e5423833b5))
* **pdf-viewer:** enhance PDF loading experience with progress updates and improved configuration ([0103b8f](https://github.com/AmanKrr/pdf-kit/commit/0103b8fb0c6e4e17b844631459086a047074db96))

# [0.2.0-canvas-pooling.2](https://github.com/AmanKrr/pdf-kit/compare/v0.2.0-canvas-pooling.1...v0.2.0-canvas-pooling.2) (2025-06-22)


### Bug Fixes

* Adjust rectangle annotation padding based on dimensions for better rendering ([fe3cfad](https://github.com/AmanKrr/pdf-kit/commit/fe3cfad65ff8e1185b18040252ca31ead033866f))
* Safely cancel scroll handler in destroy method to prevent potential errors ([4feb225](https://github.com/AmanKrr/pdf-kit/commit/4feb225e0f33b8f1c6e2ef57f1987b7eb4af34f6))
* Update main and module paths in package.json for correct file references ([e3835b7](https://github.com/AmanKrr/pdf-kit/commit/e3835b7f8e5ad35896174f0e461ee95aa382de4c))
* Update PDF viewer container dimensions for better responsiveness ([ddeff86](https://github.com/AmanKrr/pdf-kit/commit/ddeff863ae67a3d8d3fb9f9a6928bc5880f65500))
* Update rectangle drawing parameters to use width and height for better clarity ([9a081e8](https://github.com/AmanKrr/pdf-kit/commit/9a081e87f45104a7563f143d6694d4f2ca36a6e0))


### Features

* **annotations:** add method to retrieve annotation shape configuration by ID ([334850e](https://github.com/AmanKrr/pdf-kit/commit/334850eff42f15bc1be18b65336acbb7f6421248))

# [0.2.0-canvas-pooling.1](https://github.com/AmanKrr/pdf-kit/compare/v0.1.2...v0.2.0-canvas-pooling.1) (2025-05-25)


### Bug Fixes

* Improve text layer font family and font weight ([1ad009f](https://github.com/AmanKrr/pdf-kit/commit/1ad009f6e7117fcf0537c9534e5c1c2a5fc59267))


### Features

* **annotations:** enhance drawing functionality with interactive option ([edd18c4](https://github.com/AmanKrr/pdf-kit/commit/edd18c4085769c9f344dbc6ee5c4ee49d10ca7fd))
* **pdf-viewer:** unify performance, rendering, and build enhancements ([5d1701b](https://github.com/AmanKrr/pdf-kit/commit/5d1701bdba82e05b81a51603166beff4ef2d84a3))

## [0.1.2](https://github.com/AmanKrr/pdf-kit/compare/v0.1.1...v0.1.2) (2025-05-04)


### Bug Fixes

* NPM Publish bump ([651fa05](https://github.com/AmanKrr/pdf-kit/commit/651fa052806e61c45d697d1013bed0828763754a))

## [0.1.1](https://github.com/AmanKrr/pdf-kit/compare/v0.1.0...v0.1.1) (2025-05-03)


### Bug Fixes

* rename src/Viewer → src/viewer (case-sensitive fix) ([97a1ce1](https://github.com/AmanKrr/pdf-kit/commit/97a1ce1dfac00a31a5b14223313fa9e342ee7405))
