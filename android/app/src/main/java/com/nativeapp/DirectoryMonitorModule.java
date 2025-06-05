package com.nativeapp.modules;

import android.os.FileObserver;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import com.facebook.react.bridge.Promise;
import android.os.Environment;

public class DirectoryMonitorModule extends ReactContextBaseJavaModule {
    private static final String TAG = "DirectoryMonitor";
    private final Set<String> allowedExtensions = new HashSet<>(Arrays.asList(
            ".txt", ".pdf", ".doc", ".docx", ".pptx", ".ppt",
            ".csv", ".xlsx", ".xls", ".mkv", ".mp3", ".mp4"));
    private static final Set<String> ignoreFolders = new HashSet<>(Arrays.asList(
            "cn.", // App-specific directories
            ".cache", // Cache directories
            "cache", // Cache directories
            ".temp", // Temporary files
            ".thumbnails", // Thumbnail cache
            ".Thumbs", // Thumbnail cache
            ".StickerThumbs", // Thumbnail cache
            ".trashed",
            ".Statuses",
            ".globalTrash",
            ".system_config",
            "MIUI", // Xiaomi-specific system files
            "LOST.DIR", // Recovered lost files
            "DCIM/.thumbnails", // Image thumbnails
            "Recycle.Bin", // Windows-style recycle bin
            ".trash", // Trash folder (Linux/Android)
            ".nomedia", // Prevents media scanning
            "Alarms", // Alarm sounds
            "Notifications", // Notification sounds
            "Ringtones", // Ringtone sounds
            "obb", // Pre-installed system
            "data", // Pre-installed system
            "Podcasts" // Pre-installed system podcasts
    ));
    private final Map<String, FileObserver> fileObservers = new HashMap<>();

    public DirectoryMonitorModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "DirectoryMonitor";
    }

    @ReactMethod
    public void startMonitoring(String directoryPath) {
        // sendEvent("Starting... folder: ",directoryPath);
        stopMonitoring(directoryPath); // Ensure no duplicate monitoring for the same path

        File directory = new File(directoryPath);
        if (!directory.exists() || !directory.isDirectory()) {
            Log.e(TAG, "Invalid directory path: " + directoryPath);
            return;
        }

        monitorDirectoryTree(directoryPath);
    }

    @ReactMethod
    public void stopMonitoring(String directoryPath) {
        FileObserver observer = fileObservers.remove(directoryPath);
        if (observer != null) {
            observer.stopWatching();
            Log.d(TAG, "Stopped monitoring: " + directoryPath);
        }
    }

    @ReactMethod
    public void stopAllMonitoring() {
        for (Map.Entry<String, FileObserver> entry : fileObservers.entrySet()) {
            entry.getValue().stopWatching();
            Log.d(TAG, "Stopped monitoring: " + entry.getKey());
        }
        fileObservers.clear();
        Log.d(TAG, "Stopped all monitoring.");
    }

    private void monitorDirectoryTree(String directoryPath) {
        File root = new File(directoryPath);

        // Extract folder name from the path
        String folderName = root.getName();

        // Check if the folder should be ignored
        for (String ignoreFolder : ignoreFolders) {
            if (folderName.startsWith(ignoreFolder) || folderName.equalsIgnoreCase(ignoreFolder)) {
                Log.d(TAG, "Ignoring folder: " + directoryPath);
                return; // Skip monitoring this folder
            }
        }
        createFileObserver(directoryPath); // Start monitoring the allowed directory
        // Traverse subdirectories
        File[] subDirs = root.listFiles(File::isDirectory);
        if (subDirs != null) {
            for (File subDir : subDirs) {
                monitorDirectoryTree(subDir.getAbsolutePath()); // Recursively monitor subdirectories
            }
        }
        sendEvent("MonitoringEvent", directoryPath);
    }

    private final Map<String, Long> recentCreations = new HashMap<>();

    private void createFileObserver(String path) {
        if (fileObservers.containsKey(path))
            return; // Avoid duplicate monitoring

        FileObserver observer = new FileObserver(path, FileObserver.ALL_EVENTS) {
            @Override
            public void onEvent(int event, String fileName) {
                if (fileName == null)
                    return;

                String fileExtension = getFileExtension(fileName);
                if (!allowedExtensions.contains(fileExtension)) {
                    return; // Ignore files with disallowed extensions
                }

                String filePath = path + "/" + fileName;

                String eventType = "";
                switch (event) {
                    case FileObserver.CREATE:
                        eventType = "CREATE";
                        recentCreations.put(filePath, System.currentTimeMillis());
                        break;
                    case FileObserver.DELETE:
                        eventType = "DELETE";
                        break;
                }

                if (!eventType.isEmpty()) {
                    // String filePath = path + "/" + fileName;
                    sendEvent(eventType, filePath);

                    // If a new directory is created, monitor it recursively
                    if (eventType.equals("CREATE") && new File(filePath).isDirectory()) {
                        monitorDirectoryTree(filePath);
                    }
                }
            }
        };

        observer.startWatching();
        fileObservers.put(path, observer);
        Log.d(TAG, "Started monitoring: " + path);
    }

    private void sendEvent(String eventType, String filePath) {
        if (getReactApplicationContext().hasActiveCatalystInstance()) {
            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("FileChangeEvent", eventType + ":" + filePath);
        }
    }

    @ReactMethod
    public void getAvailableDirectories(Promise promise) {
        try {
            Map<String, String> directories = new HashMap<>();

            // Root Storage Directory (Internal Storage Root)
            directories.put("Root", Environment.getExternalStorageDirectory().getAbsolutePath());

            directories.put("Downloads",
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).getAbsolutePath());
            directories.put("Documents",
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS).getAbsolutePath());
            directories.put("Pictures",
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES).getAbsolutePath());
            directories.put("Music",
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC).getAbsolutePath());
            directories.put("Movies",
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES).getAbsolutePath());

            promise.resolve(new org.json.JSONObject(directories).toString());
            // promise.resolve(directories);
        } catch (Exception e) {
            promise.reject("Error", e.getMessage());
        }
    }

    @ReactMethod
    public void getRootDirectory(Promise promise) {
        try {
            File rootDirectory = Environment.getExternalStorageDirectory();
            if (rootDirectory != null && rootDirectory.exists()) {
                promise.resolve(rootDirectory.getAbsolutePath());
            } else {
                promise.reject("RootDirectoryError", "Root directory does not exist or is inaccessible.");
            }
        } catch (Exception e) {
            promise.reject("RootDirectoryError", e.getMessage());
        }
    }

    private String getFileExtension(String fileName) {
        int lastIndex = fileName.lastIndexOf(".");
        return (lastIndex == -1) ? "" : fileName.substring(lastIndex).toLowerCase();
    }
}