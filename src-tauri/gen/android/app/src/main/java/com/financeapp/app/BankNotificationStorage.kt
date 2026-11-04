package com.financeapp.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID

data class DiagnosticLogItem(
    val id: String = UUID.randomUUID().toString(),
    val timestamp: Long = System.currentTimeMillis(),
    val packageName: String,
    val bankName: String? = null,
    val title: String,
    val text: String,
    val status: String, // "SUCCESS" | "IGNORED" | "FAILED"
    val reason: String
)

object BankNotificationStorage {

    private const val FILE_NAME = "pending_bank_transactions.json"
    private const val LOGS_FILE_NAME = "notification_diagnostic_logs.json"
    private const val MAX_SAVED_ITEMS = 100
    private const val MAX_LOG_ITEMS = 50

    @Synchronized
    fun saveTransaction(context: Context, tx: ParsedBankTransaction) {
        val list = loadTransactions(context).toMutableList()

        // Deduplication check: same bankCode + amount + time within 60 seconds
        val isDuplicate = list.any { existing ->
            existing.bankCode == tx.bankCode &&
            existing.amount == tx.amount &&
            Math.abs(existing.timestamp - tx.timestamp) < 60_000L
        }

        if (isDuplicate) return

        // Add to top of list
        list.add(0, tx)
        if (list.size > MAX_SAVED_ITEMS) {
            list.removeAt(list.size - 1)
        }

        writeListToFile(context, list)
    }

    @Synchronized
    fun loadTransactions(context: Context): List<ParsedBankTransaction> {
        val file = getTargetFile(context, FILE_NAME)
        if (!file.exists()) return emptyList()

        return try {
            val content = file.readText()
            val array = JSONArray(content)
            val result = mutableListOf<ParsedBankTransaction>()

            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                result.add(
                    ParsedBankTransaction(
                        id = obj.optString("id"),
                        bankCode = obj.optString("bankCode"),
                        bankName = obj.optString("bankName"),
                        amount = obj.optLong("amount"),
                        type = obj.optString("type", "expense"),
                        accountNumber = obj.optString("accountNumber").takeIf { it.isNotEmpty() },
                        content = obj.optString("content").takeIf { it.isNotEmpty() },
                        timestamp = obj.optLong("timestamp"),
                        rawTitle = obj.optString("rawTitle"),
                        rawText = obj.optString("rawText"),
                        packageName = obj.optString("packageName"),
                        status = obj.optString("status", "pending")
                    )
                )
            }
            result
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    @Synchronized
    fun updateTransactionStatus(context: Context, id: String, status: String) {
        val list = loadTransactions(context).map {
            if (it.id == id) it.copy(status = status) else it
        }
        writeListToFile(context, list)
    }

    @Synchronized
    fun clearProcessed(context: Context) {
        val list = loadTransactions(context).filter { it.status == "pending" }
        writeListToFile(context, list)
    }

    private fun writeListToFile(context: Context, list: List<ParsedBankTransaction>) {
        try {
            val array = JSONArray()
            for (tx in list) {
                val obj = JSONObject().apply {
                    put("id", tx.id)
                    put("bankCode", tx.bankCode)
                    put("bankName", tx.bankName)
                    put("amount", tx.amount)
                    put("type", tx.type)
                    put("accountNumber", tx.accountNumber ?: "")
                    put("content", tx.content ?: "")
                    put("timestamp", tx.timestamp)
                    put("rawTitle", tx.rawTitle)
                    put("rawText", tx.rawText)
                    put("packageName", tx.packageName)
                    put("status", tx.status)
                }
                array.put(obj)
            }

            val jsonString = array.toString(2)
            val file1 = File(context.filesDir, FILE_NAME)
            file1.writeText(jsonString)

            context.noBackupFilesDir?.let {
                File(it, FILE_NAME).writeText(jsonString)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // Diagnostic Logs API
    @Synchronized
    fun addDiagnosticLog(
        context: Context,
        packageName: String,
        bankName: String?,
        title: String,
        text: String,
        status: String,
        reason: String
    ) {
        val logs = loadDiagnosticLogs(context).toMutableList()
        val item = DiagnosticLogItem(
            packageName = packageName,
            bankName = bankName,
            title = title,
            text = text,
            status = status,
            reason = reason
        )
        logs.add(0, item)
        if (logs.size > MAX_LOG_ITEMS) {
            logs.removeAt(logs.size - 1)
        }

        try {
            val array = JSONArray()
            for (l in logs) {
                val obj = JSONObject().apply {
                    put("id", l.id)
                    put("timestamp", l.timestamp)
                    put("packageName", l.packageName)
                    put("bankName", l.bankName ?: "")
                    put("title", l.title)
                    put("text", l.text)
                    put("status", l.status)
                    put("reason", l.reason)
                }
                array.put(obj)
            }
            val jsonString = array.toString(2)
            File(context.filesDir, LOGS_FILE_NAME).writeText(jsonString)
            context.noBackupFilesDir?.let {
                File(it, LOGS_FILE_NAME).writeText(jsonString)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @Synchronized
    fun loadDiagnosticLogs(context: Context): List<DiagnosticLogItem> {
        val file = getTargetFile(context, LOGS_FILE_NAME)
        if (!file.exists()) return emptyList()

        return try {
            val content = file.readText()
            val array = JSONArray(content)
            val result = mutableListOf<DiagnosticLogItem>()

            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                result.add(
                    DiagnosticLogItem(
                        id = obj.optString("id"),
                        timestamp = obj.optLong("timestamp"),
                        packageName = obj.optString("packageName"),
                        bankName = obj.optString("bankName").takeIf { it.isNotEmpty() },
                        title = obj.optString("title"),
                        text = obj.optString("text"),
                        status = obj.optString("status"),
                        reason = obj.optString("reason")
                    )
                )
            }
            result
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    @Synchronized
    fun clearDiagnosticLogs(context: Context) {
        try {
            val file1 = File(context.filesDir, LOGS_FILE_NAME)
            if (file1.exists()) file1.delete()
            context.noBackupFilesDir?.let {
                val file2 = File(it, LOGS_FILE_NAME)
                if (file2.exists()) file2.delete()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getTargetFile(context: Context, fileName: String): File {
        val primary = File(context.filesDir, fileName)
        if (primary.exists()) return primary
        val secondary = context.noBackupFilesDir?.let { File(it, fileName) }
        if (secondary?.exists() == true) return secondary
        return primary
    }
}
