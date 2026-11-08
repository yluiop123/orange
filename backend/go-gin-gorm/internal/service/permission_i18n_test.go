package service

import "testing"

func TestLocalizedPermissionNameFallback(t *testing.T) {
	tests := []struct {
		name         string
		locale       string
		translations map[string]string
		fallback     string
		want         string
	}{
		{
			name:         "exact locale",
			locale:       "en-US",
			translations: map[string]string{"en-US": "US English", "en": "English"},
			fallback:     "仪表盘",
			want:         "US English",
		},
		{
			name:         "exact locale is case insensitive",
			locale:       "EN-us",
			translations: map[string]string{"en-US": "US English", "en": "English"},
			fallback:     "仪表盘",
			want:         "US English",
		},
		{
			name:         "language part before dash",
			locale:       "en-GB",
			translations: map[string]string{"en": "English"},
			fallback:     "仪表盘",
			want:         "English",
		},
		{
			name:         "language lookup is case insensitive",
			locale:       "EN-gb",
			translations: map[string]string{"EN": "English"},
			fallback:     "仪表盘",
			want:         "English",
		},
		{
			name:         "language locale falls back directly",
			locale:       "zh",
			translations: map[string]string{"zh-CN": "仪表盘（中国）"},
			fallback:     "仪表盘",
			want:         "仪表盘",
		},
		{
			name:         "unknown locale uses default name",
			locale:       "fr",
			translations: map[string]string{"en": "English"},
			fallback:     "仪表盘",
			want:         "仪表盘",
		},
		{
			name:         "blank locale uses default name",
			locale:       "  ",
			translations: map[string]string{"en": "English"},
			fallback:     "仪表盘",
			want:         "仪表盘",
		},
		{
			name:         "blank translation uses default name",
			locale:       "en",
			translations: map[string]string{"en": "   "},
			fallback:     "仪表盘",
			want:         "仪表盘",
		},
		{
			name:         "nil translations use default name",
			locale:       "en",
			translations: nil,
			fallback:     "仪表盘",
			want:         "仪表盘",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := localizedPermissionName(test.locale, test.translations, test.fallback); got != test.want {
				t.Fatalf("localizedPermissionName(%q) = %q, want %q", test.locale, got, test.want)
			}
		})
	}
}
