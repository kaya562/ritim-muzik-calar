# Ritim Müzik Çalar

Türkçe arayüzlü, telefon ve bilgisayarda çalışan müzik çalar. Android uygulaması telefondaki müzikleri izin verildiğinde otomatik listeler; web sürümünde müzik dosyası veya klasörü kullanıcı tarafından seçilir.

## Kullan

- Web uygulaması: https://karliyin.github.io/ritim-muzik-calar/
- Android APK: [Releases](https://github.com/karliyin/ritim-muzik-calar/releases/latest)

Android'de ilk açılışta müzik erişim iznini onayla. Web'de kişisel müziklerini eklemek için **Müzik klasörünü tara** seçeneğini kullan.

## Android uygulamasını derle

Gereksinimler: Node.js, JDK 21 ve Android SDK 36.

```powershell
cd android-wrapper
npm ci
npm run android:apk
```

APK `android/app/build/outputs/apk/debug/app-debug.apk` konumuna oluşturulur. `android:setup`, Android projesini ilk kez oluşturmak içindir; Android kaynakları depoda hazırdır.

## Müzik kaynakları

Seçili arşiv parçaları Wikimedia Commons'tan yüklenir; kişisel müzik dosyaları cihazdan dışarı gönderilmez.
