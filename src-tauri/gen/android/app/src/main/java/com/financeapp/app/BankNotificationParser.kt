package com.financeapp.app

import java.util.UUID
import java.util.regex.Pattern

data class ParsedBankTransaction(
    val id: String = UUID.randomUUID().toString(),
    val bankCode: String,
    val bankName: String,
    val amount: Long,
    val type: String, // "expense" | "income"
    val accountNumber: String?,
    val content: String?,
    val timestamp: Long,
    val rawTitle: String,
    val rawText: String,
    val packageName: String,
    val status: String = "pending" // "pending" | "imported" | "dismissed"
)

sealed class ParseResult {
    data class Success(val transaction: ParsedBankTransaction) : ParseResult()
    data class Ignored(val reason: String, val bankName: String? = null) : ParseResult()
}

object BankNotificationParser {

    data class BankInfo(val code: String, val name: String)

    val PACKAGE_MAP = mapOf(
        // Techcombank
        "vn.com.techcombank.bb.app" to BankInfo("TCB", "Techcombank"),
        "vn.com.techcombank.bb.corp.app" to BankInfo("TCB", "Techcombank Business"),
        "com.techcombank.bb.app" to BankInfo("TCB", "Techcombank"),
        "com.techcombank.bb.corp.app" to BankInfo("TCB", "Techcombank Business"),
        "vn.com.techcombank.epos" to BankInfo("TCB", "Techcombank T-Shop"),
        "com.fastacash.tcb" to BankInfo("TCB", "Techcombank"),
        "vn.techcombank.retail" to BankInfo("TCB", "Techcombank"),
        "vn.techcombank" to BankInfo("TCB", "Techcombank"),
        "vn.com.techcombank" to BankInfo("TCB", "Techcombank"),
        "com.techcombank" to BankInfo("TCB", "Techcombank"),

        // MB Bank
        "com.mbmobile" to BankInfo("MB", "MB Bank"),
        "com.mb.app" to BankInfo("MB", "MB Bank"),
        "com.mbbank.mobile" to BankInfo("MB", "MB Bank"),

        // Vietcombank
        "com.VCB" to BankInfo("VCB", "Vietcombank"),
        "com.vcb.digibank" to BankInfo("VCB", "Vietcombank"),
        "com.vietcombank" to BankInfo("VCB", "Vietcombank"),

        // BIDV
        "com.vnpay.bidv" to BankInfo("BIDV", "BIDV SmartBanking"),
        "com.bidv.smartbanking" to BankInfo("BIDV", "BIDV SmartBanking"),

        // VietinBank
        "com.vietinbank.ipay" to BankInfo("CTG", "VietinBank iPay"),

        // VPBank
        "com.vnpay.vpbankonline" to BankInfo("VPB", "VPBank NEO"),
        "com.vpbank.online" to BankInfo("VPB", "VPBank NEO"),
        "vn.vpbank.cake" to BankInfo("CAKE", "Cake by VPBank"),

        // TPBank
        "com.tpb.mb.gprsandroid" to BankInfo("TPB", "TPBank"),
        "com.tpb.mbank" to BankInfo("TPB", "TPBank"),

        // ACB
        "mobile.acb.com.vn" to BankInfo("ACB", "ACB ONE"),
        "com.acb.acbone" to BankInfo("ACB", "ACB ONE"),

        // Agribank
        "com.vnpay.agribank" to BankInfo("AGR", "Agribank E-Mobile"),
        "vn.agribank.mobilebanking" to BankInfo("AGR", "Agribank E-Mobile"),

        // Sacombank
        "com.sacombank.mbanking" to BankInfo("STB", "Sacombank mBanking"),
        "com.sacombank.pay" to BankInfo("STB", "Sacombank Pay"),

        // Timo & Others
        "vn.timo.digitalbank" to BankInfo("TIMO", "Timo Digital Bank"),
        "vn.timo" to BankInfo("TIMO", "Timo Digital Bank"),
        "com.vnpay.hdbank" to BankInfo("HDB", "HDBank Mobile"),
        "com.vib.myvib2" to BankInfo("VIB", "MyVIB 2.0"),
        "com.vnpay.ocb" to BankInfo("OCB", "OCB OMNI"),
        "com.vnpay.msb" to BankInfo("MSB", "MSB mBank"),

        // E-Wallets
        "com.mservice.momopay" to BankInfo("MOMO", "Ví MoMo"),
        "vn.com.vng.zalopay" to BankInfo("ZALOPAY", "ZaloPay"),
        "com.vng.zalopay" to BankInfo("ZALOPAY", "ZaloPay"),
        "com.bplus.vtpay" to BankInfo("VTPAY", "Viettel Money")
    )

    // Pattern to strip out balance information so it is never confused with the transaction amount
    private val BALANCE_PATTERN = Pattern.compile(
        """(?i)(?:số\s*dư|so\s*du|số\s*dư\s*khả\s*dụng|so\s*du\s*kha\s*dung)\s*:?\s*(?:VND|VNĐ|vnd|vnđ|đ|d)?\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,12})\s*(?:VND|VNĐ|vnd|vnđ|đ|d)?"""
    )

    // Regex to match amount formats:
    // 1) Sign [+-] followed by optional currency unit (VND/đ) and number (e.g. Techcombank: +VND 500,000, -VND 150,000, + VND 500,000)
    // 2) Currency unit followed by sign [+-] and number (e.g. VND +500,000, VND -150,000)
    // 3) Standard number followed by currency unit (e.g. MB/VCB: +500,000 VND, -150,000VND, 120.000đ)
    private val AMOUNT_PATTERN = Pattern.compile(
        """(?:([+-])\s*(?:VND|VNĐ|vnd|vnđ|đ|d)?\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,12})|(?:VND|VNĐ|vnd|vnđ|đ|d)\s*([+-])\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,12})|([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,12})\s*(?:VND|VNĐ|vnd|vnđ|đ|d))""",
        Pattern.CASE_INSENSITIVE
    )

    // Regex to extract account number (e.g. "TK 0123...", "tai khoan 1903...", "Tai khoan thanh toan 1903...")
    private val ACCOUNT_PATTERN = Pattern.compile(
        """\b(?:TK|Tài khoản|Tai khoan|Số TK|So TK|Thẻ|The)\s*(?:thanh toán|thanh toan|ghi nợ|tin dung|debit|credit)?\s*:?\s*([0-9A-Za-z*]{3,20})""",
        Pattern.CASE_INSENSITIVE
    )

    // High-priority note pattern with word boundaries (avoids 'VND' matching loose 'ND')
    private val NOTE_PRIORITY_PATTERN = Pattern.compile(
        """\b(?:Nội dung|Noi dung|Lý do|Ly do|Ghi chú|Ghi chu|ND)\b\s*:?\s*([^|;\n\r.]+)""",
        Pattern.CASE_INSENSITIVE
    )

    // Fallback note pattern for merchant / recipient locations
    private val NOTE_FALLBACK_PATTERN = Pattern.compile(
        """\b(?:tại|tai|cho|tới|to)\b\s*:?\s*(?!Techcombank|MB|Vietcombank|ACB|VPBank|BIDV)([^|;\n\r.]+)""",
        Pattern.CASE_INSENSITIVE
    )

    fun getBankInfo(packageName: String, title: String = ""): BankInfo? {
        val direct = PACKAGE_MAP[packageName]
        if (direct != null) return direct

        val lowerPkg = packageName.lowercase()
        val lowerTitle = title.lowercase()
        return when {
            lowerPkg.contains("techcombank") || lowerPkg.contains("tcb") || lowerTitle.contains("techcombank") -> BankInfo("TCB", "Techcombank")
            lowerPkg.contains("mbmobile") || lowerPkg.contains("mbbank") || lowerTitle.contains("mb bank") || lowerTitle.contains("mbbank") -> BankInfo("MB", "MB Bank")
            lowerPkg.contains("vietcombank") || lowerPkg.contains("vcb") || lowerTitle.contains("vietcombank") -> BankInfo("VCB", "Vietcombank")
            lowerPkg.contains("bidv") || lowerTitle.contains("bidv") -> BankInfo("BIDV", "BIDV SmartBanking")
            lowerPkg.contains("vietinbank") || lowerPkg.contains("ipay") || lowerTitle.contains("vietinbank") -> BankInfo("CTG", "VietinBank iPay")
            lowerPkg.contains("vpbank") || lowerTitle.contains("vpbank") -> BankInfo("VPB", "VPBank NEO")
            lowerPkg.contains("tpbank") || lowerTitle.contains("tpbank") -> BankInfo("TPB", "TPBank")
            lowerPkg.contains("acb") || lowerTitle.contains("acb") -> BankInfo("ACB", "ACB ONE")
            else -> null
        }
    }

    fun isSupportedPackage(packageName: String, title: String = ""): Boolean {
        return getBankInfo(packageName, title) != null
    }

    fun parseWithDiagnostic(
        packageName: String,
        title: String,
        text: String,
        subText: String = "",
        bigText: String = "",
        timestamp: Long = System.currentTimeMillis()
    ): ParseResult {
        val bank = getBankInfo(packageName, title)
            ?: return ParseResult.Ignored("Ứng dụng '$packageName' chưa nằm trong danh sách ngân hàng được hỗ trợ")

        val fullContent = listOf(title, text, subText, bigText)
            .filter { it.isNotBlank() }
            .joinToString(" ")

        val lower = fullContent.lowercase()

        // Skip obvious promotional or non-transaction messages
        val isPromo = lower.contains("khuyen mai") || lower.contains("khuyến mãi") ||
                      lower.contains("uu dai") || lower.contains("ưu đãi") ||
                      lower.contains("voucher") || lower.contains("chuc mung sinh nhat")
        if (isPromo) {
            return ParseResult.Ignored("Bỏ qua tin khuyến mãi / quảng cáo", bank.name)
        }

        // Clean out account balance numbers first so they are never confused with transaction amounts
        val contentWithoutBalance = BALANCE_PATTERN.matcher(fullContent).replaceAll("")

        val matcher = AMOUNT_PATTERN.matcher(contentWithoutBalance)
        var matchedAmount = 0L
        var isExpense = true
        var foundAmount = false

        while (matcher.find()) {
            val sign = matcher.group(1) ?: matcher.group(3) ?: ""
            val rawNum = (matcher.group(2) ?: matcher.group(4) ?: matcher.group(5) ?: "")
                .replace(".", "")
                .replace(",", "")
            val parsedNum = rawNum.toLongOrNull() ?: 0L

            if (parsedNum >= 1000) {
                matchedAmount = parsedNum
                foundAmount = true

                if (sign == "+") {
                    isExpense = false
                } else if (sign == "-") {
                    isExpense = true
                } else {
                    // Contextual check for keywords
                    val isIncomeKeyword = lower.contains("cong tien") || lower.contains("cộng tiền") ||
                                          lower.contains("nhan duoc") || lower.contains("nhận được") ||
                                          lower.contains("hoan tien") || lower.contains("hoàn tiền") ||
                                          lower.contains("nap tien") || lower.contains("nạp tiền") ||
                                          lower.contains("tang") || lower.contains("tăng") ||
                                          lower.contains("ghi co") || lower.contains("ghi có") ||
                                          lower.contains("ps tang") || lower.contains("ps tăng") ||
                                          lower.contains("nhan tu") || lower.contains("nhận từ")

                    val isExpenseKeyword = lower.contains("tru tien") || lower.contains("trừ tiền") ||
                                           lower.contains("giam") || lower.contains("giảm") ||
                                           lower.contains("ghi no") || lower.contains("ghi nợ") ||
                                           lower.contains("ps giam") || lower.contains("ps giảm") ||
                                           lower.contains("thanh toan") || lower.contains("thanh toán") ||
                                           lower.contains("chuyen tien") || lower.contains("chuyển tiền") ||
                                           lower.contains("chuyen khoan") || lower.contains("chuyển khoản") ||
                                           lower.contains("chuyen di") || lower.contains("chuyển đi") ||
                                           lower.contains("rut tien") || lower.contains("rút tiền") ||
                                           lower.contains("phi") || lower.contains("phí")

                    if (isIncomeKeyword && !isExpenseKeyword) {
                        isExpense = false
                    } else {
                        isExpense = true
                    }
                }
                break
            }
        }

        if (!foundAmount || matchedAmount == 0L) {
            return ParseResult.Ignored("Không tìm thấy số tiền hợp lệ (>= 1,000 VND) trong nội dung", bank.name)
        }

        // Extract account number if present
        val accMatcher = ACCOUNT_PATTERN.matcher(fullContent)
        val accountNumber = if (accMatcher.find()) accMatcher.group(1)?.trim() else null

        // Extract note if present (prioritize 'ND:', 'Noi dung:' over merchant fallback)
        var note: String? = null
        val noteMatcher = NOTE_PRIORITY_PATTERN.matcher(fullContent)
        if (noteMatcher.find()) {
            note = noteMatcher.group(1)?.trim()
        } else {
            val fallbackMatcher = NOTE_FALLBACK_PATTERN.matcher(fullContent)
            if (fallbackMatcher.find()) {
                note = fallbackMatcher.group(1)?.trim()
            }
        }

        val tx = ParsedBankTransaction(
            bankCode = bank.code,
            bankName = bank.name,
            amount = matchedAmount,
            type = if (isExpense) "expense" else "income",
            accountNumber = accountNumber,
            content = note ?: title.take(50),
            timestamp = timestamp,
            rawTitle = title,
            rawText = text,
            packageName = packageName
        )
        return ParseResult.Success(tx)
    }

    fun parse(
        packageName: String,
        title: String,
        text: String,
        subText: String = "",
        bigText: String = "",
        timestamp: Long = System.currentTimeMillis()
    ): ParsedBankTransaction? {
        return when (val res = parseWithDiagnostic(packageName, title, text, subText, bigText, timestamp)) {
            is ParseResult.Success -> res.transaction
            is ParseResult.Ignored -> null
        }
    }
}
