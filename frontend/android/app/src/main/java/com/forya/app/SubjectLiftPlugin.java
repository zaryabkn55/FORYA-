package com.forya.app;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.segmentation.subject.Subject;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions;

import java.io.ByteArrayOutputStream;
import java.util.List;

/**
 * Lifts the clothing out of a wardrobe photo, on the device.
 *
 * Uses ML Kit Subject Segmentation, which runs locally through Google Play services. The model is
 * downloaded once by Play services rather than bundled, so the first call on a fresh device can
 * fail while that happens — which is exactly why this resolves with lifted=false instead of
 * rejecting. The app then stores the original photo, and the next attempt usually succeeds.
 *
 * Doing this on the phone rather than the server is deliberate: the server-side model peaked at
 * over a gigabyte of memory, against a 512MB container.
 */
@CapacitorPlugin(name = "SubjectLift")
public class SubjectLiftPlugin extends Plugin {

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject ret = new JSObject();
        // Play services may still need to fetch the model, but the API is present on any device
        // with Play services, so report support and let lift() degrade if it cannot run.
        ret.put("supported", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void lift(PluginCall call) {
        String base64 = call.getString("image");
        if (base64 == null) {
            call.reject("That photo could not be read.");
            return;
        }

        Bitmap source;
        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            source = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (IllegalArgumentException e) {
            call.reject("That photo could not be read.");
            return;
        }
        if (source == null) {
            call.reject("That photo could not be read.");
            return;
        }

        SubjectSegmenterOptions options = new SubjectSegmenterOptions.Builder()
                .enableForegroundBitmap()
                .build();
        SubjectSegmenter segmenter = SubjectSegmentation.getClient(options);
        InputImage input = InputImage.fromBitmap(source, 0);

        segmenter.process(input)
                .addOnSuccessListener(result -> {
                    Bitmap foreground = result.getForegroundBitmap();
                    List<Subject> subjects = result.getSubjects();
                    if (foreground == null || subjects == null || subjects.isEmpty()) {
                        resolveUnlifted(call);
                        return;
                    }
                    try {
                        Bitmap trimmed = trimTransparent(foreground);
                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        trimmed.compress(Bitmap.CompressFormat.PNG, 100, out);

                        JSObject ret = new JSObject();
                        ret.put("supported", true);
                        ret.put("lifted", true);
                        ret.put("image", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
                        ret.put("width", trimmed.getWidth());
                        ret.put("height", trimmed.getHeight());
                        call.resolve(ret);
                    } catch (Exception e) {
                        resolveUnlifted(call);
                    } finally {
                        segmenter.close();
                    }
                })
                .addOnFailureListener(e -> {
                    // Usually the Play services model is still downloading. Not a lost photo.
                    segmenter.close();
                    resolveUnlifted(call);
                });
    }

    private void resolveUnlifted(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supported", true);
        ret.put("lifted", false);
        call.resolve(ret);
    }

    /**
     * Crops away the fully transparent border so the piece fills its tile in the wardrobe grid
     * rather than floating in empty pixels. iOS gets this from croppedToInstancesExtent; ML Kit
     * returns a full-size bitmap, so we do it here.
     */
    private Bitmap trimTransparent(Bitmap src) {
        int w = src.getWidth();
        int h = src.getHeight();
        int[] row = new int[w];
        int top = 0, bottom = h - 1, left = w, right = -1;
        boolean seen = false;

        for (int y = 0; y < h; y++) {
            src.getPixels(row, 0, w, 0, y, w, 1);
            int rowLeft = -1, rowRight = -1;
            for (int x = 0; x < w; x++) {
                if ((row[x] >>> 24) > 8) {
                    if (rowLeft < 0) rowLeft = x;
                    rowRight = x;
                }
            }
            if (rowLeft >= 0) {
                if (!seen) { top = y; seen = true; }
                bottom = y;
                if (rowLeft < left) left = rowLeft;
                if (rowRight > right) right = rowRight;
            }
        }

        if (!seen || right < left) return src; // nothing opaque; hand back what we had

        // A little breathing room, kept inside the bitmap.
        int pad = Math.max(2, Math.min(w, h) / 100);
        left = Math.max(0, left - pad);
        top = Math.max(0, top - pad);
        right = Math.min(w - 1, right + pad);
        bottom = Math.min(h - 1, bottom + pad);

        return Bitmap.createBitmap(src, left, top, right - left + 1, bottom - top + 1);
    }
}
