# Varlık kökenleri, lisans ve atıflar

Enhanced Pixel Edition, PixelLab ile üretilmiş ve ekipçe düzenlenmiş piksel görselleri, yerel çizimler, özgün prosedürel grafik/ses kodu ve aşağıdaki fontları kullanır. MVP'deki “harici font/görsel yok” notu yalnız o tarihsel sürüme aittir.

| Varlık | Köken / üretim |
|---|---|
| Şehir karoları, binalar ve serin çatı durumları, ağaç, gölgelik, kurye ve animasyonları, dekor | PixelLab: `create_tiles_pro`, `create_1_direction_object`, `create_object_state`, `create_character`, `animate_character`, `reduce_colors`; ardından yerel palet, alfa, boyut ve dikiş düzeltmeleri. Yol bağlantıları PixelLab çıktısının renk/detaylarıyla yerelde yeniden kuruldu. |
| Menü şehir katmanları, amblem ve ikon paketi | PixelLab `create_image_pixen` ve `create_1_direction_object`; yerel birleştirme, temizlik ve sıcak/serin palet varyantları. |
| 32 renk paleti, gökyüzü/bulut/pus, UI çerçeveleri ve düğme durumları, elle piksellenmiş 2050 logosu, F2 sonuç/ayar parçaları | Ekip tarafından yerelde çizildi; bütün görseller PixelLab üretimi değildir. |
| Klasik görünüm, eksik doku geri dönüşü, gölgeler, ısı/rota efektleri ve parçacıklar | Özgün Phaser/kod grafikleri; `src/scenes/BootScene.ts`, `src/gameplay/**`, `src/ui/**`. |
| Efektler, adım sesleri, şehir ambiyansı | Özgün WebAudio sentezi; `src/assets/sfx.ts`, `src/audio/**`. **Üçüncü taraf ses/müzik dosyası kullanılmaz.** |

## PixelLab kullanım hakkı kaydı

Üretim, ücretli **Tier 1: Pixel Apprentice** aboneliğinde PixelLab (pixellab.ai) ile yapıldı. [art/world/CAPABILITIES.md](art/world/CAPABILITIES.md) içindeki araç yardım kaydı, PixelLab'ın üretilen varlıklarda hak iddia etmediğini ve kullanıcının ticari/kişisel kullanımına izin verdiğini bildiriyor; atıf zorunluluğu bulunamadığı belirtiliyor. **Bu kayıt kesin ToS maddesini doğrulamamıştır. Ekip, teslimden önce [PixelLab ToS](https://pixellab.ai/termsofservice) ile kullanım ve dağıtım koşullarını yeniden kontrol etmelidir.** Bu metin bağımsız bir hukuki hak garantisi veya yeni lisans değildir.

Üretim ve yerel düzenleme izi: [dünya F1](art/world/F1_REPORT.md), [dünya F2](art/world/F2_REPORT.md), [UI F1](art/ui/F1_REPORT.md), [UI F2](art/ui/F2_REPORT.md), `art/world/manifest.json`, `art/ui/manifest.json`, alanların `LEDGER.md` dosyaları ve [ASSET_MANIFEST.md](ASSET_MANIFEST.md).

## 1.1.0 ART-MAP ekleri

Harita arka planı, açık/güncel/tamamlanmış/kilitli düğümler, rota noktası, ısı dalgası ve teslimat ikonları `src/assets/pixel/map/` altındadır. Sanayi binaları, serin çatı halleri ve inşaat görselleri `src/assets/pixel/world/` altındadır. PixelLab çıktıları yerel palet/alfa/ölçek düzenlemeleriyle kullanıldı; düğüm işaretleri yerelde çizildi. Kaynaklar: [harita manifesti](art/map/manifest.json), [dünya ekleri](art/map/world-additions.json), [üretim defteri](art/map/LEDGER.md). Yerleşim map-layout.json ile tanımlanır. Yukarıdaki kullanım hakkı ve font koşulları geçerlidir.

ART-MAP **38 üretim hakkı**; önceki 150,7 ile toplam yaklaşık **188,7**, kalan **1811,3 / 2000**, dolar kredisi **$0**. Bunlar 1 Kasım üretim kayıtlarıdır; canlı bakiye sorgusu değildir. Bu belge görevinde üretim yapılmadı.

## Fontlar

- **Pixelify Sans** — `src/assets/fonts/PixelifySans.ttf`. Copyright 2021 The Pixelify Sans Project Authors ([proje](https://github.com/eifetx/Pixelify-Sans)). **SIL Open Font License 1.1**; tam lisans ve telif bildirimi: [OFL.txt](src/assets/fonts/OFL.txt).
- **Route Digits** — `src/assets/fonts/RouteDigits.otf`. Özgün 5×7 rakamlar; kaynak tanımı `src/ui/numerals.ts`. Copyright 2026 Golge Rotasi 2050 contributors. Depoda **SIL Open Font License 1.1** ile sunulur: [RouteDigits-OFL.txt](src/assets/fonts/RouteDigits-OFL.txt).

Fontlar yerel paketlenir; yeniden dağıtımda ilgili telif bildirimleri ve OFL metinleri korunmalıdır. Bağımlılıklar kendi lisanslarını taşır; bu varlık kaydı oyun kaynak koduna ayrıca açık kaynak lisansı atamaz.
