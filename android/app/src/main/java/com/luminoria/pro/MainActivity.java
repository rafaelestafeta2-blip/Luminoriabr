package com.luminoria.pro;

import android.app.Dialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.MediaController;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.VideoView;
import com.getcapacitor.BridgeActivity;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends BridgeActivity {

    private Dialog activeNativePlayerDialog;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureWebViewForMedia();
    }

    @Override
    public void onStart() {
        super.onStart();
        configureWebViewForMedia();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWebViewForMedia();
    }

    private void configureWebViewForMedia() {
        if (this.bridge == null || this.bridge.getWebView() == null) {
            return;
        }
        WebView webView = this.bridge.getWebView();
        WebSettings settings = webView.getSettings();
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        this.bridge.setWebViewClient(new LuminoriaWebViewClient(this.bridge, this));

        try {
            webView.removeJavascriptInterface("AndroidNativeBridge");
        } catch (Exception ignored) {}
        webView.addJavascriptInterface(new AndroidNativeBridge(), "AndroidNativeBridge");
    }

    public class AndroidNativeBridge {

        @JavascriptInterface
        public void openInAppNativePlayer(String streamUrl, String title) {
            if (streamUrl == null || streamUrl.trim().isEmpty()) return;
            String cleanUrl = extractCleanStreamUrl(streamUrl.trim());
            runOnUiThread(() -> showNativeVideoDialog(cleanUrl, title != null ? title : "Luminoria Pro"));
        }

        @JavascriptInterface
        public void openExternalPlayer(String streamUrl, String title, String packageName) {
            if (streamUrl == null || streamUrl.trim().isEmpty()) return;
            String cleanUrl = extractCleanStreamUrl(streamUrl.trim());
            runOnUiThread(() -> launchExternalPlayerIntent(cleanUrl, title, packageName));
        }
    }

    private String extractCleanStreamUrl(String rawUrl) {
        try {
            if (rawUrl.contains("url=")) {
                int idx = rawUrl.indexOf("url=");
                String queryVal = rawUrl.substring(idx + 4);
                int amp = queryVal.indexOf('&');
                if (amp != -1) queryVal = queryVal.substring(0, amp);
                return URLDecoder.decode(queryVal, "UTF-8");
            }
        } catch (Exception ignored) {}
        return rawUrl;
    }

    private void showNativeVideoDialog(String streamUrl, String title) {
        if (activeNativePlayerDialog != null && activeNativePlayerDialog.isShowing()) {
            activeNativePlayerDialog.dismiss();
        }

        Dialog dialog = new Dialog(this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
        activeNativePlayerDialog = dialog;

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        root.setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        VideoView videoView = new VideoView(this);
        FrameLayout.LayoutParams videoLp = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        videoLp.gravity = Gravity.CENTER;
        root.addView(videoView, videoLp);

        MediaController mediaController = new MediaController(this);
        mediaController.setAnchorView(videoView);
        videoView.setMediaController(mediaController);

        ProgressBar spinner = new ProgressBar(this);
        spinner.setIndeterminate(true);
        FrameLayout.LayoutParams spinLp = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        spinLp.gravity = Gravity.CENTER;
        root.addView(spinner, spinLp);

        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setBackgroundColor(Color.parseColor("#E6090A10"));
        topBar.setPadding(24, 20, 24, 20);
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        FrameLayout.LayoutParams topLp = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        topLp.gravity = Gravity.TOP;

        TextView backBtn = new TextView(this);
        backBtn.setText("← Voltar ao App");
        backBtn.setTextColor(Color.BLACK);
        backBtn.setBackgroundColor(Color.parseColor("#06B6D4"));
        backBtn.setPadding(24, 14, 24, 14);
        backBtn.setTextSize(13);
        backBtn.setOnClickListener(v -> dialog.dismiss());
        topBar.addView(backBtn);

        TextView titleView = new TextView(this);
        titleView.setText("  " + title);
        titleView.setTextColor(Color.WHITE);
        titleView.setTextSize(14);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        topBar.addView(titleView, titleLp);

        TextView extBtn = new TextView(this);
        extBtn.setText("Abrir no VLC / Externo");
        extBtn.setTextColor(Color.parseColor("#F59E0B"));
        extBtn.setBackgroundColor(Color.parseColor("#26F59E0B"));
        extBtn.setPadding(20, 14, 20, 14);
        extBtn.setTextSize(12);
        extBtn.setOnClickListener(v -> launchExternalPlayerIntent(streamUrl, title, null));
        topBar.addView(extBtn);

        root.addView(topBar, topLp);

        videoView.setOnPreparedListener(mp -> spinner.setVisibility(View.GONE));
        videoView.setOnErrorListener((mp, what, extra) -> {
            spinner.setVisibility(View.GONE);
            launchExternalPlayerIntent(streamUrl, title, null);
            return true;
        });

        dialog.setOnDismissListener(d -> {
            try {
                videoView.stopPlayback();
            } catch (Exception ignored) {}
        });

        dialog.setContentView(root);
        dialog.show();

        try {
            Map<String, String> headers = new HashMap<>();
            headers.put("User-Agent", "VLC/3.0.18 LibVLC/3.0.18");
            videoView.setVideoURI(Uri.parse(streamUrl), headers);
            videoView.start();
        } catch (Exception e) {
            launchExternalPlayerIntent(streamUrl, title, null);
        }
    }

    private void launchExternalPlayerIntent(String streamUrl, String title, String packageName) {
        try {
            Uri uri = Uri.parse(streamUrl);
            String lower = streamUrl.toLowerCase();
            String mime = lower.contains(".m3u8") ? "application/x-mpegURL" : "video/*";

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, mime);
            intent.putExtra("title", title != null ? title : "Luminoria Pro");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);

            if (packageName != null && !packageName.trim().isEmpty()) {
                intent.setPackage(packageName.trim());
                try {
                    startActivity(intent);
                    return;
                } catch (ActivityNotFoundException e) {
                    intent.setPackage(null);
                }
            }

            Intent chooser = Intent.createChooser(intent, "Reproduzir: " + (title != null ? title : "Luminoria Pro"));
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(chooser);
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Intent.ACTION_VIEW, Uri.parse(streamUrl));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(fallback);
            } catch (Exception ignored) {}
        }
    }
}
