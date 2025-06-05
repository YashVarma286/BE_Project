import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment // Add this import
import android.provider.Settings
import android.content.pm.PackageManager
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class StoragePermissionHelper(private val activity: AppCompatActivity) {

    // Request appropriate permissions based on Android version
    fun requestStoragePermission() {
        if (hasRequiredPermissions()) {
            // Permissions already granted
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+: Request MANAGE_EXTERNAL_STORAGE permission
            requestManageAllFilesPermission()
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+: Request granular permissions
            requestMediaPermissions.launch(android.Manifest.permission.READ_MEDIA_IMAGES)
        } else {
            // Android 12 and lower: Legacy permission
            requestLegacyPermission.launch(android.Manifest.permission.READ_EXTERNAL_STORAGE)
        }
    }

    // Check if permissions are granted
    fun hasRequiredPermissions(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Environment.isExternalStorageManager()
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                activity,
                android.Manifest.permission.READ_MEDIA_IMAGES
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(
                activity,
                android.Manifest.permission.READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED
        }
    }

    // Handle Android 13+ permissions
    private val requestMediaPermissions = activity.registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            showPermissionRationale("This app needs access to media files to scan for duplicates.")
        }
    }

    // Handle legacy permissions
    private val requestLegacyPermission = activity.registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            showPermissionRationale("This app needs storage access to find duplicate files.")
        }
    }

    // Request MANAGE_EXTERNAL_STORAGE permission
    private fun requestManageAllFilesPermission() {
        val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
            data = Uri.parse("package:${activity.packageName}")
        }
        activity.startActivity(intent)
    }

    // Explain why permissions are needed and redirect to settings
    private fun showPermissionRationale(message: String) {
        AlertDialog.Builder(activity)
            .setTitle("Permission Required")
            .setMessage(message)
            .setPositiveButton("Open Settings") { _, _ ->
                openAppSettings()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun openAppSettings() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:${activity.packageName}")
        }
        activity.startActivity(intent)
    }
}