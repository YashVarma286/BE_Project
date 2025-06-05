package com.nativeapp.modules;

import android.app.ActivityManager;
import android.os.Build;
import android.os.Debug;
import android.content.Context;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class CpuModule extends ReactContextBaseJavaModule {

    public CpuModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "CpuModule";
    }

    @ReactMethod
    public void getCpuUsage(Promise promise) {
        try {
            ActivityManager activityManager = (ActivityManager) getReactApplicationContext().getSystemService(Context.ACTIVITY_SERVICE);
            if (activityManager != null) {
                ActivityManager.MemoryInfo memoryInfo = new ActivityManager.MemoryInfo();
                activityManager.getMemoryInfo(memoryInfo);

                double usedMemory = (double) (memoryInfo.totalMem - memoryInfo.availMem);
                double totalMemory = (double) memoryInfo.totalMem;
                double usage = (usedMemory / totalMemory) * 100.0;

                promise.resolve(usage);
            } else {
                promise.reject("ERROR", "ActivityManager is null");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }
}
