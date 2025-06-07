package com.nativeapp

import android.os.Environment
import android.util.Log
import com.facebook.react.bridge.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.concurrent.Executors

class FileScannerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val executorService = Executors.newFixedThreadPool(5) // Multi-threading

    override fun getName(): String {
        return "FileScannerModule"
    }

    @ReactMethod
    fun scanFiles(promise: Promise) {
        executorService.execute {
            try {
                val rootDir = Environment.getExternalStorageDirectory()
                val ignoredDirs = listOf(
                    "com.", "cn.", ".cache", "cache", ".temp", ".thumbnails", 
                    "MIUI", "LOST.DIR", "Recycle.Bin", "data", "Notifications", 
                    "Ringtones", "obb", "DCIM/.thumbnails"
                )

                val fileCategories = mapOf(
                    "text" to listOf(".txt"),
                    "pptx" to listOf(".ppt", ".pptx"),
                    "documents" to listOf(".docx", ".doc"),
                    "excel" to listOf(".xlsx", ".xls", ".csv"),
                    "audio" to listOf(".mp3", ".wav"),
                    "image" to listOf(".jpg", ".png", ".jpeg"),
                    "pdfs" to listOf(".pdf"),
                    "video" to listOf(".mp4", ".mkv")
                )

                val filesList = scanDirectory(rootDir, ignoredDirs, fileCategories)
                promise.resolve(filesList.toString())
            } catch (e: Exception) {
                promise.reject("SCAN_ERROR", "Error scanning files: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun scanFilesByCategory(category: String, dir: String, promise: Promise) {
        executorService.execute {
            try {
                // val rootDir = Environment.getExternalStorageDirectory()
                // val downDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                // val docDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS)

                val dirPath = if (dir.isNotEmpty()) {
                File(dir)
                } else {
                    // fallback – Documents
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                }
                
                val ignoredDirs = listOf(
                    "com.", "cn.", ".cache", "cache", ".temp", ".thumbnails", 
                    "MIUI", "LOST.DIR", "Recycle.Bin", "data", "Notifications", 
                    "Ringtones", "obb", "DCIM/.thumbnails"
                )

                val fileCategories = mapOf(
                    "text" to listOf(".txt"),
                    "pptx" to listOf(".ppt", ".pptx"),
                    "documents" to listOf(".docx", ".doc"),
                    "excel" to listOf(".xlsx", ".xls", ".csv"),
                    "audio" to listOf(".mp3", ".wav"),
                    "image" to listOf(".jpg", ".png", ".jpeg"),
                    "pdfs" to listOf(".pdf"),
                    "video" to listOf(".mp4", ".mkv")
                )

                // Get the extensions for the requested category
                val categoryExtensions = fileCategories[category] 
                    ?: throw IllegalArgumentException("Invalid category: $category")

                // Create a single-category map to pass to scanDirectoryReturnPath
                val singleCategoryMap = mapOf(category to categoryExtensions)

                val filesList = scanDirectoryReturnPath(dirPath, ignoredDirs, singleCategoryMap)
                promise.resolve(filesList.toString())
            } catch (e: Exception) {
                promise.reject("SCAN_ERROR", "Error scanning files: ${e.message}")
            }
        }
    }

    private fun scanDirectory(dir: File, ignoredDirs: List<String>, fileCategories: Map<String, List<String>>): JSONArray {
    val filesArray = JSONArray()
    if (!dir.exists() || !dir.isDirectory) return filesArray

    val files = dir.listFiles() ?: return filesArray

    for (file in files) {
        try {
            if (file.isDirectory) {
                if (ignoredDirs.any { file.name.startsWith(it) }) continue // Skip ignored directories
                
                // 🔹 FIX: Instead of adding a nested array, append each item individually
                val subDirFiles = scanDirectory(file, ignoredDirs, fileCategories)
                for (i in 0 until subDirFiles.length()) {
                    filesArray.put(subDirFiles.getJSONObject(i))
                }
            } else {
                val fileExt = file.name.substringAfterLast('.', "").lowercase()
                val category = fileCategories.entries.find { it.value.contains(".$fileExt") }?.key

                if (category != null) {
                    val fileObject = JSONObject().apply {
                        //put("name", file.name)
                        //put("path", file.absolutePath)
                        //put("sizeKB", file.length() / 1024)
                        put("category", category)
                    }
                    filesArray.put(fileObject)
                }
            }
        } catch (e: Exception) {
            Log.e("FileScannerModule", "Error processing file: ${file.absolutePath}", e)
        }
    }
    return filesArray
}
    private fun scanDirectoryReturnPath(dir: File, ignoredDirs: List<String>, fileCategories: Map<String, List<String>>): JSONArray {
    val filesArray = JSONArray()
    if (!dir.exists() || !dir.isDirectory) return filesArray

    val files = dir.listFiles() ?: return filesArray

    for (file in files) {
        try {
            if (file.isDirectory) {
                if (ignoredDirs.any { file.name.startsWith(it) }) continue
                
                val subDirFiles = scanDirectoryReturnPath(file, ignoredDirs, fileCategories)
                for (i in 0 until subDirFiles.length()) {
                    filesArray.put(subDirFiles.getString(i))  // Just add the path directly
                }
            } else {
                val fileExt = file.name.substringAfterLast('.', "").lowercase()
                if (fileCategories.any { it.value.contains(".$fileExt") }) {
                    filesArray.put(file.absolutePath)  // Add the path directly to the array
                }
            }
        } catch (e: Exception) {
            Log.e("FileScannerModule", "Error processing file: ${file.absolutePath}", e)
        }
    }
    return filesArray
}
}