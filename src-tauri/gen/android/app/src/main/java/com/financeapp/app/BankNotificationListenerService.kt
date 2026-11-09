package com.financeapp.app

import android.app.Notification
import android.content.Intent
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class BankNotificationListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "BankNotificationSvc"
        const val ACTION_NEW_TRANSACTION = "com.financeapp.app.NEW_BANK_TRANSACTION"
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName ?: return

        val notification = sbn.notification ?: return
        val extras = notification.extras ?: return

        val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
        val timestamp = sbn.postTime

        val fullText = "$title $text $subText $bigText".lowercase()
        val isSupported = BankNotificationParser.isSupportedPackage(packageName, title)

        // Check if message looks like finance/money
        val looksLikeMoney = fullText.contains("vnd") || fullText.contains("vnđ") ||
                            fullText.contains("đ") || fullText.contains("tk") ||
                            fullText.contains("số dư") || fullText.contains("so du") ||
                            fullText.contains("giao dịch") || fullText.contains("giao dich") ||
                            fullText.contains("chuyen tien") || fullText.contains("chuyển tiền") ||
                            fullText.contains("bien dong") || fullText.contains("biến động")

        if (!isSupported) {
            // If it looks like a bank notification from an unmapped app, log it so user can report package name
            if (looksLikeMoney) {
                Log.w(TAG, "Financial notification detected from unsupported package: $packageName | Title='$title'")
                BankNotificationStorage.addDiagnosticLog(
                    context = applicationContext,
                    packageName = packageName,
                    bankName = null,
                    title = title,
                    text = text.ifEmpty { bigText },
                    status = "UNSUPPORTED_APP",
                    reason = "Ứng dụng '$packageName' chưa nằm trong danh mục ngân hàng"
                )
            }
            return
        }

        val bankInfo = BankNotificationParser.getBankInfo(packageName, title)

        when (val result = BankNotificationParser.parseWithDiagnostic(packageName, title, text, subText, bigText, timestamp)) {
            is ParseResult.Success -> {
                val parsed = result.transaction
                Log.i(TAG, "Successfully parsed bank transaction: ${parsed.bankName} ${parsed.type} ${parsed.amount} VND - ${parsed.content}")
                
                BankNotificationStorage.saveTransaction(applicationContext, parsed)
                BankNotificationStorage.addDiagnosticLog(
                    context = applicationContext,
                    packageName = packageName,
                    bankName = parsed.bankName,
                    title = title,
                    text = text.ifEmpty { bigText },
                    status = "SUCCESS",
                    reason = "Đã nhận diện: ${if (parsed.type == "expense") "-" else "+"}${parsed.amount} VND (${parsed.content})"
                )

                // Broadcast to MainActivity if app is in foreground
                val broadcastIntent = Intent(ACTION_NEW_TRANSACTION).apply {
                    putExtra("transactionId", parsed.id)
                    putExtra("bankCode", parsed.bankCode)
                    putExtra("bankName", parsed.bankName)
                    putExtra("amount", parsed.amount)
                    putExtra("type", parsed.type)
                    putExtra("content", parsed.content)
                    setPackage(applicationContext.packageName)
                }
                sendBroadcast(broadcastIntent)
            }
            is ParseResult.Ignored -> {
                Log.d(TAG, "Notification from $packageName ignored: ${result.reason}")
                BankNotificationStorage.addDiagnosticLog(
                    context = applicationContext,
                    packageName = packageName,
                    bankName = bankInfo?.name,
                    title = title,
                    text = text.ifEmpty { bigText },
                    status = "IGNORED",
                    reason = result.reason
                )
            }
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.i(TAG, "BankNotificationListenerService connected and active!")
        BankNotificationStorage.addDiagnosticLog(
            context = applicationContext,
            packageName = applicationContext.packageName,
            bankName = "Hệ thống",
            title = "Dịch vụ đọc thông báo",
            text = "Dịch vụ đã kết nối thành công và đang hoạt động",
            status = "SERVICE_CONNECTED",
            reason = "NotificationListenerService đã sẵn sàng nhận thông báo"
        )
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.w(TAG, "BankNotificationListenerService disconnected.")
        BankNotificationStorage.addDiagnosticLog(
            context = applicationContext,
            packageName = applicationContext.packageName,
            bankName = "Hệ thống",
            title = "Dịch vụ đọc thông báo",
            text = "Dịch vụ đã bị ngắt kết nối bởi hệ thống",
            status = "SERVICE_DISCONNECTED",
            reason = "Cần kiểm tra lại quyền truy cập thông báo hoặc cài đặt tiết kiệm pin"
        )
    }
}
