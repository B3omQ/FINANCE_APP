package com.financeapp.app

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import androidx.activity.enableEdgeToEdge
import androidx.core.app.NotificationManagerCompat

class MainActivity : TauriActivity() {

  companion object {
    fun isNotificationListenerGranted(context: Context): Boolean {
      val enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(context)
      return enabledPackages.contains(context.packageName)
    }

    fun openNotificationListenerSettings(context: Context) {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }
}
