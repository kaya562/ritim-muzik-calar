package com.ritim.musicplayer;

import android.Manifest;
import android.content.ContentUris;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(
    name = "MusicLibrary",
    permissions = {
        @Permission(alias = "audioModern", strings = { Manifest.permission.READ_MEDIA_AUDIO }),
        @Permission(alias = "audioLegacy", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
    }
)
public class MusicLibraryPlugin extends Plugin {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void listAudio(PluginCall call) {
        if (!hasAudioPermission()) {
            requestPermissionForAlias(audioPermissionAlias(), call, "audioPermissionCallback");
            return;
        }
        queryAudio(call);
    }

    @PermissionCallback
    private void audioPermissionCallback(PluginCall call) {
        if (!hasAudioPermission()) {
            call.reject("Cihazdaki müziklere erişim izni verilmedi.");
            return;
        }
        queryAudio(call);
    }

    private boolean hasAudioPermission() {
        String permission = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            ? Manifest.permission.READ_MEDIA_AUDIO
            : Manifest.permission.READ_EXTERNAL_STORAGE;
        return hasPermission(permission);
    }

    private String audioPermissionAlias() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ? "audioModern" : "audioLegacy";
    }

    private void queryAudio(PluginCall call) {
        executor.execute(() -> {
            try {
                Uri collection = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                String[] projection = {
                    MediaStore.Audio.Media._ID,
                    MediaStore.Audio.Media.TITLE,
                    MediaStore.Audio.Media.ARTIST,
                    MediaStore.Audio.Media.DISPLAY_NAME,
                    MediaStore.Audio.Media.DURATION,
                    MediaStore.Audio.Media.SIZE
                };
                JSArray result = new JSArray();
                try (Cursor cursor = getContext().getContentResolver().query(
                    collection,
                    projection,
                    MediaStore.Audio.Media.IS_MUSIC + " != 0",
                    null,
                    MediaStore.Audio.Media.TITLE + " COLLATE NOCASE ASC"
                )) {
                    if (cursor != null) {
                        int idColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
                        int titleColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
                        int artistColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
                        int nameColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME);
                        int durationColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
                        int sizeColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE);
                        while (cursor.moveToNext()) {
                            JSObject track = new JSObject();
                            track.put("id", cursor.getString(idColumn));
                            track.put("title", cursor.getString(titleColumn));
                            track.put("artist", cursor.getString(artistColumn));
                            track.put("displayName", cursor.getString(nameColumn));
                            track.put("duration", cursor.getLong(durationColumn));
                            track.put("size", cursor.getLong(sizeColumn));
                            result.put(track);
                        }
                    }
                }
                JSObject response = new JSObject();
                response.put("tracks", result);
                call.resolve(response);
            } catch (Exception exception) {
                call.reject("Telefon müzikleri taranamadı.", exception);
            }
        });
    }

    @PluginMethod
    public void getAudioFile(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.isEmpty()) {
            call.reject("Müzik dosyası kimliği eksik.");
            return;
        }

        executor.execute(() -> {
            File temporaryFile = null;
            try {
                long mediaId = Long.parseLong(id);
                Uri uri = ContentUris.withAppendedId(
                    MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                    mediaId
                );
                String displayName;
                try (Cursor cursor = getContext().getContentResolver().query(
                    uri,
                    new String[] { MediaStore.Audio.Media.DISPLAY_NAME },
                    null,
                    null,
                    null
                )) {
                    if (cursor == null || !cursor.moveToFirst()) {
                        call.reject("Müzik dosyası telefonda bulunamadı.");
                        return;
                    }
                    displayName = cursor.getString(0);
                }

                File cacheDirectory = new File(getContext().getCacheDir(), "music-library");
                if (!cacheDirectory.exists() && !cacheDirectory.mkdirs()) {
                    throw new IllegalStateException("Müzik önbelleği oluşturulamadı.");
                }
                String extension = displayName != null && displayName.matches("(?i).*\\.[a-z0-9]{1,8}$")
                    ? displayName.substring(displayName.lastIndexOf('.'))
                    : ".audio";
                File destination = new File(cacheDirectory, mediaId + extension);
                if (!destination.isFile()) {
                    temporaryFile = new File(cacheDirectory, mediaId + ".tmp");
                    try (InputStream input = getContext().getContentResolver().openInputStream(uri);
                         FileOutputStream output = new FileOutputStream(temporaryFile)) {
                        if (input == null) throw new IllegalStateException("Müzik dosyası okunamadı.");
                        byte[] buffer = new byte[64 * 1024];
                        int length;
                        while ((length = input.read(buffer)) != -1) {
                            output.write(buffer, 0, length);
                        }
                    }
                    if (!temporaryFile.renameTo(destination)) {
                        throw new IllegalStateException("Müzik dosyası önbelleğe alınamadı.");
                    }
                    temporaryFile = null;
                }
                JSObject response = new JSObject();
                response.put("path", destination.getAbsolutePath());
                call.resolve(response);
            } catch (Exception exception) {
                if (temporaryFile != null) temporaryFile.delete();
                call.reject("Müzik dosyası açılamadı.", exception);
            }
        });
    }
}
