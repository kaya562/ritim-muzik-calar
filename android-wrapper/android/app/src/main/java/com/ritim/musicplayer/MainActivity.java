package com.ritim.musicplayer;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(MusicLibraryPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
