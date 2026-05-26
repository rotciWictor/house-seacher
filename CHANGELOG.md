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



# [3.5.0](https://github.com/rotciWictor/house-seacher/compare/v3.4.0...v3.5.0) (2026-05-23)


### Bug Fixes

* **ci:** env vars mapped to secrets ([44dfde4](https://github.com/rotciWictor/house-seacher/commit/44dfde48d1812139eae4e0d4dba0e8fb8452c5df))
* **scraper:** bloqueia salas comerciais que vazavam para a ui de kitnets ([d79cc7d](https://github.com/rotciWictor/house-seacher/commit/d79cc7dc93db8a6cf1a113c6a520a351a3bbd24c))
* **seo:** forca geracao dinamica do sitemap.ts ([97bc34f](https://github.com/rotciWictor/house-seacher/commit/97bc34f7d20b77dcc25954c6f69403a5f14e389d))


### Features

* Deep Scraper v2 para todos os sites e ajuste no Github Actions ([c41aaff](https://github.com/rotciWictor/house-seacher/commit/c41aaff30d4967f683a7e4886a294538905b5b92))
* **seo:** implementa sitemap massivo e pseo programatico com isr fallback ([b39ae7b](https://github.com/rotciWictor/house-seacher/commit/b39ae7b52c8c5481a35c798bbb4cad65d7a65d5d))
* **seo:** injeta json-ld semantico com referencias ao wikidata ([fcd09df](https://github.com/rotciWictor/house-seacher/commit/fcd09df035c93b8571b9aa869d1783b3b6c06da1))



# [3.4.0](https://github.com/rotciWictor/house-seacher/compare/v3.3.1...v3.4.0) (2026-05-22)


### Features

* implement fuzzy matching and defensive cleaning pipeline ([e547c15](https://github.com/rotciWictor/house-seacher/commit/e547c15bf34af37643b077385bec8937cf746591))
* implementa 'segunda vista no lixo' para resgatar bairros destruídos via título/descrição ([ed09186](https://github.com/rotciWictor/house-seacher/commit/ed09186756f9f302bca5484fc7cf0e9bc9d4018f))



## [3.3.1](https://github.com/rotciWictor/house-seacher/compare/v3.3.0...v3.3.1) (2026-05-22)


### Bug Fixes

* corrige colisão de classificação do bairro Centro com cidades da Baixada e Niterói ([7a9353b](https://github.com/rotciWictor/house-seacher/commit/7a9353b7a8d24670b46e3b9c8d5d63a769d2bfa0))



