# Değişiklik günlüğü

Bu kayıt Keep a Changelog düzenini izler. Tarihler İstanbul yerel tarihidir.

## [1.1.0] - 2026-11-01 — COP31 4 Bölümlü Demo

### Eklendi
- Bölüm haritası; Yeşil Başlangıç, Yoğun Mahalle, Sanayi Krizi ve Kritik Eşik.
- Teslimat durakları, rota adımlarına bağlı ısı dalgası, inşaat alanları ve araç adet limitleri.
- Yerel kayıt, sırayla kilit açma, en iyi yük/yıldız ve onaylı ilerleme sıfırlama.
- Bölüme özel yıldız eşikleri, hedef HUD’u, sonraki bölüm/harita/tekrar akışı.
- ART-MAP harita, düğüm, ikon, sanayi ve inşaat görselleri.
- P2 harita/şehir ambiyansı, kısa bölüm girişleri, teslimat paketi animasyonu, sınırlı ısı dalgası efektleri, kilit açma ve tamamlama kutlaması; azaltılmış hareket desteği.

### Değişti
- Eski Sıcak Kavşak, Yoğun Mahalle olarak korundu; akış dört bölümlü ilerlemeye dönüştü.
- Belgeler ve paket sürümü 1.1.0 oldu. Final entegrasyon sonrası paketleme ayrı aşamadır.

### Düzeltildi
- Harita görünürlüğü, gerçek hesaplanan ısı sonuçları, hedef HUD’u ve yerleştirme ret mesajları.
- İnşaat görsellerinin native ×2 ölçeği ve Türkçe yıldız eşiklerinde ondalık gösterim.

### Bilinen sorunlar
- Büyük JS chunk uyarısı; önceki kurulumda 11 moderate bağımlılık bildirimi. Bağımlılık yükseltilmedi.
- Küçük kurye/palet/anten sanat kusurları; kayıt tarayıcı ve konuma bağlıdır.
- Final entegrasyon hash’i ve teslim paketlerinden kabul doğrulaması bekleniyor.

## [1.0.0] - 2026-11-01 — COP31 Enhanced Pixel Edition

### Eklendi
- Ortak 32 renk paletiyle piksel şehir, çeşitli binalar, serin çatı halleri, depo/hastane ve dekor.
- Menüde sıcak-serin gölge dalgası, piksel HUD, yardım ve kalıcı ses/ambiyans ayarları.
- Dört yönlü kurye yürüyüşü, bekleme ve teslim animasyonları.
- Oyun hesabına bağlı ısı katmanı, H aç/kapa, müdahale efektleri ve rota geri bildirimi.
- Sonuçlarda önce/sonra ısı haritaları, müdahale sayıları ve kayıpta en sıcak üç rota noktası.
- Başarıda 1–3 yıldız, ölçüt açıklamaları ve sonraki yıldız için öneri; saf skor hesabı/testleri.
- Özgün WebAudio araç/adım/sonuç efektleri ve ısı yüküne tepki veren şehir ambiyansı.
- Yerel Pixelify Sans ve özgün Route Digits; lisans/üretim kayıtları ve asset QA.
- Yerel teslim için web, offline HTML, Electron Windows ZIP, final ekran görüntüleri ve gerçek oynanış videosu.

### Değişti
- MVP prosedürel görünümü Pixel Edition ile genişletildi; kurallar, 180 bütçe, 740 eşik ve tek bölüm korundu.
- `?classic=1` ve eksik piksel doku için prosedürel geri dönüş korundu.
- Belgeler, sunum ve varlık köken/lisans kaydı final sürüme güncellendi; paket sürümü 1.0.0 oldu.

### Düzeltildi
- Yol parçaları komşu hücrelere göre seçiliyor; binaların taşması ve derinlik sırası sınırlandı.
- Isı katmanının binaları bulandırması giderildi; kurye hareket/animasyon bağlantısı düzeltildi.
- Dekor native ×2 ölçeğe getirildi; rakam okunurluğu ve yerleşime bağlı kayıp ipuçları düzeltildi.

### Bilinen sorunlar
- Kuzey kurye yürüyüşünde sırt kutusu görünmüyor; küçük palet/anten/yol köşesi sanat farkları var.
- Ayrı ağaç büyüme/gölgelik kurulum sprite kareleri yok; mevcut efektler kodla üretilir.
- Büyük JS chunk uyarısı ve npm kurulumunda 11 moderate bildirim kayıtlı; bağımlılık yükseltmesi yapılmadı.
- Windows paketi imzasızdır; Windows güvenlik uyarısı gösterebilir. Video sessizdir.
- Basitleştirilmiş eğitim modeli; gerçek kent iklimi/sağlık tahmini veya ölçülmüş eğitim etkisi iddiası yok.

## [0.1.0] - 2026-10-31 — MVP

### Eklendi
- `checkpoint/mvp-v1` (`2472a50`): Sıcak Kavşak, 10×6 harita, sabit kurye rotası ve üç müdahale.
- Bütçe, uygun hücre kısıtları, geri alma, simülasyon, kazanma/kaybetme ve tekrar döngüsü.
- Prosedürel grafik/ses, öğretici, HUD, eğitim kartı, çevrimdışı tek HTML ve ilk teslim belgeleri.
- MVP doğrulaması: 29 test, build/lint ve gerçek Chrome turu.
