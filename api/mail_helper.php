<?php
// ============================================
// Mail Helper — Email Verification & Password Reset
// ============================================

/**
 * Get SMTP settings from database.
 */
function getSmtpSettings()
{
    global $pdo;
    $keys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_email', 'smtp_from_name'];
    $placeholders = implode(',', array_fill(0, count($keys), '?'));
    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ($placeholders)");
    $stmt->execute($keys);
    $rows = $stmt->fetchAll();
    $settings = [];
    foreach ($rows as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    return $settings;
}

/**
 * Send email via SMTP using fsockopen (no external deps).
 */
function sendSmtpEmail($to, $subject, $htmlBody, $smtp)
{
    $host = $smtp['smtp_host'];
    $port = (int)($smtp['smtp_port'] ?: 587);
    $user = $smtp['smtp_user'];
    $pass = $smtp['smtp_pass'];
    $fromEmail = $smtp['smtp_from_email'] ?: $user;
    $fromName = $smtp['smtp_from_name'] ?: 'DuitKu';

    try {
        $conn = @fsockopen(($port == 465 ? 'ssl://' : '') . $host, $port, $errno, $errstr, 10);
        if (!$conn)
            return false;

        $resp = fgets($conn, 512);

        fputs($conn, "EHLO localhost\r\n");
        while ($line = fgets($conn, 512)) {
            if (substr($line, 3, 1) == ' ')
                break;
        }

        // STARTTLS for port 587
        if ($port == 587) {
            fputs($conn, "STARTTLS\r\n");
            fgets($conn, 512);
            stream_socket_enable_crypto($conn, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            fputs($conn, "EHLO localhost\r\n");
            while ($line = fgets($conn, 512)) {
                if (substr($line, 3, 1) == ' ')
                    break;
            }
        }

        // AUTH LOGIN
        fputs($conn, "AUTH LOGIN\r\n");
        fgets($conn, 512);
        fputs($conn, base64_encode($user) . "\r\n");
        fgets($conn, 512);
        fputs($conn, base64_encode($pass) . "\r\n");
        $authResp = fgets($conn, 512);
        if (substr($authResp, 0, 3) != '235') {
            fclose($conn);
            return false;
        }

        fputs($conn, "MAIL FROM:<$fromEmail>\r\n");
        fgets($conn, 512);
        fputs($conn, "RCPT TO:<$to>\r\n");
        fgets($conn, 512);
        fputs($conn, "DATA\r\n");
        fgets($conn, 512);

        $headers = "From: $fromName <$fromEmail>\r\n";
        $headers .= "To: $to\r\n";
        $headers .= "Subject: $subject\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "Date: " . date('r') . "\r\n";
        $headers .= "\r\n";

        fputs($conn, $headers . $htmlBody . "\r\n.\r\n");
        $dataResp = fgets($conn, 512);

        fputs($conn, "QUIT\r\n");
        fclose($conn);

        return substr($dataResp, 0, 3) == '250';
    }
    catch (Exception $e) {
        return false;
    }
}

/**
 * Send verification email with a 6-digit code.
 * Uses SMTP if configured, otherwise falls back to PHP mail() / logging.
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

    // Try SMTP first if configured
    $smtp = getSmtpSettings();
    $sent = false;

    if (!empty($smtp['smtp_host']) && !empty($smtp['smtp_user']) && !empty($smtp['smtp_pass'])) {
        $sent = sendSmtpEmail($email, $subject, $body, $smtp);
    }

    // Fallback to PHP mail()
    if (!$sent) {
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $fromEmail = !empty($smtp['smtp_from_email']) ? $smtp['smtp_from_email'] : 'noreply@duitku.app';
        $headers .= "From: $fromEmail\r\n";
        $sent = @mail($email, $subject, $body, $headers);
    }

    // Log for development
    $logDir = __DIR__ . '/../uploads/';
    if (!is_dir($logDir))
        mkdir($logDir, 0755, true);
    $logFile = $logDir . 'mail_log.txt';
    $timestamp = date('Y-m-d H:i:s');
    $method = !empty($smtp['smtp_host']) ? 'SMTP' : 'mail()';
    $logEntry = "[$timestamp] To: $email | Type: $type | Code: $code | Method: $method | Sent: " . ($sent ? 'YES' : 'NO') . "\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);

    return $sent;
}

/**
 * Test SMTP connection. Returns success/error.
 */
function testSmtpConnection($smtp)
{
    $host = $smtp['smtp_host'] ?? '';
    $port = (int)($smtp['smtp_port'] ?? 587);
    $user = $smtp['smtp_user'] ?? '';
    $pass = $smtp['smtp_pass'] ?? '';

    if (empty($host) || empty($user) || empty($pass)) {
        return ['success' => false, 'error' => 'Host, username, dan password SMTP wajib diisi'];
    }

    try {
        $conn = @fsockopen(($port == 465 ? 'ssl://' : '') . $host, $port, $errno, $errstr, 10);
        if (!$conn) {
            return ['success' => false, 'error' => "Tidak dapat terhubung ke $host:$port — $errstr"];
        }

        $resp = fgets($conn, 512);

        fputs($conn, "EHLO localhost\r\n");
        while ($line = fgets($conn, 512)) {
            if (substr($line, 3, 1) == ' ')
                break;
        }

        if ($port == 587) {
            fputs($conn, "STARTTLS\r\n");
            $tlsResp = fgets($conn, 512);
            if (substr($tlsResp, 0, 3) != '220') {
                fclose($conn);
                return ['success' => false, 'error' => 'STARTTLS gagal: ' . trim($tlsResp)];
            }
            stream_socket_enable_crypto($conn, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            fputs($conn, "EHLO localhost\r\n");
            while ($line = fgets($conn, 512)) {
                if (substr($line, 3, 1) == ' ')
                    break;
            }
        }

        fputs($conn, "AUTH LOGIN\r\n");
        fgets($conn, 512);
        fputs($conn, base64_encode($user) . "\r\n");
        fgets($conn, 512);
        fputs($conn, base64_encode($pass) . "\r\n");
        $authResp = fgets($conn, 512);

        fputs($conn, "QUIT\r\n");
        fclose($conn);

        if (substr($authResp, 0, 3) == '235') {
            return ['success' => true, 'message' => 'Koneksi SMTP berhasil! ✅'];
        }
        else {
            return ['success' => false, 'error' => 'Autentikasi gagal: ' . trim($authResp)];
        }
    }
    catch (Exception $e) {
        return ['success' => false, 'error' => 'Error: ' . $e->getMessage()];
    }
}
