# Android uygulamasi

Uygulama Android Studio, Android SDK 36 ve JDK 21 ile derlenir. Android ilk acilista muzik kutuphanesi izni ister; izin verildiginde telefondaki muzikleri otomatik listeler.

1. Android Studio'yu Android SDK ile bilgisayara kur.
2. Bu klasorde terminal acip `npm install` ve `npm run android:setup` komutlarini calistir.
3. Web uygulamasinda degisiklik yaptiginda `npm run android:sync` komutunu calistir.
4. APK olusturmak icin `npm run android:apk` komutunu calistir. Dosya `android/app/build/outputs/apk/debug/app-debug.apk` konumuna gelir.

Olusan APK, telefona dogrudan kurulabilen test surumudur; Play Store yayini icin ayri bir imzali surum hazirlanmalidir. Muzik dosyalari telefondan secilir ve uygulama disina yuklenmez.
