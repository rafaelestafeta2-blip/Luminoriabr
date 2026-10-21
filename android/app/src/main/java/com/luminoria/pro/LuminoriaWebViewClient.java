package com.luminoria.pro;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.net.http.SslError;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.Map;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

public class LuminoriaWebViewClient extends BridgeWebViewClient {

    private static final String IPTV_USER_AGENT = "VLC/3.0.18 LibVLC/3.0.18";
    private final Activity activity;
    private static SSLSocketFactory trustAllSslFactory;
    private static final HostnameVerifier TRUST_ALL_HOSTNAMES = (hostname, session) -> true;

    static {
        try {
            TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    @Override
                    public void checkClientTrusted(X509Certificate[] chain, String authType) {}
                    @Override
                    public void checkServerTrusted(X509Certificate[] chain, String authType) {}
                    @Override
                    public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                }
            };
            SSLContext sc = SSLContext.getInstance("TLS");
            sc.init(null, trustAllCerts, new SecureRandom());
            trustAllSslFactory = sc.getSocketFactory();
        } catch (Exception ignored) {}
    }

    public LuminoriaWebViewClient(Bridge bridge, Activity activity) {
        super(bridge);
        this.activity = activity;
    }

    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        // Allow self-signed IPTV CDN certificates for media streams
        handler.proceed();
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        if (uri == null) return false;
        String urlStr = uri.toString();

        if (urlStr.startsWith("intent://")) {
            try {
                Intent intent = Intent.parseUri(urlStr, Intent.URI_INTENT_SCHEME);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try {
                    activity.startActivity(intent);
                    return true;
                } catch (ActivityNotFoundException e) {
                    intent.setPackage(null);
                    Intent chooser = Intent.createChooser(intent, "Escolher Player de Vídeo");
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(chooser);
                    return true;
                }
            } catch (Exception ignored) {
                return true;
            }
        }

        if (urlStr.startsWith("vlc://") || urlStr.startsWith("wvc-x-callback://") || urlStr.startsWith("vnd.youtube:")) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(intent);
            } catch (Exception ignored) {}
            return true;
        }

        return super.shouldOverrideUrlLoading(view, request);
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        if (uri != null && uri.getPath() != null) {
            String path = uri.getPath();
            String targetUrl = uri.getQueryParameter("url");

            if (targetUrl != null && !targetUrl.isEmpty()) {
                if (path.equals("/api/resolve-stream")) {
                    return handleNativeResolveStream(targetUrl);
                }
                if (path.equals("/api/m3u-proxy") || path.equals("/__native_proxy__")) {
                    return handleNativeM3uProxy(targetUrl);
                }
                if (path.equals("/api/stream-proxy")) {
                    String rangeHeader = request.getRequestHeaders() != null
                        ? request.getRequestHeaders().get("Range")
                        : null;
                    return handleNativeStreamProxy(targetUrl, rangeHeader);
                }
            }
        }
        return super.shouldInterceptRequest(view, request);
    }

    public static HttpURLConnection openFollowedConnection(String targetUrl, String rangeHeader, int timeoutMs) throws Exception {
        String currentUrl = targetUrl;
        for (int i = 0; i < 6; i++) {
            URL url = new URL(currentUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            if (conn instanceof HttpsURLConnection && trustAllSslFactory != null) {
                ((HttpsURLConnection) conn).setSSLSocketFactory(trustAllSslFactory);
                ((HttpsURLConnection) conn).setHostnameVerifier(TRUST_ALL_HOSTNAMES);
            }
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs);
            conn.setRequestProperty("User-Agent", IPTV_USER_AGENT);
            conn.setRequestProperty("Accept", "*/*");
            if (rangeHeader != null && !rangeHeader.isEmpty()) {
                conn.setRequestProperty("Range", rangeHeader);
            }

            int code = conn.getResponseCode();
            if (code >= 300 && code < 400) {
                String loc = conn.getHeaderField("Location");
                conn.disconnect();
                if (loc != null && !loc.isEmpty()) {
                    currentUrl = new URL(url, loc).toString();
                    continue;
                }
            }
            return conn;
        }
        throw new Exception("Too many redirects");
    }

    private WebResourceResponse handleNativeResolveStream(String targetUrl) {
        String resolved = targetUrl;
        try {
            HttpURLConnection conn = openFollowedConnection(targetUrl, null, 10000);
            resolved = conn.getURL().toString();
            conn.disconnect();
        } catch (Exception ignored) {}
        String json = "{\"ok\":true,\"originalUrl\":\"" + targetUrl.replace("\"", "\\\"") +
            "\",\"resolvedUrl\":\"" + resolved.replace("\"", "\\\"") + "\"}";
        return buildJsonResponse(json, 200);
    }

    private WebResourceResponse handleNativeM3uProxy(String targetUrl) {
        try {
            HttpURLConnection conn = openFollowedConnection(targetUrl, null, 35000);
            InputStream is = conn.getInputStream();
            Map<String, String> headers = buildCorsHeaders();
            headers.put("Content-Type", "text/plain; charset=utf-8");
            return new WebResourceResponse("text/plain", "UTF-8", 200, "OK", headers, is);
        } catch (Exception e) {
            String err = "{\"error\":\"" + String.valueOf(e.getMessage()).replace("\"", "'") + "\"}";
            return buildJsonResponse(err, 502);
        }
    }

    private WebResourceResponse handleNativeStreamProxy(String targetUrl, String rangeHeader) {
        try {
            HttpURLConnection conn = openFollowedConnection(targetUrl, rangeHeader, 20000);
            int status = conn.getResponseCode();
            String finalUrl = conn.getURL().toString();
            String contentType = conn.getContentType() != null ? conn.getContentType().toLowerCase() : "";

            if (contentType.contains("mpegurl") || finalUrl.toLowerCase().contains(".m3u8")) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder rewritten = new StringBuilder();
                URL baseUrl = conn.getURL();
                String line;
                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                        rewritten.append(line).append("\n");
                    } else {
                        String absUrl = new URL(baseUrl, trimmed).toString();
                        rewritten.append("/api/stream-proxy?url=")
                            .append(Uri.encode(absUrl))
                            .append("\n");
                    }
                }
                reader.close();
                byte[] bytes = rewritten.toString().getBytes(StandardCharsets.UTF_8);
                Map<String, String> headers = buildCorsHeaders();
                headers.put("Content-Type", "application/vnd.apple.mpegurl");
                return new WebResourceResponse(
                    "application/vnd.apple.mpegurl",
                    "UTF-8",
                    200,
                    "OK",
                    headers,
                    new ByteArrayInputStream(bytes)
                );
            }

            Map<String, String> headers = buildCorsHeaders();
            headers.put("Accept-Ranges", "bytes");
            String contentRange = conn.getHeaderField("Content-Range");
            if (contentRange != null) headers.put("Content-Range", contentRange);
            String contentLen = conn.getHeaderField("Content-Length");
            if (contentLen != null) headers.put("Content-Length", contentLen);

            String mime = contentType.contains("mp2t") || finalUrl.endsWith(".ts")
                ? "video/mp2t"
                : "video/mp4";
            int safeStatus = (status == 206 || status == 200) ? status : 200;
            String reason = safeStatus == 206 ? "Partial Content" : "OK";
            return new WebResourceResponse(mime, null, safeStatus, reason, headers, conn.getInputStream());
        } catch (Exception e) {
            return buildJsonResponse("{\"error\":\"Stream error\"}", 502);
        }
    }

    private Map<String, String> buildCorsHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        headers.put("Access-Control-Allow-Headers", "Range, Content-Type, Authorization");
        headers.put("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
        headers.put("Cache-Control", "no-cache");
        return headers;
    }

    private WebResourceResponse buildJsonResponse(String json, int status) {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        return new WebResourceResponse(
            "application/json",
            "UTF-8",
            status,
            status == 200 ? "OK" : "Error",
            buildCorsHeaders(),
            new ByteArrayInputStream(bytes)
        );
    }
}
