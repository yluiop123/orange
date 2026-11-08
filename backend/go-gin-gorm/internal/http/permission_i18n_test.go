package http

import (
	"strings"
	"testing"
)

func TestValidatePermissionTranslations(t *testing.T) {
	tests := []struct {
		name         string
		translations map[string]string
		wantOK       bool
	}{
		{name: "nil is not provided", translations: nil, wantOK: true},
		{name: "empty map is valid", translations: map[string]string{}, wantOK: true},
		{name: "language and region", translations: map[string]string{"en": "English", "en-US": "US English", "zh-CN": "简体中文"}, wantOK: true},
		{name: "lowercase region", translations: map[string]string{"en-us": "US English"}, wantOK: true},
		{name: "255 runes is valid", translations: map[string]string{"en": strings.Repeat("名", 255)}, wantOK: true},
		{name: "language must be two lowercase letters", translations: map[string]string{"EN": "English"}},
		{name: "language must be exactly two letters", translations: map[string]string{"eng": "English"}},
		{name: "region must be two letters", translations: map[string]string{"en-USA": "US English"}},
		{name: "underscore separator is rejected", translations: map[string]string{"en_US": "US English"}},
		{name: "blank name is rejected", translations: map[string]string{"en": "   "}},
		{name: "name longer than 255 runes is rejected", translations: map[string]string{"en": strings.Repeat("a", 256)}},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validatePermissionTranslations(test.translations)
			if test.wantOK {
				if err != nil {
					t.Fatalf("validatePermissionTranslations() = %v, want nil", err)
				}
				return
			}
			if err == nil {
				t.Fatal("validatePermissionTranslations() = nil, want a validation error")
			}
			fields, ok := err.Data.(map[string]string)
			if !ok || fields["translations"] == "" {
				t.Fatalf("error data = %#v, want a translations field message", err.Data)
			}
		})
	}
}
