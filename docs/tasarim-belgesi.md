# Ülke Yönetim Simülasyonu: Oyun Tasarım Belgesi (Taslak v0.1)

> Çalışma adı: **Devlet** (değiştirilebilir). Tarih: 2026-10-19.
> Bu belge taslaktır. "Varsayım" ile işaretli kararlar Gurkan onaylayana kadar değiştirilebilir.
>
> **Onaylanan kararlar (2026-10-19):** Oyuncuların seçmediği ülkeler yapay zekâ ile yönetilir; 1 gerçek gün ≈ 2 oyun ayı; platform tarayıcı (web sitesi); kod yeni bir depoda.

---

## 1. Oyunun özü

Oyuncu, gerçek dünyadaki güncel ülkelerden birini seçip o ülkenin yöneticisi olur. Amaç iktidarda kalmaktır: ekonomiyi ayakta tutmak, halkı memnun etmek, seçimleri kazanmak (ya da rejime göre darbeye/isyana karşı ayakta kalmak) ve dış tehditlere karşı ülkeyi korumak.

Oyun **gerçek zamanlı ve online** akar: sunucuda dünya sürekli işler, oyuncu çevrimdışıyken de zaman ilerler. Aynı sunucuda başka oyuncular başka ülkeleri yönetir.

**Tasarım ilkeleri**

1. **Her kararın bedeli var.** Hiçbir düğme sadece iyi değildir. Asgari ücreti artırmak alım gücünü artırır ama enflasyonu ve işsizliği de zorlar.
2. **Gecikmeli sonuç.** Kararların etkisi hemen değil, zamanla ortaya çıkar (fabrika 1,5 yılda üretime geçer; faiz artışı enflasyonu 6–12 ayda etkiler).
3. **Okunabilir neden-sonuç.** Oyuncu "neden enflasyon arttı?" diye sorduğunda oyun ona etkenleri gösterebilmeli.
4. **Gerçekçi ama oynanabilir.** Gerçek veriden başlar, ama model sade tutulur.

---

## 2. Çekirdek oyun döngüsü

```
Göstergeleri izle → Karar al (bütçe, vergi, yasa, atama, yatırım)
      ↑                                   ↓
Seçim / kamuoyu sonucu ← Simülasyon işler (gecikmeli etkiler)
```

- **Kısa döngü (dakikalar):** Gelen olayları/krizleri yanıtla, bakanlardan gelen raporları onayla, yasa tasarılarını meclise gönder.
- **Orta döngü (oyun içi aylar):** Bütçe dağılımı, vergi oranları, faiz, yatırım projeleri.
- **Uzun döngü (oyun içi yıllar):** Seçim dönemi, büyük reformlar, ordu modernizasyonu, anayasa değişikliği.

---

## 3. Ülke ve rejim modeli

### 3.1 Başlangıç verisi
Her ülke gerçek verilerle başlar (yaklaşık, yıllık güncellenen statik bir veri dosyasından): nüfus, GSYH, kişi başı gelir, enflasyon, işsizlik, kamu borcu, askeri harcama, rejim türü, meclis yapısı, seçim takvimi.

**Varsayım:** MVP'de veri elle hazırlanmış bir JSON dosyasından gelir (Dünya Bankası/IMF gibi açık kaynaklardan derlenmiş). Canlı veri çekmeye gerek yok.

### 3.2 Rejim türleri
Rejim, oyuncunun neyi ne kadar özgürce yapabildiğini belirler.

| Rejim | Örnek | Oyuncunun gücü | Asıl risk |
|---|---|---|---|
| Başkanlık sistemi | Türkiye, ABD | Yürütme güçlü; yasalar meclisten geçmeli | Seçim kaybı |
| Parlamenter sistem | Almanya, İngiltere | Meclis çoğunluğuna bağlı; koalisyon gerekebilir | Güven oylaması, seçim |
| Yarı başkanlık | Fransa | Karışık yetki | Seçim, koalisyon çatışması |
| Monarşi / tek parti | Suudi Arabistan, Çin | Kararlar hızlı, meclis zayıf | Elit memnuniyetsizliği, isyan, darbe |

Her rejimin parametreleri: seçim aralığı (Türkiye: 5 yıl), meclis sandalye sayısı, yasa geçirme eşiği, kararname yetkisi, basın özgürlüğü (kamuoyu bilgisinin doğruluğu), darbe riski katsayısı.

### 3.3 Meclis
- Sandalyeler partilere dağılmıştır (başlangıçta gerçek dağılım, yaklaşık).
- Yasa tasarıları meclise gider; partilerin tutumu, ideolojilerine ve oyuncuyla ilişkilerine göre belirlenir.
- Oyuncu pazarlık yapabilir: karşılığında bütçe kalemi, bakanlık koltuğu ya da tavizle destek alır.
- Kararname yetkisi olan rejimlerde bazı kararlar meclisi atlayabilir, ama bu demokrasi algısını ve uluslararası itibarı düşürür.

---

## 4. Ekonomi modeli

### 4.1 Temel göstergeler

| Gösterge | Açıklama |
|---|---|
| GSYH ve büyüme | Ekonominin büyüklüğü ve yıllık değişimi |
| Enflasyon | Fiyatlardaki yıllık artış |
| İşsizlik | Çalışabilir nüfusun iş bulamayan oranı |
| Asgari ücret / ortalama ücret | Alım gücünü belirler |
| Faiz oranı | Merkez bankası politika faizi |
| Döviz kuru | Yerel paranın değeri |
| Bütçe dengesi | Gelir − gider |
| Kamu borcu / GSYH | Borçlanma kapasitesi ve risk primi |
| Cari denge | İhracat − ithalat |
| Yabancı yatırım | Güven ve istikrara bağlı |
| Gelir eşitsizliği | Toplumsal memnuniyete etki eder |

### 4.2 Oyuncunun kolları (kontroller)
- **Vergiler:** gelir vergisi, kurumlar vergisi, KDV, gümrük vergileri.
- **Harcamalar:** bakanlık bütçeleri (bölüm 6), sosyal yardımlar, kamu maaşları.
- **Asgari ücret.**
- **Faiz oranı** (merkez bankası bağımsızsa sadece "baskı" yapılabilir; bağımsızlığı kaldırmak mümkün ama güveni düşürür).
- **Yatırım projeleri:** fabrika/sanayi bölgesi, enerji santrali, yol, liman, hastane, okul. Her birinin maliyeti, yapım süresi ve etkisi vardır.
- **Borçlanma:** iç/dış borç, IMF benzeri kurumlara başvuru.
- **Ticaret politikası:** gümrük duvarı, serbest ticaret anlaşmaları (diğer oyuncularla dahil).

### 4.3 Neden-sonuç ilişkileri (basitleştirilmiş)
Simülasyon her adımda bu ilişkileri gecikmeli olarak uygular:

- **Asgari ücret ↑** → alım gücü ↑, memnuniyet ↑ (kısa vadede) → şirket maliyeti ↑ → işsizlik ↑ ve enflasyon ↑ (orta vadede). Etkinin büyüklüğü, asgari ücretin ortalama ücrete oranına bağlıdır.
- **Fabrika / sanayi yatırımı** → yapım süresince istihdam ↑ ve kamu harcaması ↑ → tamamlanınca üretim ↑, ihracat ↑, işsizlik ↓, uzun vadede enflasyon baskısı ↓.
- **Faiz ↑** → enflasyon ↓ (6–12 ay gecikmeyle), büyüme ↓, işsizlik ↑, yerel para değer kazanır, borç maliyeti ↑.
- **Para basma / bütçe açığı ↑** → kısa vadede büyüme ↑ → enflasyon ↑, kur ↓.
- **Vergi ↑** → bütçe geliri ↑ → tüketim ve yatırım ↓, memnuniyet ↓.
- **Eğitim harcaması ↑** → 5–10 yıl sonra verimlilik ↑ (yavaş ama kalıcı).
- **Sağlık harcaması ↑** → memnuniyet ↑, iş gücü kaybı ↓.
- **Siyasi istikrarsızlık / savaş riski ↑** → yabancı yatırım ↓, kur ↓, risk primi ↑.
- **Yolsuzluk ↑** (bürokrasi kalitesine bağlı) → harcamaların bir kısmı boşa gider.

Teknik yaklaşım: her gösterge, bir **etkenler listesinin** gecikmeli toplamıdır. Her etken, kaynağını ve büyüklüğünü kaydeder; arayüz bunu "Enflasyon neden %4 arttı?" panelinde gösterir.

### 4.4 Olaylar
Rastgele ve koşula bağlı olaylar: deprem, salgın, küresel kriz, enerji fiyat şoku, grev, skandal, komşu ülkede iç savaş. Bazıları oyuncuya seçim sunar ("Grevcilerle uzlaş / polisi gönder / görmezden gel").

---

## 5. Seçim ve kamuoyu

### 5.1 Toplum grupları
Halk tek bir sayı değil, gruplardan oluşur. Her grubun nüfus payı, önem verdiği konular ve oy eğilimi vardır:

- İşçiler (asgari ücret, işsizlik)
- Emekliler (maaş, sağlık, enflasyon)
- Gençler (iş, eğitim, özgürlükler)
- İş dünyası (vergi, faiz, istikrar)
- Çiftçiler (tarım desteği, gümrük)
- Kamu çalışanları (maaş, kadro)
- Muhafazakâr / laik, milliyetçi / liberal eksenleri (değer politikaları)

### 5.2 Onay oranı ve oy
- Her grubun memnuniyeti, kendi önem verdiği göstergelere göre hesaplanır.
- **Onay oranı** = grupların nüfus ağırlıklı memnuniyeti.
- Seçimde oy oranı: onay oranı + kampanya etkisi + muhalefetin gücü + medya etkisi + rastgele küçük sapma.
- Seçimden 6 ay önce **kampanya dönemi** açılır: miting, vaat, reklam bütçesi. Tutulmayan vaatler sonraki dönemde güveni düşürür.
- Seçim kaybedilirse oyuncu muhalefete düşer: ülkeyi izler, eleştirir ve sonraki seçimde geri dönmeye çalışır (ya da başka ülke seçer). **Varsayım:** MVP'de seçim kaybı = oyun sonu ve yeniden başlama.

### 5.3 Demokratik olmayan rejimlerde
Seçim yerine **meşruiyet** ve **elit sadakati** göstergeleri vardır. Düşük meşruiyet protestolara, düşük elit sadakati darbeye yol açar. Baskı (polis, sansür) kısa vadede işe yarar ama uluslararası yaptırım ve uzun vadeli gerginlik getirir.

---

## 6. Bakanlıklar, bütçe ve bürokrasi

### 6.1 Bakanlıklar
Ekonomi/Hazine, Dışişleri, Milli Savunma, İçişleri, Sağlık, Eğitim, Sanayi ve Teknoloji, Enerji, Tarım, Çalışma ve Sosyal Güvenlik, Adalet, Ulaştırma, Çevre. (Ülkeye göre birleştirilebilir.)

### 6.2 Bütçe
- Yıllık bütçe hazırlanır ve meclisten geçirilir (rejime göre).
- Her bakanlığa pay ayrılır; bakanlık içinde alt kalemler vardır (örn. Savunma: personel, teçhizat, Ar-Ge, istihbarat).
- Yıl içinde ek bütçe çıkarılabilir ama meclis onayı ve borç gerektirir.
- Az fonlanan bakanlık hizmet kalitesini düşürür (sağlık bekleme süresi, okul doluluğu). Fazla fonlanan bakanlıkta, bürokrasi kalitesi düşükse israf/yolsuzluk artar.

### 6.3 Bakan atama ve performans
- Her bakanlık için bir **aday havuzu** vardır. Aday özellikleri:
  - **Yetkinlik** (alanında başarı katsayısı)
  - **Sadakat** (sana karşı, istifa/ihanet riski)
  - **Dürüstlük** (yolsuzluk eğilimi)
  - **Popülerlik** (atanınca kamuoyuna etkisi)
  - **İdeoloji / parti** (koalisyon ortaklarını memnun etmek için)
- Bakanın yetkinliği, bakanlığa ayrılan bütçenin ne kadar verimli kullanıldığını belirler.
- Her çeyrekte **bakan karnesi**: hedefler (ör. Sağlık: bekleme süresi, Ekonomi: enflasyon hedefi) ve sonuçlar.
- Görevden alma: her zaman mümkün, ama sık değişiklik istikrarı ve sadakati düşürür; görevden alınan bakan muhalefete geçip skandal çıkarabilir.
- Zamanla havuza yeni, daha iyi adaylar düşer ("Daha iyisi çıkınca değiştir").
- **Varsayım:** Bakanlar NPC'dir. İleride diğer oyuncuların başka ülkelerde danışman/bakan olarak katılması ayrı bir özellik olabilir.

### 6.4 Bürokrasi
- **Bürokrasi kalitesi** göstergesi: kararların ne kadar hızlı ve ne kadar kayıpsız uygulandığını belirler.
- Yeni bir politika hemen yürürlüğe girmez; bürokrasi kalitesine göre uygulama süresi değişir.
- Reformlar (dijital devlet, kamu personel reformu) bürokrasi kalitesini artırır ama kısa vadede kamu çalışanlarını kızdırır.
- Atamalar sadece bakan seviyesinde değil, ileride merkez bankası başkanı, genelkurmay başkanı, valiler gibi kritik kadrolara da yapılabilir.

---

## 7. Savunma ve güvenlik

- **Askeri güç** göstergesi: personel, teçhizat kalitesi, teknoloji seviyesi, moral, ittifaklar.
- Savunma bütçesi alt kalemleri: personel, teçhizat alımı, yerli savunma sanayii (ekonomiye de katkı yapar), Ar-Ge, istihbarat.
- **Tehdit seviyesi:** komşu ülkelerin askeri gücü, ilişkiler ve olaylarla hesaplanır.
- Düşük savunma → tehdit ↑ → yabancı yatırım ↓ ve kriz olayları. Aşırı savunma → ekonomiye yük, komşularda gerginlik (silahlanma yarışı).
- İç güvenlik (İçişleri): suç, terör, protesto yönetimi.

---

## 8. Oyuncular arası etkileşim

Aynı sunucuda ülkeler gerçek oyunculara ya da yapay zekâya (NPC) aittir.

**Önerilen kapsam (MVP sonrası, kademeli):**
1. **Ticaret:** anlaşma teklifleri, gümrük, ambargo.
2. **Diplomasi:** ilişki puanı, ittifak, büyükelçi çağırma, yaptırım.
3. **Çatışma:** önce soyut (sınır gerginliği, sınırlı operasyon, sonuç simülasyonla hesaplanır), harita üzerinde birlik yönetimi yok.

**Karar:** Oyuncuların seçtiği ülkeler oyunculara aittir, seçilmeyen tüm ülkeleri yapay zekâ yönetir. MVP'de ülkeler arası savaş yoktur; ticaret ve diplomasi MVP sonrasında gelir.

---

## 9. Sunucu ve zaman akışı

- **Kalıcı dünya:** Sunucu sürekli çalışır, zaman oyuncular çevrimdışıyken de ilerler.
- **Karar: 1 gerçek gün ≈ 2 oyun ayı** (1 oyun ayı = 12 gerçek saat). 1 oyun yılı ≈ 6 gerçek gün; Türkiye'nin 5 yıllık seçim dönemi ≈ 30 gerçek gün.
- **Simülasyon adımı (tick):** her 3 gerçek saatte bir (≈ 1 oyun haftası) göstergeler güncellenir; arayüz aradaki ilerlemeyi gösterir.
- **Çevrimdışı koruma:** oyuncu çevrimdışıyken "otomatik pilot" kuralları çalışır (bütçe sabit kalır, bakanlar rutin kararları alır), kritik olaylar bildirim olarak bekler.
- **Sunucu sezonları:** Her sunucu belli bir süre (ör. 2 seçim dönemi ≈ 60 gerçek gün) sürer, sonunda sıralama yapılır ve yeni sezon başlar.
- **Ülke sahipliği:** Bir ülkeyi aynı anda tek oyuncu yönetir. Seçim kaybeden ya da uzun süre giriş yapmayan oyuncunun ülkesi NPC'ye geçer.

---

## 10. MVP kapsamı

İlk oynanabilir sürümde olacaklar:

1. Hesap açma, sunucuya katılma, ülke seçme (başlangıçta 10–20 ülke, Türkiye dahil).
2. Ana panel: temel göstergeler ve trend grafikleri.
3. Ekonomi kolları: vergiler, asgari ücret, faiz, bakanlık bütçeleri.
4. Yatırım projeleri: fabrika, enerji, altyapı, hastane, okul (gecikmeli etki).
5. Neden-sonuç paneli ("bu gösterge neden değişti?").
6. Toplum grupları, onay oranı ve seçim (sadece demokratik rejimler; Türkiye modeli: başkanlık + meclis, 5 yılda bir seçim).
7. Bakan atama/görevden alma ve çeyreklik karne.
8. Savunma bütçesi ve basit tehdit seviyesi (savaş yok).
9. Rastgele olaylar (10–15 tür).
10. Gerçek zamanlı sunucu, kalıcı dünya ve çevrimdışı otomatik pilot.

**MVP sonrası:** Meclis pazarlığı ve koalisyonlar, monarşi/tek parti rejimleri, oyuncular arası ticaret ve diplomasi, kritik kadro atamaları (merkez bankası, genelkurmay, valiler), savaş/çatışma, sezon sıralamaları, mobil uyumlu arayüz.

---

## 11. Önerilen teknoloji yığını

| Katman | Öneri | Neden |
|---|---|---|
| İstemci | Tarayıcı tabanlı; **TypeScript + React** (Vite) | Kurulum gerekmez, her cihazda açılır, panel ağırlıklı arayüze uygun |
| Grafikler | Recharts veya ECharts | Gösterge trendleri |
| Harita | Basit SVG dünya haritası (ör. d3-geo + TopoJSON) | Ülke seçimi ve diplomasi görünümü |
| Sunucu | **Node.js + TypeScript**, WebSocket (Socket.IO veya `ws`) | İstemciyle aynı dil, paylaşılan tip ve simülasyon kodu |
| Simülasyon | Sunucuda saf TypeScript modülü (deterministik, test edilebilir) | Tek doğruluk kaynağı sunucu; hile engellenir |
| Veritabanı | **PostgreSQL** (oyuncu, ülke durumu, geçmiş), Redis (oturum ve canlı durum, isteğe bağlı) | Güvenilir kalıcılık |
| Barındırma | İstemci: Vercel; sunucu: Fly.io / Railway / Render gibi sürekli çalışan bir servis | WebSocket için sürekli çalışan süreç gerekir (Vercel tek başına yetmez) |
| Yapı | Monorepo: `packages/shared` (tipler, simülasyon), `apps/server`, `apps/web` | Kod paylaşımı |

**Mimari özeti:** Sunucu yetkilidir. İstemci sadece karar gönderir ("asgari ücreti %20 artır"); sunucu doğrular, kuyruğa alır, her tick'te simülasyonu çalıştırır ve güncel durumu WebSocket ile ilgili oyunculara yayar.

---

## 12. Kararlar

1. Seçilmeyen ülkeleri yapay zekâ yönetir, seçilenler oyunculara verilir.
2. 1 gerçek gün ≈ 2 oyun ayı.
3. Tarayıcı tabanlı web sitesi.
4. Yeni kod deposu.
