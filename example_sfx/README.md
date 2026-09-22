# Example SFX Library Structure

This folder shows how your SFX library should be organized for best results with ATUL X SFX plugin.

## Recommended Structure

```
Your_SFX_Pack/
├── Whooshes/
│   ├── Whoosh_Fast_01.wav
│   ├── Whoosh_Slow_02.wav
│   └── Whoosh_SciFi_03.wav
├── Impacts/
│   ├── Impact_Heavy_01.wav
│   ├── Impact_Soft_02.mp3
│   └── Impact_Cinematic_03.wav
├── Transitions/
│   ├── Transition_Swoosh_01.wav
│   ├── Transition_Glitch_02.wav
│   └── Transition_Riser_03.wav
├── Risers/
│   ├── Riser_4sec_01.wav
│   ├── Riser_8sec_02.wav
│   └── Riser_Tension_03.wav
├── UI/
│   ├── UI_Click_01.wav
│   ├── UI_Pop_02.wav
│   └── UI_Notification_03.mp3
└── Bass/
    ├── Bass_Drop_01.wav
    ├── Bass_Hit_02.wav
    └── Bass_Sub_03.wav
```

## Why This Works

- **Auto-categories**: Plugin auto-detects categories from folder names and file names
- **Fast search**: Descriptive names = better search results
- **Scalable**: Add as many subfolders as you want (up to 8 levels deep)

## Supported Formats

- WAV (recommended for quality)
- MP3
- AIFF / AIF
- M4A
- OGG
- FLAC
- WMA
- AAC

## Tips for Sellers

1. Keep file names clean: `Category_Descriptor_Number.wav`
2. Use consistent naming
3. Include 100-500 sounds for premium feel
4. Provide this structure as ZIP to customers
5. Customers will select the root folder in plugin onboarding

## For Testing

Place some audio files in this folder structure and point the plugin to it.
If you don't have SFX files, create dummy .wav files for UI testing.
