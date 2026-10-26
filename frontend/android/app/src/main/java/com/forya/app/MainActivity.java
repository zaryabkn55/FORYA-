package com.forya.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins defined in this project must be registered before the bridge starts.
        registerPlugin(SubjectLiftPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
