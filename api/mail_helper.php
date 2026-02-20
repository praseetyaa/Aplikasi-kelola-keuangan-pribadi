<?php
// ============================================
// Mail Helper — Email Verification & Password Reset
// ============================================

/**
 * Send verification email with a 6-digit code.
 * On localhost: logs to file + returns code in API response.
 * For production: replace with PHPMailer/SMTP.
 */
function sendVerificationEmail($email, $code, $type = 'register')
{
    $subject = $type === 'register'
        ? 'Kode Verifikasi Pendaftaran'
        : 'Kode Reset Password';

    $typeLabel = $type === 'register' ? 'mendaftar' : 'mereset password';

    $body = "
    <html>
    <body style='font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px;'>
        <div style='max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid rgba(255,255,255,0.06);'>
            <h2 style='color: #10b981; margin-bottom: 8px;'>$subject</h2>
            <p style='color: #94a3b8;'>Kode verifikasi untuk $typeLabel:</p>
            <div style='background: #0f172a; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;'>
                <span style='font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981;'>$code</span>
            </div>
            <p style='color: #64748b; font-size: 14px;'>Kode ini berlaku selama 10 menit. Jangan bagikan kode ini ke siapapun.</p>
        </div>
    </body>
    </html>";

    // Try PHP mail() first
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: noreply@duitku.app\r\n";

    $sent = @mail($email, $subject, $body, $headers);

    // Log for development
    $logDir = __DIR__ . '/../uploads/';
    if (!is_dir($logDir))
        mkdir($logDir, 0755, true);
    $logFile = $logDir . 'mail_log.txt';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] To: $email | Type: $type | Code: $code | Sent: " . ($sent ? 'YES' : 'NO') . "\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);

    return $sent;
}
