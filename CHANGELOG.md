## [0.3.3](https://github.com/rotciWictor/house-seacher/compare/v0.3.2...v0.3.3) (2026-05-26)


### Bug Fixes

* use real email in Nominatim User-Agent ([2be8f0d](https://github.com/rotciWictor/house-seacher/commit/2be8f0d64877ee226b78b071a4c812bac2d59c7e))



## [0.3.2](https://github.com/rotciWictor/house-seacher/compare/v0.3.1...v0.3.2) (2026-05-26)


### Bug Fixes

* rewrite ML scraper to bypass Anubis bot protection with Googlebot UA and Cheerio ([2c8de25](https://github.com/rotciWictor/house-seacher/commit/2c8de253f8771cffa731f553e2b30d8ad80ce2ba))



## [0.3.1](https://github.com/rotciWictor/house-seacher/compare/v0.3.0...v0.3.1) (2026-05-26)


### Bug Fixes

* correct Mercado Livre scraper URL and link filter ([e40ccde](https://github.com/rotciWictor/house-seacher/commit/e40ccde6667d1247c05c48508a56368d52e3c14e))



# [0.3.0](https://github.com/rotciWictor/house-seacher/compare/v0.2.0...v0.3.0) (2026-05-26)


### Features

* implement real geocoding engine with Nominatim API and cache ([b118af2](https://github.com/rotciWictor/house-seacher/commit/b118af22a6a1c3ba9718da97a419d8bd72ccd1da))



# [0.2.0](https://github.com/rotciWictor/house-seacher/compare/v3.5.0...v0.2.0) (2026-05-26)


### Bug Fixes

* endurece regex anti-comerciais ([8422d44](https://github.com/rotciWictor/house-seacher/commit/8422d44ee82983bd90a962ab9c68105983720c40))
* **filter:** block terrenos and containers ([9862dcb](https://github.com/rotciWictor/house-seacher/commit/9862dcb31a72cbb689ebc7f01bbf28937c4c5572))
* **filter:** make isCommercial and isForSale aggressive and apply directly to scrapers ([26ee69d](https://github.com/rotciWictor/house-seacher/commit/26ee69db468b7f5d7194b76941ac9d7144427fc8))
* reduce ChavesNaMao max pages to 10 to prevent action timeout ([54793bb](https://github.com/rotciWictor/house-seacher/commit/54793bbaae6cb14fee412467cb2c3e3a39f8d771))


### Features

* implement interactive MapView, PropertyModal and Dark Mode ([3780d4e](https://github.com/rotciWictor/house-seacher/commit/3780d4e49ef096e29cc3b371b9df7fe7a8405732))
* implement photo gallery, fix dark mode, add map clustering ([4e935cd](https://github.com/rotciWictor/house-seacher/commit/4e935cda658b38165ae73c719c84fad508fce87b))
* implement quinto andar map split-screen and risk scoring ([bb0b134](https://github.com/rotciWictor/house-seacher/commit/bb0b1346610e5a974e9bc1df679dba7b38cae127))
* increase max pages to 20 for all scrapers ([ad74b42](https://github.com/rotciWictor/house-seacher/commit/ad74b42278f3191e34141e9663963d08f9187ced))
* increase max pages to 30 and fix chavesnamao browser leak ([bf0f251](https://github.com/rotciWictor/house-seacher/commit/bf0f251243c60221f0f1dea9d779f20e2e5c44a2))
* robust DOM extraction strategy with auto-scroll for all scrapers ([f2bbf99](https://github.com/rotciWictor/house-seacher/commit/f2bbf99d96928602e8500b86b232fa8ed3089cc3))



